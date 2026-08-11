import { createHash, randomBytes } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  session,
  shell,
  type IpcMainInvokeEvent,
  type Rectangle
} from "electron";
import { z } from "zod";
import { AiService } from "./ai-service";
import { appConfigSchema, publicConfig, type AppConfig, type SecretName } from "./app-config";
import { AutoHypeEngine } from "./auto-hype";
import { ConfigStore } from "./config-store";
import { createDiagnosticBundle } from "./diagnostics";
import { LiveRuntime, type LiveEvent } from "./live-runtime";
import { LocalStageServer } from "./local-server";
import { StructuredLogger } from "./logger";
import { SecretStore } from "./secret-store";
import { ServiceSupervisor } from "./service-supervisor";
import { SpeechService } from "./speech-service";
import { loadWindowState, persistWindowState } from "./window-state";

app.setName("OrbitStage Live");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const isE2E = process.env.ORBITSTAGE_E2E === "1";
// `npm start` runs the built local app without a Vite server.  Keep the
// development server opt-in so that command can load the bundled control UI.
const isDevelopment = !isE2E && (process.env.ORBITSTAGE_DEV === "1" || (!app.isPackaged && process.env.ORBITSTAGE_DEV !== "0"));
if (isE2E && process.env.ORBITSTAGE_USER_DATA && path.isAbsolute(process.env.ORBITSTAGE_USER_DATA)) {
  app.setPath("userData", path.resolve(process.env.ORBITSTAGE_USER_DATA));
}
const gotSingleInstanceLock = isE2E || app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) app.quit();

let controlWindow: BrowserWindow | undefined;
let stageWindow: BrowserWindow | undefined;
let configStore: ConfigStore;
let secretStore: SecretStore;
let logger: StructuredLogger;
let localServer: LocalStageServer;
let liveRuntime: LiveRuntime;
let aiService: AiService;
let speechService: SpeechService;
let autoHype: AutoHypeEngine;
let serviceSupervisor: ServiceSupervisor;
let currentConfig: AppConfig;
let healthTimer: NodeJS.Timeout | undefined;
const localApiToken = randomBytes(32).toString("base64url");

function appPaths() {
  const appRoot = app.getAppPath();
  // When Electron receives a compiled main file directly, its app path is
  // `apps/desktop/dist`; when started through the workspace dev script it is
  // `apps/desktop`. Both need to resolve static assets from the repository
  // root, while a packaged application already has that layout at appPath.
  const root = app.isPackaged
    ? appRoot
    : path.basename(appRoot) === "dist"
      ? path.resolve(appRoot, "..", "..", "..")
      : path.basename(appRoot) === "desktop"
        ? path.resolve(appRoot, "..", "..")
        // Playwright launches Electron with the repository directory as its
        // app path. In that case it is already the root; resolving parents
        // would point the control window at a non-existent index.html.
        : appRoot;
  return {
    root,
    controlIndex: path.join(root, "apps", "control", "dist", "index.html"),
    stageRoot: path.join(root, "apps", "stage", "dist"),
    packagedAssets: app.isPackaged ? path.join(process.resourcesPath, "assets") : path.join(root, "assets"),
    userAssets: path.join(app.getPath("userData"), "assets")
  };
}

function stageUrl(source: "window" | "obs" = "obs"): string {
  const port = localServer?.port ?? currentConfig?.live.localPort ?? 17_321;
  const audioEnabled = source === "obs"
    ? currentConfig?.stage.audioOwner === "obs"
    : currentConfig?.stage.audioOwner === "stage-window";
  return `http://127.0.0.1:${port}/stage?source=${source}&audio=${audioEnabled ? "1" : "0"}`;
}

function sendTo(window: BrowserWindow | undefined, event: { type: string; payload?: unknown }): void {
  if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) window.webContents.send("runtime:event", event);
}

function flattenedStageEvent(event: LiveEvent): Record<string, unknown> {
  const viewer = event.viewer;
  const gift = event.gift;
  return {
    ...event,
    viewer,
    ...(viewer ? {
      userId: viewer.id,
      name: viewer.name,
      nickname: viewer.name,
      avatar: viewer.avatar ?? "",
      level: viewer.level,
      badge: viewer.title
    } : {}),
    ...(gift ? {
      giftName: gift.name,
      giftCount: gift.count,
      diamonds: gift.diamonds,
      superGift: gift.super,
      giftImage: gift.image ?? ""
    } : {})
  };
}

function emitRuntime(event: { type: string; payload?: unknown }): void {
  const controlAliases: Record<string, string> = {
    snapshot: "runtime:snapshot",
    connection: "runtime:connection"
  };
  sendTo(controlWindow, { ...event, type: controlAliases[event.type] ?? event.type });
  if (!localServer) return;
  if (event.type === "live-event") {
    const liveEvent = event.payload as LiveEvent;
    const stageEvent = { type: liveEvent.type, payload: flattenedStageEvent(liveEvent) };
    localServer.broadcast(stageEvent.type, stageEvent.payload);
    sendTo(stageWindow, stageEvent);
    autoHype?.handleEvent(liveEvent);
    return;
  }
  if (event.type === "connection") {
    const connected = event.payload === "connected";
    const stageEvent = { type: connected ? "connected" : "disconnected", payload: { live: connected && liveRuntime.running } };
    localServer.broadcast(stageEvent.type, stageEvent.payload);
    sendTo(stageWindow, stageEvent);
    return;
  }
  if (event.type === "music" && event.payload && typeof event.payload === "object") {
    const music = event.payload as AppConfig["music"];
    const track = music.playlist?.find((item) => item.id === music.currentTrackId);
    if (track && music.playing) void autoHype?.trigger(`DJ vừa chuyển sang bài ${track.title}`);
  }
  localServer.broadcast(event.type, event.payload);
  sendTo(stageWindow, event);
}

function assertControlSender(event: IpcMainInvokeEvent): void {
  if (!controlWindow || event.sender.id !== controlWindow.webContents.id) throw new Error("IPC request is not allowed from this window");
}

function assertInternalSender(event: IpcMainInvokeEvent): void {
  const senderId = event.sender.id;
  const trusted = [controlWindow, stageWindow].some((window) => window && !window.isDestroyed() && window.webContents.id === senderId);
  if (!trusted) throw new Error("IPC request is not allowed from this window");
}

function handle(
  channel: string,
  handler: (event: IpcMainInvokeEvent, payload: unknown) => unknown | Promise<unknown>,
  controlOnly = true
): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, async (event, payload) => {
    if (controlOnly) assertControlSender(event);
    try {
      return await handler(event, payload);
    } catch (error) {
      logger.error("ipc.failed", error, { channel });
      throw new Error(error instanceof Error ? error.message : "IPC request failed");
    }
  });
}

function configureSessionSecurity(): void {
  const defaultSession = session.defaultSession;
  defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  defaultSession.setPermissionCheckHandler(() => false);
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith("file:")) return callback({ responseHeaders: details.responseHeaders });
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'",
          "base-uri 'none'",
          "connect-src 'self'",
          "font-src 'self' data:",
          "frame-ancestors 'none'",
          "img-src 'self' data: blob: http://127.0.0.1:*",
          "media-src 'self' data: blob:",
          "object-src 'none'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'"
        ].join("; ")
      }
    });
  });
}

function guardWindow(window: BrowserWindow, allowed: (url: URL) => boolean): void {
  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:") void shell.openExternal(parsed.toString());
    } catch {
      // Deny malformed external navigation.
    }
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    try {
      if (allowed(new URL(url))) return;
    } catch {
      // Deny malformed navigation.
    }
    event.preventDefault();
  });
  let crashCount = 0;
  window.webContents.on("render-process-gone", (_event, details) => {
    logger.error("renderer.gone", new Error(details.reason), { exitCode: details.exitCode, title: window.getTitle() });
    if (!["clean-exit", "killed"].includes(details.reason) && crashCount < 3 && !window.isDestroyed()) {
      crashCount += 1;
      setTimeout(() => { if (!window.isDestroyed()) void window.reload(); }, 1_000 * crashCount);
    }
  });
}

async function createControlWindow(): Promise<BrowserWindow> {
  const fallback: Rectangle = { x: 100, y: 70, width: 1_360, height: 860 };
  const state = await loadWindowState(app.getPath("userData"), "control", fallback);
  const window = new BrowserWindow({
    ...state,
    title: "OrbitStage Live — Control Room",
    minWidth: 1_060,
    minHeight: 700,
    backgroundColor: "#080b16",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      spellcheck: false,
      devTools: isDevelopment
    }
  });
  controlWindow = window;
  guardWindow(window, (url) => isDevelopment
    ? url.origin === new URL(process.env.VITE_CONTROL_URL ?? "http://127.0.0.1:5173").origin
    : url.protocol === "file:");
  window.once("ready-to-show", () => window.show());
  window.on("close", () => persistWindowState(app.getPath("userData"), "control", window));
  window.on("closed", () => { controlWindow = undefined; });
  if (state.maximized) window.maximize();
  if (isDevelopment) await window.loadURL(process.env.VITE_CONTROL_URL ?? "http://127.0.0.1:5173");
  else await window.loadFile(appPaths().controlIndex);
  return window;
}

async function createStageWindow(): Promise<BrowserWindow> {
  if (stageWindow && !stageWindow.isDestroyed()) {
    stageWindow.show();
    stageWindow.focus();
    return stageWindow;
  }
  const fallback: Rectangle = { x: 180, y: 80, width: 540, height: 960 };
  const state = await loadWindowState(app.getPath("userData"), "stage", fallback);
  const window = new BrowserWindow({
    ...state,
    title: "OrbitStage Live — Stage 9:16",
    minWidth: 360,
    minHeight: 640,
    backgroundColor: "#050713",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      spellcheck: false,
      devTools: isDevelopment
    }
  });
  stageWindow = window;
  window.setAspectRatio(9 / 16);
  guardWindow(window, (url) => {
    const localOrigin = `http://127.0.0.1:${localServer.port}`;
    const devOrigin = new URL(process.env.VITE_STAGE_URL ?? "http://127.0.0.1:5174").origin;
    return url.origin === localOrigin || (isDevelopment && url.origin === devOrigin);
  });
  window.once("ready-to-show", () => window.show());
  window.on("close", () => persistWindowState(app.getPath("userData"), "stage", window));
  window.on("closed", () => { stageWindow = undefined; });
  if (state.maximized) window.maximize();
  await window.loadURL(stageUrl("window"));
  stageWindow = window;
  return window;
}

async function startServerWithFallback(preferredPort: number): Promise<number> {
  let lastError: unknown;
  for (let offset = 0; offset < 10; offset += 1) {
    const port = preferredPort + offset;
    try {
      await localServer.start(port);
      if (offset > 0) {
        currentConfig = await configStore.update({ live: { localPort: port } });
        logger.warn("local_server.port_fallback", { preferredPort, port });
      }
      return port;
    } catch (error) {
      lastError = error;
      await localServer.stop().catch(() => undefined);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Không tìm thấy port local khả dụng");
}

async function restartServerIfNeeded(previous: AppConfig, next: AppConfig): Promise<AppConfig> {
  if (previous.live.localPort === next.live.localPort) return next;
  await localServer.stop();
  try {
    await localServer.start(next.live.localPort);
    return next;
  } catch (error) {
    logger.error("local_server.port_change_failed", error, { requestedPort: next.live.localPort });
    await localServer.stop().catch(() => undefined);
    currentConfig = await configStore.replace(previous);
    await localServer.start(previous.live.localPort);
    throw new Error(`Port ${next.live.localPort} không khả dụng; đã khôi phục port ${previous.live.localPort}.`);
  }
}

async function hashFile(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

const assetRules = {
  image: { extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"], filters: [{ name: "Hình ảnh", extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"] }] },
  video: { extensions: [".mp4", ".webm"], filters: [{ name: "Video", extensions: ["mp4", "webm"] }] },
  audio: { extensions: [".mp3", ".m4a", ".ogg", ".opus", ".wav"], filters: [{ name: "Âm thanh", extensions: ["mp3", "m4a", "ogg", "opus", "wav"] }] },
  model: { extensions: [".json", ".model3.json", ".glb", ".gltf"], filters: [{ name: "Model", extensions: ["json", "glb", "gltf"] }] }
} as const;

async function importUserAsset(kind: keyof typeof assetRules): Promise<string | undefined> {
  const result = await dialog.showOpenDialog(controlWindow!, {
    properties: ["openFile"],
    filters: assetRules[kind].filters.map((filter) => ({ name: filter.name, extensions: [...filter.extensions] }))
  });
  const selected = result.filePaths[0];
  if (result.canceled || !selected) return undefined;
  const stat = await fs.stat(selected);
  if (!stat.isFile() || stat.size > 250 * 1024 * 1024) throw new Error("Asset phải là file nhỏ hơn 250 MB.");
  const lower = selected.toLowerCase();
  const extension = assetRules[kind].extensions.find((candidate) => lower.endsWith(candidate));
  if (!extension) throw new Error("Định dạng asset không được hỗ trợ.");
  const hash = await hashFile(selected);
  const safeStem = path.basename(selected).slice(0, -extension.length).normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "asset";
  const fileName = `${safeStem}-${hash.slice(0, 12)}${extension}`;
  const destination = path.join(appPaths().userAssets, fileName);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(selected, destination);
  const registryPath = path.join(appPaths().userAssets, "registry.user.jsonl");
  await fs.appendFile(registryPath, `${JSON.stringify({ id: `user-${hash.slice(0, 20)}`, kind, file: fileName, originalName: path.basename(selected), sha256: hash, size: stat.size, rights: "user-supplied-unverified", importedAt: new Date().toISOString() })}\n`, "utf8");
  logger.info("asset.imported", { kind, fileName, size: stat.size });
  return `http://127.0.0.1:${localServer.port}/user-assets/${encodeURIComponent(fileName)}`;
}

async function applyConfigPatch(patch: unknown): Promise<AppConfig> {
  const previous = currentConfig;
  let next = await configStore.update(patch);
  next = await restartServerIfNeeded(previous, next);
  currentConfig = next;
  liveRuntime.updateConfig(next);
  autoHype.refresh();
  emitRuntime({ type: "config", payload: { led: next.led, stage: next.stage, characters: next.characters, music: next.music } });
  return publicConfig(next);
}

function registerIpc(): void {
  handle("runtime:get-snapshot", () => liveRuntime.snapshot(), false);
  handle("stage:get-snapshot", () => liveRuntime.stageSnapshot(), false);
  handle("stage:get-url", () => stageUrl("obs"), false);
  handle("wish:list", (event) => {
    assertInternalSender(event);
    return liveRuntime.wishes();
  }, false);
  handle("wish:set-visible", (event, payload) => {
    assertInternalSender(event);
    const { id, visible } = z.object({ id: z.string().trim().min(1).max(256), visible: z.boolean() }).parse(payload);
    return liveRuntime.setWishVisible(id, visible);
  }, false);
  handle("wish:remove", (event, payload) => {
    assertInternalSender(event);
    const { id } = z.object({ id: z.string().trim().min(1).max(256) }).parse(payload);
    return liveRuntime.removeWish(id);
  }, false);
  handle("config:get", () => publicConfig(currentConfig));
  handle("config:patch", (_event, payload) => applyConfigPatch(payload));
  handle("config:export", async () => {
    const target = await dialog.showSaveDialog(controlWindow!, { defaultPath: "orbitstage-config.json", filters: [{ name: "OrbitStage config", extensions: ["json"] }] });
    if (target.canceled || !target.filePath) return undefined;
    await fs.writeFile(target.filePath, `${JSON.stringify(publicConfig(currentConfig), null, 2)}\n`, "utf8");
    return target.filePath;
  });
  handle("config:import", async () => {
    const picked = await dialog.showOpenDialog(controlWindow!, { properties: ["openFile"], filters: [{ name: "OrbitStage config", extensions: ["json"] }] });
    const filePath = picked.filePaths[0];
    if (picked.canceled || !filePath) return undefined;
    if ((await fs.stat(filePath)).size > 1_000_000) throw new Error("Config import quá lớn.");
    const value = appConfigSchema.parse(JSON.parse(await fs.readFile(filePath, "utf8")) as unknown);
    const previous = currentConfig;
    currentConfig = await configStore.replace(value);
    currentConfig = await restartServerIfNeeded(previous, currentConfig);
    liveRuntime.updateConfig(currentConfig);
    autoHype.refresh();
    return publicConfig(currentConfig);
  });
  handle("live:start", () => liveRuntime.start());
  handle("live:stop", () => liveRuntime.stop());
  handle("live:fake-event", (_event, payload) => liveRuntime.fake(payload));
  handle("stage:open", async () => {
    await createStageWindow();
    return { opened: true };
  });
  handle("character:action", async (_event, payload) => {
    const { action } = z.object({ action: z.enum(["greet", "beat", "reset"]) }).parse(payload);
    await createStageWindow();
    emitRuntime({ type: "character_action", payload: { action, timestamp: Date.now() } });
    return { action };
  });
  handle("game:action", async (_event, payload) => {
    const { action } = z.object({ action: z.literal("restart") }).parse(payload);
    await createStageWindow();
    emitRuntime({ type: "game_action", payload: { action, timestamp: Date.now() } });
    return { action };
  });
  handle("music:control", (_event, payload) => {
    const parsed = z.object({ action: z.enum(["play", "pause", "next", "previous", "stop", "volume"]), value: z.number().min(0).max(100).optional() }).parse(payload);
    return liveRuntime.musicControl(parsed.action, parsed.value);
  });
  handle("music:ended", (event) => {
    assertInternalSender(event);
    return liveRuntime.musicControl("next");
  }, false);
  handle("asset:select", (_event, payload) => {
    const parsed = z.object({ kind: z.enum(["image", "video", "audio", "model"]) }).parse(payload);
    return importUserAsset(parsed.kind);
  });
  handle("ai:test", async (_event, payload) => {
    const { prompt } = z.object({ prompt: z.string().min(1).max(4_000) }).parse(payload);
    const result = await aiService.generate(prompt);
    emitRuntime({ type: "ai-caption", payload: { text: result.text, source: "test" } });
    return result;
  });
  handle("tts:test", async (_event, payload) => {
    const { text } = z.object({ text: z.string().min(1).max(4_096) }).parse(payload);
    const safe = aiService.safeText(text);
    await speechService.enqueue(safe, "test");
  });
  handle("secret:set", async (_event, payload) => {
    const { name, value } = z.object({ name: z.literal("aiApiKey"), value: z.string().max(16_384) }).parse(payload);
    await secretStore.set(name as SecretName, value);
    return { saved: Boolean(value) };
  });
  handle("secret:status", () => secretStore.status());
  handle("diagnostics:health", () => ({
    ...liveRuntime.health(),
    localServer: localServer.port ? "ok" : "error",
    websocketClients: localServer.clientCount,
    supervisor: serviceSupervisor.snapshot()
  }), false);
  handle("diagnostics:export", async () => {
    const bundle = await createDiagnosticBundle({
      config: currentConfig,
      health: liveRuntime.health(),
      logger,
      outputDirectory: path.join(app.getPath("userData"), "diagnostics")
    });
    const save = await dialog.showSaveDialog(controlWindow!, { defaultPath: path.basename(bundle), filters: [{ name: "ZIP", extensions: ["zip"] }] });
    if (save.canceled || !save.filePath) return bundle;
    await fs.copyFile(bundle, save.filePath);
    return save.filePath;
  });
}

async function bootstrap(): Promise<void> {
  const dataDirectory = app.getPath("userData");
  logger = new StructuredLogger(dataDirectory);
  configStore = new ConfigStore(dataDirectory);
  secretStore = new SecretStore(dataDirectory);
  currentConfig = await configStore.load();
  const paths = appPaths();
  await fs.mkdir(paths.userAssets, { recursive: true });

  liveRuntime = new LiveRuntime({
    config: currentConfig,
    dataDirectory,
    logger,
    stageUrl: () => stageUrl("obs"),
    onEvent: emitRuntime,
    onConfigPatch: async (patch) => {
      currentConfig = await configStore.update(patch);
      return currentConfig;
    }
  });
  await liveRuntime.initialize();
  localServer = new LocalStageServer({
    stageRoot: paths.stageRoot,
    assetRoot: paths.packagedAssets,
    userAssetRoot: paths.userAssets,
    ...(isDevelopment ? { devStageUrl: process.env.VITE_STAGE_URL ?? "http://127.0.0.1:5174" } : {}),
    token: localApiToken,
    logger,
    getSnapshot: () => ({
      appVersion: app.getVersion(),
      liveStatus: liveRuntime.running ? "running" : "stopped",
      tikfinityStatus: liveRuntime.connection,
      startedAt: new Date(Date.now() - process.uptime() * 1_000).toISOString(),
      config: { led: currentConfig.led, stage: currentConfig.stage, characters: currentConfig.characters, music: currentConfig.music },
      stage: liveRuntime.stageSnapshot()
    }),
    onFakeEvent: (value) => liveRuntime.fake(value)
  });
  await startServerWithFallback(currentConfig.live.localPort);
  liveRuntime.updateConfig(currentConfig);

  aiService = new AiService({ getConfig: () => currentConfig, getApiKey: () => secretStore.get("aiApiKey"), logger });
  speechService = new SpeechService({
    cacheDirectory: path.join(dataDirectory, "tts-cache"),
    getConfig: () => currentConfig,
    getApiKey: () => secretStore.get("aiApiKey"),
    logger,
    onQueueDepth: (depth) => liveRuntime.setSpeechQueueDepth(depth),
    onAudio: (payload) => {
      localServer.broadcast("tts-audio", payload);
      sendTo(stageWindow, { type: "tts-audio", payload });
      sendTo(controlWindow, { type: "tts-status", payload: { speaking: true, text: payload.text, source: payload.source } });
    }
  });
  autoHype = new AutoHypeEngine({
    getConfig: () => currentConfig,
    ai: aiService,
    speech: speechService,
    logger,
    onCaption: (text, source) => emitRuntime({ type: "ai-caption", payload: { text, source } })
  });
  autoHype.refresh();
  serviceSupervisor = new ServiceSupervisor(logger);
  serviceSupervisor.register({
    name: "local-server",
    healthy: () => Boolean(localServer.port),
    restart: async () => {
      await localServer.stop().catch(() => undefined);
      await localServer.start(currentConfig.live.localPort);
    }
  });
  serviceSupervisor.register({
    name: "tikfinity",
    healthy: () => !liveRuntime.running || liveRuntime.connection !== "error",
    restart: () => {
      if (!liveRuntime.running) return;
      liveRuntime.stop();
      liveRuntime.start();
    }
  });
  serviceSupervisor.start();

  registerIpc();
  controlWindow = await createControlWindow();
  logger.info("app.ready", { version: app.getVersion(), packaged: app.isPackaged, port: localServer.port });
  healthTimer = setInterval(() => emitRuntime({ type: "health", payload: liveRuntime.health() }), 10_000);
  healthTimer.unref();
}

app.on("second-instance", () => {
  if (!controlWindow) return;
  if (controlWindow.isMinimized()) controlWindow.restore();
  controlWindow.show();
  controlWindow.focus();
});

app.whenReady().then(async () => {
  configureSessionSecurity();
  await bootstrap();
}).catch((error) => {
  logger?.error("app.bootstrap_failed", error);
  dialog.showErrorBox("OrbitStage không thể khởi động", error instanceof Error ? error.message : String(error));
  app.exit(1);
});

app.on("activate", () => {
  if (!controlWindow) void createControlWindow().then((window) => { controlWindow = window; });
});

app.on("before-quit", () => {
  if (healthTimer) clearInterval(healthTimer);
  autoHype?.stop();
  serviceSupervisor?.stop();
  speechService?.clear();
  liveRuntime?.shutdown();
  void localServer?.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

process.on("uncaughtException", (error) => logger?.error("process.uncaught_exception", error));
process.on("unhandledRejection", (error) => logger?.error("process.unhandled_rejection", error));

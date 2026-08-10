import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { _electron as electron, type ElectronApplication } from "playwright";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tempRoot = path.resolve(tmpdir());

const screens = [
  { navigation: "Điều khiển LIVE", heading: "Điều khiển LIVE" },
  { navigation: "LED sân khấu", heading: "LED sân khấu" },
  { navigation: "Tùy chỉnh", heading: "Tùy chỉnh sân khấu" },
  { navigation: "Nhân vật", heading: "Nhân vật" },
  { navigation: "AI MC / DJ", heading: "AI MC / DJ" },
  { navigation: "Test LIVE", heading: "Test LIVE" },
] as const;
const danceSpriteFrames = [34, 17, 8, 20, 17, 17, 6, 10, 17, 17, 17, 17, 17, 17] as const;

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function auditViewerIds(): string[] {
  const ids: string[] = [];
  for (let sprite = 0; sprite < danceSpriteFrames.length; sprite += 1) {
    let candidate = 0;
    while (stableHash(`audit-${candidate}`) % danceSpriteFrames.length !== sprite) candidate += 1;
    ids.push(`audit-${candidate}`);
  }
  return ids;
}

let electronApp: ElectronApplication;
let controlPage: Page;
let userDataDirectory: string;
let aiStub: Server;
let aiStubBaseUrl: string;

async function removeTemporaryProfile(directory: string): Promise<void> {
  const resolved = path.resolve(directory);
  const isExpectedChild = path.dirname(resolved) === tempRoot && path.basename(resolved).startsWith("orbitstage-e2e-");
  if (!isExpectedChild) throw new Error(`Refusing to remove unexpected E2E profile: ${resolved}`);
  await rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
}

async function attachPng(testInfo: TestInfo, name: string, page: Page, animations: "allow" | "disabled" = "disabled"): Promise<void> {
  await testInfo.attach(name, { body: await page.screenshot({ animations }), contentType: "image/png" });
}

test.describe.serial("OrbitStage Electron", () => {
  test.beforeAll(async () => {
    aiStub = createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      response.setHeader("Cache-Control", "no-store");
      if (request.method === "POST" && requestUrl.pathname === "/v1/responses") {
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ output_text: "E2E AI caption: pipeline an to\u00e0n s\u00e0ng s\u00e0ng." }));
        return;
      }
      if (request.method === "POST" && requestUrl.pathname === "/v1/audio/speech") {
        // The assertion observes the renderer event, not a network TTS provider.
        // A small recognizable audio-like payload keeps this entirely local.
        response.setHeader("Content-Type", "audio/mpeg");
        response.end(Buffer.from("ID3\u0003\u0000\u0000\u0000\u0000\u0000\u000fE2E-TTS", "binary"));
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    await new Promise<void>((resolve, reject) => {
      aiStub.once("error", reject);
      aiStub.listen(0, "127.0.0.1", () => resolve());
    });
    const address = aiStub.address();
    if (!address || typeof address === "string") throw new Error("Could not allocate local AI test server");
    aiStubBaseUrl = `http://127.0.0.1:${address.port}/v1`;
    userDataDirectory = await mkdtemp(path.join(tempRoot, "orbitstage-e2e-"));
    const launchEnvironment = { ...process.env };
    delete launchEnvironment.ELECTRON_RUN_AS_NODE;
    launchEnvironment.ORBITSTAGE_E2E = "1";
    launchEnvironment.ORBITSTAGE_USER_DATA = userDataDirectory;

    electronApp = await electron.launch({
      // Launch the repository package, not main.cjs directly, so app.getAppPath()
      // resolves to the repository root and packaged renderer paths stay valid.
      args: [projectRoot],
      cwd: projectRoot,
      env: launchEnvironment,
      timeout: 30_000,
    });
    controlPage = await electronApp.firstWindow();
    await controlPage.waitForLoadState("domcontentloaded");
    await expect(controlPage.getByRole("heading", { level: 1, name: "Điều khiển LIVE" })).toBeVisible();
  });

  test.afterAll(async () => {
    await electronApp?.close().catch(() => undefined);
    await new Promise<void>((resolve) => aiStub?.close(() => resolve()));
    if (userDataDirectory) await removeTemporaryProfile(userDataDirectory);
  });

  test("uses the isolated preload bridge and exposes all six control screens", async ({}, testInfo) => {
    const securityState = await controlPage.evaluate(() => ({
      hasBridge: typeof window.orbitStage === "object",
      hasNodeProcess: typeof (globalThis as typeof globalThis & { process?: unknown }).process !== "undefined",
      hasRequire: typeof (globalThis as typeof globalThis & { require?: unknown }).require !== "undefined",
    }));
    expect(securityState).toEqual({ hasBridge: true, hasNodeProcess: false, hasRequire: false });

    for (const screen of screens) {
      await controlPage.getByRole("button", { name: new RegExp(`^${screen.navigation}`) }).click();
      await expect(controlPage.getByRole("heading", { level: 1, name: screen.heading })).toBeVisible();
    }

    await attachPng(testInfo, "control-six-tabs", controlPage);
  });

  test("opens the real Stage window and renders a fake gift sent through IPC", async ({}, testInfo) => {
    const stageWindowPromise = electronApp.waitForEvent("window");
    await controlPage.getByRole("button", { name: "Mở Stage", exact: true }).click();
    const stagePage = await stageWindowPromise;
    await stagePage.waitForLoadState("domcontentloaded");
    await expect(stagePage.locator(".stage")).toBeVisible();
    await expect(stagePage.getByText("ORBITSTAGE", { exact: true }).first()).toBeVisible();
    await expect.poll(async () => stagePage.locator('.live2d-host').evaluate((node) => ({ failed: node.classList.contains('failed'), canvasWidth: node.querySelector('canvas')?.width ?? 0 })), { timeout: 15_000 }).toEqual({ failed: false, canvasWidth: expect.any(Number) });
    expect(await stagePage.locator('.live2d-canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width)).toBeGreaterThan(0);
    const mcPosition = await stagePage.locator('.stage-character.nova').evaluate((node) => {
      const character = node.getBoundingClientRect();
      const stage = node.closest('.stage')?.getBoundingClientRect();
      return { characterCenter: character.left + character.width / 2, stageCenter: stage ? stage.left + stage.width / 2 : 0 };
    });
    expect(Math.abs(mcPosition.characterCenter - mcPosition.stageCenter)).toBeLessThan(2);

    await controlPage.getByRole("button", { name: /^Nhân vật/ }).click();
    await expect(controlPage.locator('.character-art img')).toHaveCount(2);
    await expect.poll(async () => controlPage.locator('.character-art img').evaluateAll((images) => images.map((image) => ({ src: (image as HTMLImageElement).currentSrc, naturalWidth: (image as HTMLImageElement).naturalWidth })))).toEqual([
      { src: expect.stringContaining('/project-assets/dual-host/luna/closed.png'), naturalWidth: expect.any(Number) },
      { src: expect.stringContaining('/project-assets/dual-host/ryan/closed.png'), naturalWidth: expect.any(Number) },
    ]);
    expect(await controlPage.locator('.character-art img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await attachPng(testInfo, 'control-character-audit', controlPage);
    await controlPage.getByRole('button', { name: 'Test chào' }).click();
    await expect(stagePage.locator('.stage-character.nova')).toHaveClass(/action-greet/);
    await controlPage.getByRole('button', { name: 'Đặt lại pose' }).click();
    await expect(stagePage.locator('.stage-character.nova')).not.toHaveClass(/action-greet/);

    for (const [index, id] of auditViewerIds().entries()) {
      await controlPage.evaluate(async ({ id, index }) => {
        const bridge = (globalThis as typeof globalThis & { orbitStage: { sendFakeEvent: (event: unknown) => Promise<unknown> } }).orbitStage;
        await bridge.sendFakeEvent({ type: 'join', viewer: { id, name: `Audit ${index + 1}`, level: index + 1 } });
      }, { id, index });
      await expect.poll(async () => stagePage.locator('.floor-actor').evaluateAll((actors) => actors.filter((actor) => actor.querySelector('.floor-actor-name b')?.textContent?.startsWith('Audit ')).length)).toBe(index + 1);
    }
    await expect.poll(async () => stagePage.locator('.floor-actor').evaluateAll((actors) => actors.filter((actor) => actor.querySelector('.floor-actor-name b')?.textContent?.startsWith('Audit ')).length)).toBe(14);
    const spriteAudit = await stagePage.locator('.floor-actor').evaluateAll((actors) => actors.filter((actor) => actor.querySelector('.floor-actor-name b')?.textContent?.startsWith('Audit ')).map((actor) => {
      const sprite = actor.querySelector<HTMLElement>('.floor-actor-sprite');
      const file = sprite?.style.backgroundImage.match(/char-(\d{2})-sheet\.png/)?.[1];
      return { file: Number(file), backgroundSize: sprite?.style.backgroundSize, spriteTravel: sprite?.style.getPropertyValue('--sprite-travel'), spriteCount: actor.querySelectorAll('.floor-actor-sprite').length };
    }));
    expect(new Set(spriteAudit.map((item) => item.file)).size).toBe(14);
    spriteAudit.forEach((item) => {
      expect(item.spriteCount).toBe(1);
      expect(item.backgroundSize).toBe('auto 100%');
      expect(item.spriteTravel).toBe(`${danceSpriteFrames[item.file - 1] * 14}cqw`);
    });

    await controlPage.getByRole("button", { name: /^Test LIVE/ }).click();
    await expect(controlPage.getByRole("heading", { level: 1, name: "Test LIVE" })).toBeVisible();
    await controlPage.getByLabel("Tên người xem").fill("E2E Nova");
    await controlPage.getByLabel("Level").fill("24");
    await controlPage.getByLabel("Tên quà").fill("E2E Comet");
    await controlPage.getByLabel("Số lượng").fill("2");
    await controlPage.getByLabel("Lời chúc").fill("E2E pipeline đã kết nối");
    await controlPage.getByRole("button", { name: "Phát event lên Stage" }).click();

    await expect(controlPage.getByText("Đã gửi event gift vào pipeline.", { exact: true })).toBeVisible();
    await expect(stagePage.getByRole("heading", { level: 2, name: "E2E Comet" })).toBeVisible({ timeout: 8_000 });
    await expect(stagePage.getByText("E2E Nova", { exact: true }).first()).toBeVisible();
    await expect(stagePage.locator(".floor-actor").filter({ hasText: "E2E Nova" })).toBeVisible();
    await expect(stagePage.locator(".floor-actor").filter({ hasText: "E2E Nova" }).locator(".floor-actor-sprite")).toHaveCSS("background-image", /char-\d{2}-sheet\.png/);
    await expect(stagePage.locator(".floor-actor").filter({ hasText: "E2E Nova" }).locator(".floor-actor-sprite")).not.toHaveCSS("background-image", /vip\d-sheet\.png/);
    await expect(stagePage.getByText("×2", { exact: true }).first()).toBeVisible();
    await expect(stagePage.locator(".chat-bubble").filter({ hasText: "E2E Comet ×2" })).toHaveCount(1);

    // Keep finite gift animation at its current frame. Disabling animations
    // fast-forwards gift-enter to its intentionally transparent end state.
    await attachPng(testInfo, "stage-fake-gift", stagePage, "allow");
    await stagePage.close();
  });

  test("uses local AI/TTS stubs and preserves Stage state after reopening", async ({}, testInfo) => {
    const stageWindowPromise = electronApp.waitForEvent("window");
    await controlPage.getByRole("button", { name: "M\u1edf Stage", exact: true }).click();
    let stagePage = await stageWindowPromise;
    await stagePage.waitForLoadState("domcontentloaded");

    const localPort = await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { getSnapshot: () => Promise<{ localPort: number }> } }).orbitStage;
      return (await bridge.getSnapshot()).localPort;
    });
    await controlPage.evaluate(async ({ endpoint, musicPath }) => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.invoke("config:patch", {
        ai: { enabled: true, provider: "openai", endpoint, model: "e2e-model", contentFilter: true, ttsProvider: "openai" },
        music: {
          playlist: [{ id: "e2e-loop", title: "E2E Loop", path: musicPath, rights: "placeholder" }],
          currentTrackId: "e2e-loop",
          playing: true,
          volume: 42
        }
      });
      await bridge.invoke("secret:set", { name: "aiApiKey", value: "e2e-local-test-token" });
    }, { endpoint: aiStubBaseUrl, musicPath: `http://127.0.0.1:${localPort}/project-assets/music/placeholder-loop.wav` });

    const aiResult = await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<{ text: string }> } }).orbitStage;
      return bridge.invoke("ai:test", { prompt: "Ch\u00e0o OrbitStage" });
    });
    expect(aiResult.text).toContain("E2E AI caption");
    await expect(stagePage.getByText("E2E AI caption: pipeline an to\u00e0n s\u00e0ng s\u00e0ng.", { exact: true })).toBeVisible();

    await stagePage.evaluate(() => {
      const bridge = (globalThis as typeof globalThis & { orbitStage?: { subscribe?: (listener: (event: { type: string; payload?: unknown }) => void) => (() => void) } }).orbitStage;
      (globalThis as typeof globalThis & { __ttsEventPromise?: Promise<{ source?: string; text?: string }> }).__ttsEventPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Did not receive TTS event")), 8_000);
        const unsubscribe = bridge?.subscribe?.((event) => {
          if (event.type !== "tts-audio") return;
          clearTimeout(timer);
          unsubscribe?.();
          resolve(event.payload as { source?: string; text?: string });
        });
      });
    });
    await controlPage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { invoke: (channel: string, payload?: unknown) => Promise<unknown> } }).orbitStage;
      await bridge.invoke("tts:test", { text: "E2E TTS kh\u00f4ng ch\u1ed3ng gi\u1ecdng" });
    });
    const ttsEvent = await stagePage.evaluate(() => (globalThis as typeof globalThis & { __ttsEventPromise: Promise<{ source?: string; text?: string }> }).__ttsEventPromise);
    await expect(ttsEvent).toMatchObject({ source: "test", text: "E2E TTS kh\u00f4ng ch\u1ed3ng gi\u1ecdng" });

    await stagePage.close();
    const reopenedPromise = electronApp.waitForEvent("window");
    await controlPage.getByRole("button", { name: "M\u1edf Stage", exact: true }).click();
    stagePage = await reopenedPromise;
    await stagePage.waitForLoadState("domcontentloaded");
    await expect(stagePage.getByText("E2E Nova", { exact: true }).first()).toBeVisible();
    const rehydrated = await stagePage.evaluate(async () => {
      const bridge = (globalThis as typeof globalThis & { orbitStage: { getStageSnapshot: () => Promise<{ music: { title: string; playing: boolean; volume: number } }> } }).orbitStage;
      return bridge.getStageSnapshot();
    });
    expect(rehydrated.music).toMatchObject({ title: "E2E Loop", playing: true, volume: 42 });
    await attachPng(testInfo, "stage-reopened-continuity", stagePage);
  });
});

import { contextBridge, ipcRenderer } from "electron";

const INVOKE_CHANNELS = new Set([
  "runtime:get-snapshot",
  "config:get",
  "config:patch",
  "config:export",
  "config:import",
  "live:start",
  "live:stop",
  "live:fake-event",
  "stage:open",
  "stage:get-url",
  "stage:get-snapshot",
  "wish:list",
  "wish:set-visible",
  "wish:remove",
  "music:control",
  "music:ended",
  "asset:select",
  "ai:test",
  "tts:test",
  "diagnostics:export",
  "diagnostics:health",
  "secret:set",
  "secret:status"
]);

function invoke(channel: string, payload?: unknown): Promise<unknown> {
  if (!INVOKE_CHANNELS.has(channel)) return Promise.reject(new Error(`IPC channel is not allowed: ${channel}`));
  return ipcRenderer.invoke(channel, payload);
}

function subscribe(listener: (event: { type: string; payload?: unknown }) => void): () => void {
  if (typeof listener !== "function") throw new TypeError("Listener must be a function");
  const wrapped = (_event: Electron.IpcRendererEvent, value: unknown) => {
    if (value && typeof value === "object" && typeof (value as { type?: unknown }).type === "string") {
      listener(value as { type: string; payload?: unknown });
    }
  };
  ipcRenderer.on("runtime:event", wrapped);
  return () => ipcRenderer.removeListener("runtime:event", wrapped);
}

const facade = Object.freeze({
  invoke,
  subscribe,
  on: (channel: string, listener: (payload: unknown) => void) => {
    if (channel !== "runtime:event") throw new Error("Event channel is not allowed");
    return subscribe((event) => listener(event));
  },
  getSnapshot: () => invoke("runtime:get-snapshot"),
  getStageSnapshot: () => invoke("stage:get-snapshot"),
  getConfig: () => invoke("config:get"),
  saveConfig: (patch: unknown) => invoke("config:patch", patch),
  startLive: () => invoke("live:start"),
  stopLive: () => invoke("live:stop"),
  openStage: () => invoke("stage:open"),
  getStageUrl: () => invoke("stage:get-url"),
  listWishes: () => invoke("wish:list"),
  setWishVisible: (id: string, visible: boolean) => invoke("wish:set-visible", { id, visible }),
  removeWish: (id: string) => invoke("wish:remove", { id }),
  sendFakeEvent: (event: unknown) => invoke("live:fake-event", event),
  musicControl: (action: string, value?: number) => invoke("music:control", { action, value }),
  selectAsset: (kind: string) => invoke("asset:select", { kind }),
  testAi: (prompt: string) => invoke("ai:test", { prompt }),
  testTts: (text: string) => invoke("tts:test", { text }),
  exportDiagnostics: () => invoke("diagnostics:export")
});

contextBridge.exposeInMainWorld("orbitStage", facade);

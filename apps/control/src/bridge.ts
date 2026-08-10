import type { AppConfig, ConfigPatch, FakeLiveEvent, GiftWishRecord, OrbitStageFacade, RuntimeSnapshot } from './types';
import { defaultConfig, defaultSnapshot, mergeConfig } from './lib/model';

const getFacade = (): OrbitStageFacade | undefined => window.orbitStage;

let fallbackConfig = structuredClone(defaultConfig);
let fallbackSnapshot = structuredClone(defaultSnapshot);

async function invokeFallback<T>(channel: string, payload?: unknown): Promise<T | undefined> {
  const facade = getFacade();
  if (!facade?.invoke) return undefined;
  return facade.invoke(channel, payload) as Promise<T>;
}

export const bridge = {
  available: () => Boolean(getFacade()),

  async snapshot(): Promise<RuntimeSnapshot> {
    const facade = getFacade();
    if (facade?.getSnapshot) return facade.getSnapshot();
    return (await invokeFallback<RuntimeSnapshot>('runtime:get-snapshot')) ?? fallbackSnapshot;
  },

  async config(): Promise<AppConfig> {
    const facade = getFacade();
    if (facade?.getConfig) return facade.getConfig();
    return (await invokeFallback<AppConfig>('config:get')) ?? fallbackConfig;
  },

  async saveConfig(patch: ConfigPatch): Promise<AppConfig> {
    const facade = getFacade();
    const saved = facade?.saveConfig
      ? await facade.saveConfig(patch)
      : await invokeFallback<AppConfig>('config:patch', patch);
    fallbackConfig = saved ? mergeConfig(fallbackConfig, saved) : mergeConfig(fallbackConfig, patch);
    return fallbackConfig;
  },

  async startLive(): Promise<void> {
    const facade = getFacade();
    if (facade?.startLive) await facade.startLive();
    else await invokeFallback('live:start');
    fallbackSnapshot = { ...fallbackSnapshot, live: true, connection: 'connecting' };
  },

  async stopLive(): Promise<void> {
    const facade = getFacade();
    if (facade?.stopLive) await facade.stopLive();
    else await invokeFallback('live:stop');
    fallbackSnapshot = { ...fallbackSnapshot, live: false, connection: 'offline' };
  },

  async openStage(): Promise<void> {
    const facade = getFacade();
    if (facade?.openStage) await facade.openStage();
    else await invokeFallback('stage:open');
  },

  async getStageUrl(): Promise<string> {
    const facade = getFacade();
    if (facade?.getStageUrl) return facade.getStageUrl();
    return (await invokeFallback<string>('stage:get-url')) ?? fallbackSnapshot.stageUrl;
  },

  async fakeEvent(event: FakeLiveEvent): Promise<void> {
    const facade = getFacade();
    if (facade?.sendFakeEvent) await facade.sendFakeEvent(event);
    else await invokeFallback('live:fake-event', event);
  },

  async music(action: 'play' | 'pause' | 'next' | 'previous' | 'stop' | 'volume', value?: number): Promise<void> {
    const facade = getFacade();
    if (facade?.musicControl) await facade.musicControl(action, value);
    else await invokeFallback('music:control', { action, value });
  },

  async selectAsset(kind: 'image' | 'video' | 'audio' | 'model'): Promise<string | undefined> {
    const facade = getFacade();
    if (facade?.selectAsset) return facade.selectAsset(kind);
    return invokeFallback<string>('asset:select', { kind });
  },

  async characterAction(action: 'greet' | 'reset'): Promise<void> {
    const facade = getFacade();
    if (facade?.characterAction) await facade.characterAction(action);
    else await invokeFallback('character:action', { action });
  },

  async listWishes(): Promise<GiftWishRecord[]> {
    const facade = getFacade();
    if (facade?.listWishes) return facade.listWishes();
    return (await invokeFallback<GiftWishRecord[]>('wish:list')) ?? [];
  },

  async setWishVisible(id: string, visible: boolean): Promise<GiftWishRecord[]> {
    const facade = getFacade();
    if (facade?.setWishVisible) return facade.setWishVisible(id, visible);
    return (await invokeFallback<GiftWishRecord[]>('wish:set-visible', { id, visible })) ?? [];
  },

  async removeWish(id: string): Promise<GiftWishRecord[]> {
    const facade = getFacade();
    if (facade?.removeWish) return facade.removeWish(id);
    return (await invokeFallback<GiftWishRecord[]>('wish:remove', { id })) ?? [];
  },

  async testAi(prompt: string): Promise<{ text: string; latencyMs?: number }> {
    const facade = getFacade();
    const result = facade?.testAi
      ? await facade.testAi(prompt)
      : await invokeFallback<{ text?: string; latencyMs?: number } | string>('ai:test', { prompt });
    if (typeof result === 'string') return { text: result };
    return { text: result?.text ?? 'Chưa cấu hình AI provider.', latencyMs: result?.latencyMs };
  },

  async testTts(text: string): Promise<void> {
    const facade = getFacade();
    if (facade?.testTts) await facade.testTts(text);
    else await invokeFallback('tts:test', { text });
  },

  async exportDiagnostics(): Promise<string | undefined> {
    const facade = getFacade();
    if (facade?.exportDiagnostics) return facade.exportDiagnostics();
    return invokeFallback<string>('diagnostics:export');
  },

  async saveSecret(name: 'aiApiKey', value: string): Promise<void> {
    await invokeFallback('secret:set', { name, value });
  },

  async healthCheck(): Promise<Record<string, unknown>> {
    return (await invokeFallback<Record<string, unknown>>('diagnostics:health')) ?? {
      desktop: 'ok',
      localServer: 'ok',
      tikfinity: 'offline',
      aiWorker: 'idle',
    };
  },

  subscribe(listener: (event: { type: string; payload?: unknown }) => void): () => void {
    const facade = getFacade();
    if (facade?.subscribe) return facade.subscribe(listener) ?? (() => undefined);
    if (facade?.on) {
      const dispose = facade.on('runtime:event', (payload) => listener(payload as { type: string; payload?: unknown }));
      return dispose ?? (() => undefined);
    }
    return () => undefined;
  },
};

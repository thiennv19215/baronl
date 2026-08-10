import type { AppConfig, ConfigPatch, RuntimeSnapshot } from '../types';

export const defaultConfig: AppConfig = {
  live: {
    tiktokAccount: '',
    tikfinityUrl: 'ws://127.0.0.1:21213/',
    localPort: 17321,
    reconnect: true,
    spamWindowSeconds: 8,
    maxEventsPerViewer: 5,
  },
  led: {
    enabled: true,
    text: 'CHÀO MỪNG ĐẾN VỚI ORBITSTAGE',
    speed: 28,
    color: '#f8fbff',
    glowColor: '#8b5cf6',
    style: 'marquee',
  },
  stage: {
    theme: 'cosmos',
    backgroundType: 'gradient',
    backgroundSource: '',
    showChat: true,
    showLeaderboard: true,
    showLevel: true,
    showWishes: true,
    effectQuality: 'balanced',
    avatarStyle: 'neon',
    threeDEnabled: true,
    cameraMode: 'ambient',
    floorBright: true,
    lasers: true,
    ledScreens: true,
    topPodiums: true,
    autoFitCrowd: true,
    maxFloorActors: 50,
    floorWidth: 100,
    commandBoardEnabled: true,
    commandToggles: { HEY: true, QUAY: true, CAM: true, CHUC: true, NHAY: true, PARTY: true, TIM: true, HELLO: true },
  },
  characters: {
    enabled: true,
    dualHost: true,
    hostA: 'Nova',
    hostB: 'Echo',
    lipSync: true,
    blink: true,
    shuffle: false,
  },
  music: {
    playlist: [],
    currentTrackId: null,
    volume: 70,
    playing: false,
  },
  ai: {
    enabled: false,
    provider: 'openai',
    model: 'gpt-4.1-mini',
    endpoint: '',
    persona: 'Bạn là MC sân khấu thân thiện, hoạt náo ngắn gọn bằng tiếng Việt.',
    autoHype: false,
    hypeIntervalSeconds: 90,
    contentFilter: true,
    rateLimitPerMinute: 8,
    ttsProvider: 'edge',
    ttsVoice: 'vi-VN-HoaiMyNeural',
    ttsVolume: 80,
  },
};

export const defaultSnapshot: RuntimeSnapshot = {
  live: false,
  connection: 'offline',
  tikfinityUrl: 'ws://127.0.0.1:21213/',
  stageUrl: 'http://127.0.0.1:17321/stage',
  localPort: 17321,
  viewerCount: 0,
  queueDepth: 0,
  speechQueueDepth: 0,
  uptimeSeconds: 0,
  music: { title: 'Chưa chọn bản nhạc', playing: false, volume: 70 },
  health: { desktop: 'ok', localServer: 'ok', tikfinity: 'warn', aiWorker: 'ok' },
};

export function mergeConfig(current: AppConfig, patch: ConfigPatch): AppConfig {
  const result = { ...current };
  (Object.keys(patch) as (keyof AppConfig)[]).forEach((key) => {
    const value = patch[key];
    if (value) {
      // Each config section is flat by contract; secrets are persisted only by Main.
      (result[key] as Record<string, unknown>) = {
        ...(current[key] as unknown as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    }
  });
  return result;
}

export function redactSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

export function formatUptime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

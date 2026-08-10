export type ScreenId =
  | 'license'
  | 'live'
  | 'led'
  | 'customize'
  | 'characters'
  | 'ai'
  | 'test'
  | 'update';

export type ConnectionState = 'offline' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export type LiveEventType = 'join' | 'chat' | 'follow' | 'like' | 'gift';

export interface RuntimeSnapshot {
  live: boolean;
  connection: ConnectionState;
  tikfinityUrl: string;
  stageUrl: string;
  localPort: number;
  viewerCount: number;
  queueDepth: number;
  speechQueueDepth: number;
  uptimeSeconds: number;
  music?: {
    title: string;
    artist?: string;
    playing: boolean;
    volume: number;
  };
  health?: Record<string, 'ok' | 'warn' | 'error'>;
}

export interface AppConfig {
  license: {
    enabled: boolean;
    key?: string;
    serverUrl?: string;
    offlineGraceDays: number;
  };
  live: {
    tiktokAccount: string;
    tikfinityUrl: string;
    localPort: number;
    reconnect: boolean;
    spamWindowSeconds: number;
    maxEventsPerViewer: number;
  };
  led: {
    enabled: boolean;
    text: string;
    speed: number;
    color: string;
    glowColor: string;
    style: 'marquee' | 'pulse' | 'static';
  };
  stage: {
    theme: 'cosmos' | 'aurora' | 'midnight';
    backgroundType: 'gradient' | 'image' | 'video';
    backgroundSource: string;
    showChat: boolean;
    showLeaderboard: boolean;
    showLevel: boolean;
    showWishes: boolean;
    effectQuality: 'low' | 'balanced' | 'high';
    avatarStyle: 'round' | 'hex' | 'neon';
    threeDEnabled: boolean;
    cameraMode: 'ambient' | 'cinematic' | 'locked';
    floorBright: boolean;
    lasers: boolean;
    ledScreens: boolean;
    topPodiums: boolean;
  };
  characters: {
    enabled: boolean;
    dualHost: boolean;
    hostA: string;
    hostB: string;
    lipSync: boolean;
    blink: boolean;
    shuffle: boolean;
  };
  music: {
    playlist: Array<{ id: string; title: string; path: string; rights: 'owned' | 'licensed' | 'cc0' | 'placeholder' }>;
    currentTrackId: string | null;
    volume: number;
    playing: boolean;
  };
  ai: {
    enabled: boolean;
    provider: 'openai' | 'groq' | 'deepseek' | 'qwen' | 'glm' | 'grok' | 'compatible';
    model: string;
    endpoint: string;
    persona: string;
    autoHype: boolean;
    hypeIntervalSeconds: number;
    contentFilter: boolean;
    rateLimitPerMinute: number;
    ttsProvider: 'openai' | 'edge';
    ttsVoice: string;
    ttsVolume: number;
  };
  update: {
    enabled: boolean;
    feedUrl?: string;
    channel: 'stable' | 'beta';
    automaticCheck: boolean;
  };
}

export type ConfigPatch = Partial<{
  [K in keyof AppConfig]: Partial<AppConfig[K]>;
}>;

export interface FakeLiveEvent {
  type: LiveEventType;
  viewer: {
    id?: string;
    name: string;
    avatar?: string;
    level?: number;
  };
  message?: string;
  giftName?: string;
  giftCount?: number;
  diamonds?: number;
  likeCount?: number;
}

export interface UpdateSnapshot {
  currentVersion: string;
  availableVersion?: string;
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error';
  progress?: number;
  message?: string;
  signatureVerified?: boolean;
  backupReady?: boolean;
}

export interface GiftWishRecord {
  id: string;
  viewerId: string;
  viewerName: string;
  message: string;
  createdAt: string;
  visible: boolean;
}

export interface OrbitStageFacade {
  getSnapshot?: () => Promise<RuntimeSnapshot>;
  getConfig?: () => Promise<AppConfig>;
  saveConfig?: (patch: ConfigPatch) => Promise<AppConfig | void>;
  invoke?: (channel: string, payload?: unknown) => Promise<unknown>;
  on?: (event: string, listener: (payload: unknown) => void) => (() => void) | void;
  subscribe?: (listener: (event: { type: string; payload?: unknown }) => void) => (() => void) | void;
  startLive?: () => Promise<unknown>;
  stopLive?: () => Promise<unknown>;
  openStage?: () => Promise<unknown>;
  getStageUrl?: () => Promise<string>;
  sendFakeEvent?: (event: FakeLiveEvent) => Promise<unknown>;
  musicControl?: (action: 'play' | 'pause' | 'next' | 'previous' | 'stop' | 'volume', value?: number) => Promise<unknown>;
  testAi?: (prompt: string) => Promise<{ text?: string; latencyMs?: number } | string>;
  testTts?: (text: string) => Promise<unknown>;
  selectAsset?: (kind: 'image' | 'video' | 'audio' | 'model') => Promise<string | undefined>;
  exportDiagnostics?: () => Promise<string | undefined>;
  checkForUpdates?: () => Promise<UpdateSnapshot | void>;
  installUpdate?: () => Promise<unknown>;
  rollbackUpdate?: () => Promise<unknown>;
  activateLicense?: (key: string) => Promise<{ active: boolean; message?: string }>;
  listWishes?: () => Promise<GiftWishRecord[]>;
  setWishVisible?: (id: string, visible: boolean) => Promise<GiftWishRecord[]>;
  removeWish?: (id: string) => Promise<GiftWishRecord[]>;
}

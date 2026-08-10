export type StageConnection = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'error';

export interface StageViewer {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
  level: number;
  points: number;
  gifts: number;
  likes: number;
  badge?: string;
}

export interface ChatItem {
  id: string;
  viewer: StageViewer;
  message: string;
  kind: 'chat' | 'join' | 'follow' | 'gift' | 'system';
  createdAt: number;
}

export interface GiftEffect {
  id: string;
  viewer: StageViewer;
  giftName: string;
  count: number;
  diamonds: number;
  wish?: string;
  superGift: boolean;
  createdAt: number;
}

export interface GiftWishItem {
  id: string;
  viewerId: string;
  viewerName: string;
  message: string;
  createdAt: string;
  visible: boolean;
}

export interface StageAppearance {
  theme: 'cosmos' | 'aurora' | 'midnight';
  transparent: boolean;
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
}

export interface StageState {
  connection: StageConnection;
  live: boolean;
  viewerCount: number;
  led: { enabled: boolean; text: string; speed: number; color: string; glowColor: string; style: 'marquee' | 'pulse' | 'static' };
  appearance: StageAppearance;
  characters: { enabled: boolean; dualHost: boolean; hostA: string; hostB: string; lipSync: boolean; blink: boolean };
  viewers: Record<string, StageViewer>;
  leaderboard: string[];
  chats: ChatItem[];
  gifts: GiftEffect[];
  wishes: GiftWishItem[];
  spotlightViewer?: StageViewer;
  music: { title: string; artist?: string; playing: boolean; volume: number; source?: string };
  sessionLikes: number;
  speech?: { host: 'a' | 'b'; text?: string; until?: number };
  aiCaption?: { text: string; source?: string; until: number };
  stageCommand?: { name: string; until: number };
  audioOwner?: boolean;
}

export interface StageEventEnvelope {
  type?: string;
  event?: string;
  payload?: unknown;
  data?: unknown;
  timestamp?: number;
}

export type StageAction =
  | { type: 'event'; event: StageEventEnvelope }
  | { type: 'connection'; connection: StageConnection }
  | { type: 'expire'; now: number }
  | { type: 'hydrate'; state: Partial<StageState> };

export interface OrbitStageStageFacade {
  getStageSnapshot?: () => Promise<Partial<StageState>>;
  invoke?: (channel: string, payload?: unknown) => Promise<unknown>;
  subscribe?: (listener: (event: StageEventEnvelope) => void) => (() => void) | void;
  on?: (event: string, listener: (payload: unknown) => void) => (() => void) | void;
  listWishes?: () => Promise<GiftWishItem[]>;
  setWishVisible?: (id: string, visible: boolean) => Promise<GiftWishItem[]>;
  removeWish?: (id: string) => Promise<GiftWishItem[]>;
}

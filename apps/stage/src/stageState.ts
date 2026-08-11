import type { ChatItem, GiftEffect, GiftWishItem, StageAction, StageEventEnvelope, StageState, StageViewer } from './types';

export const initialStageState: StageState = {
  connection: 'connecting',
  live: false,
  viewerCount: 0,
  led: {
    enabled: true,
    text: 'CHÀO MỪNG ĐẾN VỚI ORBITSTAGE',
    speed: 28,
    color: '#f8fbff',
    glowColor: '#8b5cf6',
    style: 'marquee',
  },
  appearance: {
    gameMode: 'dance-floor',
    bambooRoundSeconds: 60,
    bambooAutoRestart: true,
    bambooLikePower: 0.08,
    bambooGiftPower: 0.8,
    bambooGreenCharacter: 'bear',
    bambooOrangeCharacter: 'dog',
    theme: 'cosmos',
    transparent: false,
    backgroundType: 'gradient',
    backgroundSource: '',
    showChat: true,
    showLeaderboard: true,
    showLevel: true,
    showWishes: true,
    effectQuality: 'balanced',
    avatarStyle: 'neon',
    threeDEnabled: true,
    danceFloorStyle: 'orbit',
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
    hostA: 'Luna',
    hostB: 'Ryan',
    lipSync: true,
    blink: true,
    shuffle: false,
  },
  viewers: {},
  leaderboard: [],
  chats: [],
  gifts: [],
  wishes: [],
  music: { title: 'Cosmic Bloom', artist: 'OrbitStage library', playing: false, volume: 70, crossfadeSeconds: 1.5, beatSensitivity: 1.4, playlist: [] },
  sessionLikes: 0,
  testBeat: 0,
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const asString = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : value == null ? fallback : String(value);
const asNumber = (value: unknown, fallback = 0): number => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const safeId = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9_\-.]+/g, '-').replace(/^-+|-+$/g, '') || 'guest';
const eventId = (prefix: string, timestamp: number, viewerId: string): string => `${prefix}-${timestamp}-${viewerId}`;

export function normalizeEnvelope(envelope: StageEventEnvelope): { type: string; payload: UnknownRecord; timestamp: number } {
  const wrapper = isRecord(envelope) ? envelope : {};
  const payloadCandidate = wrapper.payload ?? wrapper.data;
  const payload = isRecord(payloadCandidate) ? payloadCandidate : wrapper;
  const rawType = asString(wrapper.type ?? wrapper.event ?? payload.type ?? payload.event, 'unknown').toLowerCase();
  const aliases: Record<string, string> = {
    comment: 'chat', member: 'join', subscribe: 'follow', share: 'follow', connected: 'connected',
    disconnect: 'disconnected', connection_lost: 'disconnected', stage_config: 'config', config_update: 'config',
    song: 'music', music_update: 'music', room_user: 'viewer_count', roomuser: 'viewer_count',
    tts_start: 'speech_start', speech_started: 'speech_start', tts_end: 'speech_end', speech_ended: 'speech_end',
    'tts-audio': 'tts_audio', 'ai-caption': 'ai_caption', 'viewer-level-up': 'viewer_level_up', audio_ownership: 'audio_owner',
  };
  return { type: aliases[rawType] ?? rawType, payload, timestamp: asNumber(wrapper.timestamp ?? payload.timestamp, Date.now()) };
}

function viewerFrom(payload: UnknownRecord, current?: StageViewer): StageViewer {
  const user = isRecord(payload.user) ? payload.user : isRecord(payload.viewer) ? payload.viewer : payload;
  const name = asString(user.name ?? user.nickname ?? user.displayName ?? payload.nickname ?? payload.uniqueId, current?.name ?? 'Khách LIVE').slice(0, 48);
  const rawId = asString(user.id ?? user.userId ?? user.uniqueId ?? user.handle ?? payload.userId ?? payload.uniqueId, current?.id ?? name);
  return {
    id: safeId(rawId),
    name,
    handle: asString(user.handle ?? user.uniqueId ?? payload.uniqueId, current?.handle),
    avatar: asString(user.avatar ?? user.avatarUrl ?? user.profilePictureUrl ?? payload.profilePictureUrl, current?.avatar),
    level: Math.max(1, Math.min(99, asNumber(user.level ?? payload.level, current?.level ?? 1))),
    points: Math.max(0, asNumber(user.points, current?.points ?? 0)),
    gifts: Math.max(0, asNumber(user.gifts, current?.gifts ?? 0)),
    likes: Math.max(0, asNumber(user.likes, current?.likes ?? 0)),
    badge: asString(user.badge ?? user.title ?? payload.badge, current?.badge),
    motion: current?.motion,
    motionUntil: current?.motionUntil,
  };
}

function withViewer(state: StageState, payload: UnknownRecord, points = 0, gifts = 0, likes = 0): { viewer: StageViewer; viewers: Record<string, StageViewer> } {
  const candidate = viewerFrom(payload);
  const existing = state.viewers[candidate.id];
  const viewer = viewerFrom(payload, existing);
  viewer.points = (existing?.points ?? viewer.points) + points;
  viewer.gifts = (existing?.gifts ?? viewer.gifts) + gifts;
  viewer.likes = (existing?.likes ?? viewer.likes) + likes;
  return { viewer, viewers: { ...state.viewers, [viewer.id]: viewer } };
}

function calculateLeaderboard(viewers: Record<string, StageViewer>, explicit?: string[]): string[] {
  if (explicit?.length) return explicit.filter((id) => Boolean(viewers[id])).slice(0, 5);
  return Object.values(viewers).sort((a, b) => b.points - a.points || b.gifts - a.gifts || a.name.localeCompare(b.name)).slice(0, 5).map((viewer) => viewer.id);
}

function addChat(state: StageState, item: ChatItem): ChatItem[] {
  return [...state.chats, item].slice(-5);
}

function applyConfig(state: StageState, payload: UnknownRecord): StageState {
  const stageConfig = isRecord(payload.stage) ? payload.stage : isRecord(payload.appearance) ? payload.appearance : payload;
  const ledConfig = isRecord(payload.led) ? payload.led : undefined;
  const characterConfig = isRecord(payload.characters) ? payload.characters : undefined;
  const musicConfig = isRecord(payload.music) ? payload.music : undefined;
  const playlist = musicConfig && Array.isArray(musicConfig.playlist) ? musicConfig.playlist.filter(isRecord) : [];
  const selectedTrack = musicConfig ? playlist.find((track) => asString(track.id) === asString(musicConfig.currentTrackId)) : undefined;
  return {
    ...state,
    appearance: { ...state.appearance, ...(stageConfig as Partial<StageState['appearance']>) },
    led: ledConfig ? { ...state.led, ...(ledConfig as Partial<StageState['led']>) } : state.led,
    characters: characterConfig ? { ...state.characters, ...(characterConfig as Partial<StageState['characters']>) } : state.characters,
    music: musicConfig ? { ...state.music, playing: Boolean(musicConfig.playing), volume: Math.max(0, Math.min(100, asNumber(musicConfig.volume, state.music.volume))), title: asString(selectedTrack?.title, state.music.title), source: asString(selectedTrack?.path, state.music.source), currentTrackId: asString(musicConfig.currentTrackId) || null, playlist: playlist.map((track) => ({ id: asString(track.id), title: asString(track.title), path: asString(track.path) })).filter((track) => track.id && track.path), crossfadeSeconds: Math.max(0, Math.min(8, asNumber(musicConfig.crossfadeSeconds, state.music.crossfadeSeconds))), beatSensitivity: Math.max(.5, Math.min(3, asNumber(musicConfig.beatSensitivity, state.music.beatSensitivity))) } : state.music,
  };
}

export function stageReducer(state: StageState, action: StageAction): StageState {
  if (action.type === 'connection') return { ...state, connection: action.connection };
  if (action.type === 'hydrate') {
    return {
      ...state,
      ...action.state,
      appearance: { ...state.appearance, ...action.state.appearance },
      led: { ...state.led, ...action.state.led },
      characters: { ...state.characters, ...action.state.characters },
      music: { ...state.music, ...action.state.music },
    };
  }
  if (action.type === 'expire') {
    return {
      ...state,
      chats: state.chats.filter((chat) => action.now - chat.createdAt < 18_000),
      gifts: state.gifts.filter((gift) => action.now - gift.createdAt < (gift.superGift ? 11_000 : 7_000)),
      spotlightViewer: state.gifts.some((gift) => action.now - gift.createdAt < 7_000) ? state.spotlightViewer : undefined,
      speech: state.speech?.until && state.speech.until <= action.now ? undefined : state.speech,
      aiCaption: state.aiCaption?.until && state.aiCaption.until <= action.now ? undefined : state.aiCaption,
      levelUp: state.levelUp?.until && state.levelUp.until <= action.now ? undefined : state.levelUp,
      eventFx: state.eventFx?.until && state.eventFx.until <= action.now ? undefined : state.eventFx,
      characterAction: state.characterAction && state.characterAction.until <= action.now ? undefined : state.characterAction,
    };
  }

  const { type, payload, timestamp } = normalizeEnvelope(action.event);
  if (type === 'connected') return { ...state, connection: 'connected', live: payload.live !== false };
  if (type === 'disconnected') return { ...state, connection: 'reconnecting', live: false };
  if (type === 'config') return applyConfig(state, payload);
  if (type === 'snapshot') {
    // The runtime snapshot carries TikFinity's connection state, while this
    // renderer field represents its own local WS/IPC transport. A server
    // snapshot must not turn a healthy Stage transport into "offline".
    const { connection: _tikfinityConnection, ...snapshot } = payload;
    return stageReducer(state, { type: 'hydrate', state: snapshot as Partial<StageState> });
  }
  if (type === 'wishes') {
    const items = Array.isArray(payload.items) ? payload.items.filter(isRecord) : [];
    const wishes: GiftWishItem[] = items.map((item) => ({
      id: asString(item.id).slice(0, 256),
      viewerId: asString(item.viewerId).slice(0, 128),
      viewerName: asString(item.viewerName).slice(0, 100),
      message: asString(item.message).slice(0, 280),
      createdAt: asString(item.createdAt),
      visible: item.visible !== false,
    })).filter((item) => item.id && item.message);
    const byId = new Map(wishes.map((wish) => [wish.id, wish]));
    return {
      ...state,
      wishes,
      gifts: state.gifts.map((gift) => ({ ...gift, wish: byId.get(gift.id)?.visible ? byId.get(gift.id)?.message : undefined })),
    };
  }
  if (type === 'wish:remove' || type === 'wish_remove') {
    const id = asString(payload.id).slice(0, 256);
    return {
      ...state,
      wishes: state.wishes.filter((wish) => wish.id !== id),
      gifts: state.gifts.map((gift) => gift.id === id ? { ...gift, wish: undefined } : gift),
    };
  }
  if (type === 'live_status') return { ...state, live: Boolean(payload.live ?? payload.active), viewerCount: asNumber(payload.viewerCount, state.viewerCount) };
  if (type === 'viewer_count') return { ...state, viewerCount: Math.max(0, asNumber(payload.viewerCount ?? payload.count, state.viewerCount)) };
  if (type === 'music') {
    if (Array.isArray(payload.playlist)) return applyConfig(state, { music: payload });
    const track = isRecord(payload.track) ? payload.track : {};
    return { ...state, music: { ...state.music, ...(payload as Partial<StageState['music']>), title: asString(payload.title ?? track.title, state.music.title), artist: asString(payload.artist ?? track.artist, state.music.artist), source: asString(payload.source ?? payload.url ?? track.source ?? track.url, state.music.source), volume: Math.max(0, Math.min(100, asNumber(payload.volume, state.music.volume))) } };
  }
  if (type === 'speech_start') return { ...state, speech: { host: payload.host === 'b' || payload.role === 'dj' ? 'b' : 'a', text: asString(payload.text), until: timestamp + Math.max(1_000, asNumber(payload.durationMs, 8_000)) } };
  if (type === 'speech_end') return { ...state, speech: undefined };
  if (type === 'ai_caption') return { ...state, aiCaption: { text: asString(payload.text ?? payload.message).slice(0, 220), source: asString(payload.source ?? payload.role), until: timestamp + Math.max(2_000, asNumber(payload.durationMs, 9_000)) } };
  if (type === 'tts_audio') return { ...state, aiCaption: asString(payload.text) ? { text: asString(payload.text).slice(0, 220), source: asString(payload.source, 'AI MC'), until: timestamp + Math.max(2_000, asNumber(payload.durationMs, 9_000)) } : state.aiCaption };
  if (type === 'audio_owner') return { ...state, audioOwner: payload.owner === true || payload.owner === 'stage' || payload.stage === true };
  if (type === 'character_action') {
    if (payload.action === 'reset') return { ...state, characterAction: undefined, speech: undefined };
    if (payload.action === 'greet') return { ...state, characterAction: { name: 'greet', until: timestamp + 2_600 } };
    if (payload.action === 'beat') return { ...state, testBeat: state.testBeat + 1 };
    return state;
  }
  if (type === 'viewer_level_up') {
    const viewerPayload = isRecord(payload.viewer) ? payload.viewer : payload;
    const viewer = viewerFrom(viewerPayload, state.viewers[safeId(asString(viewerPayload.id ?? viewerPayload.uniqueId ?? viewerPayload.name))]);
    viewer.level = Math.max(viewer.level, asNumber(payload.level, viewer.level));
    viewer.badge = asString(payload.title, viewer.badge);
    return { ...state, viewers: { ...state.viewers, [viewer.id]: viewer }, spotlightViewer: viewer, levelUp: { viewer, previousLevel: asNumber(payload.previousLevel, Math.max(1, viewer.level - 1)), until: timestamp + 7_000 } };
  }
  if (type === 'leaderboard') {
    const list = Array.isArray(payload.viewers) ? payload.viewers : Array.isArray(payload.items) ? payload.items : [];
    let viewers = { ...state.viewers };
    const ids: string[] = [];
    list.forEach((entry) => {
      if (!isRecord(entry)) return;
      const viewer = viewerFrom(entry, viewers[safeId(asString(entry.id ?? entry.uniqueId ?? entry.name))]);
      viewer.points = asNumber(entry.points ?? entry.diamonds, viewer.points);
      viewers[viewer.id] = viewer;
      ids.push(viewer.id);
    });
    return { ...state, viewers, leaderboard: calculateLeaderboard(viewers, ids) };
  }

  if (type === 'join') {
    const { viewer, viewers } = withViewer(state, payload);
    viewer.motion = 'enter'; viewer.motionUntil = timestamp + 4_000;
    const chat: ChatItem = { id: eventId('join', timestamp, viewer.id), viewer, message: 'vừa đáp xuống sân khấu', kind: 'join', createdAt: timestamp };
    return { ...state, viewers, viewerCount: Math.max(state.viewerCount, Object.keys(viewers).length), chats: addChat(state, chat), spotlightViewer: viewer };
  }
  if (type === 'chat') {
    const { viewer, viewers } = withViewer(state, payload, 1);
    viewer.motion = 'wave'; viewer.motionUntil = timestamp + 3_000;
    const message = asString(payload.message ?? payload.comment ?? payload.text).slice(0, 180);
    if (!message) return { ...state, viewers };
    const chat: ChatItem = { id: eventId('chat', timestamp, viewer.id), viewer, message, kind: 'chat', createdAt: timestamp };
    const command = isRecord(payload.command) ? asString(payload.command.name).toLowerCase().slice(0, 32) : '';
    return { ...state, viewers, chats: addChat(state, chat), leaderboard: calculateLeaderboard(viewers), stageCommand: command ? { name: command, viewerId: viewer.id, until: timestamp + 6_000 } : state.stageCommand };
  }
  if (type === 'follow') {
    const { viewer, viewers } = withViewer(state, payload, 15);
    viewer.motion = 'cheer'; viewer.motionUntil = timestamp + 4_500;
    const chat: ChatItem = { id: eventId('follow', timestamp, viewer.id), viewer, message: 'đã theo dõi kênh', kind: 'follow', createdAt: timestamp };
    return { ...state, viewers, chats: addChat(state, chat), spotlightViewer: viewer, leaderboard: calculateLeaderboard(viewers), eventFx: { type: 'fireworks', viewerId: viewer.id, intensity: 1, until: timestamp + 4_500 } };
  }
  if (type === 'like') {
    const count = Math.max(1, asNumber(payload.likeCount ?? payload.count ?? payload.likes, 1));
    const { viewer, viewers } = withViewer(state, payload, Math.ceil(count / 10), 0, count);
    viewer.motion = 'heart'; viewer.motionUntil = timestamp + 2_800;
    return { ...state, viewers, sessionLikes: state.sessionLikes + count, leaderboard: calculateLeaderboard(viewers), eventFx: count >= 10 ? { type: 'hearts', viewerId: viewer.id, intensity: Math.min(3, 1 + count / 100), until: timestamp + 3_500 } : state.eventFx };
  }
  if (type === 'gift') {
    const nestedGift = isRecord(payload.gift) ? payload.gift : {};
    const count = Math.max(1, asNumber(payload.giftCount ?? payload.repeatCount ?? payload.count ?? nestedGift.count, 1));
    const diamondsPerEvent = asNumber(payload.diamonds ?? payload.diamondCount ?? payload.value ?? nestedGift.diamonds, 0);
    const diamonds = Math.max(0, diamondsPerEvent * (payload.diamonds != null || nestedGift.diamonds != null ? 1 : count));
    const { viewer, viewers } = withViewer(state, payload, Math.max(diamonds, count * 10), count);
    viewer.motion = 'gift'; viewer.motionUntil = timestamp + (diamonds >= 1_000 ? 8_000 : 5_000);
    const gift: GiftEffect = {
      id: asString(payload.id, eventId('gift', timestamp, viewer.id)).slice(0, 256), viewer,
      giftName: asString(payload.giftName ?? payload.name ?? nestedGift.name, 'Món quà bí ẩn').slice(0, 60),
      count, diamonds,
      wish: asString(payload.message ?? payload.wish).slice(0, 140) || undefined,
      superGift: Boolean(payload.superGift ?? nestedGift.super) || diamonds >= 1000,
      createdAt: timestamp,
    };
    const chat: ChatItem = { id: eventId('gift-chat', timestamp, viewer.id), viewer, message: `tặng ${gift.giftName} ×${count}`, kind: 'gift', createdAt: timestamp };
    return { ...state, viewers, gifts: [...state.gifts, gift].slice(-4), chats: addChat(state, chat), spotlightViewer: viewer, leaderboard: calculateLeaderboard(viewers), eventFx: { type: gift.superGift ? 'fireworks' : 'spotlight', viewerId: viewer.id, intensity: gift.superGift ? 3 : Math.min(2, 1 + count / 10), until: timestamp + (gift.superGift ? 8_000 : 5_000) } };
  }
  if (type === 'level') {
    const { viewer, viewers } = withViewer(state, payload);
    viewer.level = Math.max(viewer.level, asNumber(payload.level, viewer.level));
    viewers[viewer.id] = viewer;
    return { ...state, viewers, spotlightViewer: viewer };
  }
  return state;
}

export function getWebSocketUrl(locationLike: Pick<Location, 'protocol' | 'hostname' | 'port' | 'search'>): string {
  const params = new URLSearchParams(locationLike.search);
  const explicit = params.get('ws');
  if (explicit) return explicit;
  const secure = locationLike.protocol === 'https:';
  const host = locationLike.hostname || '127.0.0.1';
  const port = locationLike.port || (secure ? '443' : '17321');
  return `${secure ? 'wss' : 'ws'}://${host}:${port}/ws`;
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

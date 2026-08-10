import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import { z } from "zod";
import type { AppConfig } from "./app-config";
import type { StructuredLogger } from "./logger";

export type LiveEventType = "join" | "chat" | "follow" | "like" | "gift" | "disconnect" | "reconnect";
export type ConnectionState = "offline" | "connecting" | "connected" | "reconnecting" | "error";

/** Session-only wishes stay in the desktop runtime so Electron does not compile
 * workspace source outside its security boundary. The shared service package
 * carries the same validated contract for service-only consumers. */
export interface GiftWish {
  id: string;
  viewerId: string;
  viewerName: string;
  message: string;
  createdAt: string;
  visible: boolean;
}

class GiftWishBoard {
  readonly #items = new Map<string, GiftWish>();

  constructor(private readonly capacity: number) {}

  addWish(input: GiftWish): GiftWish {
    const wish: GiftWish = {
      id: input.id.trim().slice(0, 256),
      viewerId: input.viewerId.trim().slice(0, 128),
      viewerName: input.viewerName.trim().slice(0, 100),
      message: input.message.trim().slice(0, 280),
      createdAt: new Date(input.createdAt).toISOString(),
      visible: input.visible
    };
    if (!wish.id || !wish.viewerId || !wish.viewerName || !wish.message || !Number.isFinite(Date.parse(wish.createdAt))) {
      throw new Error("Gift wish is invalid");
    }
    this.#items.set(wish.id, wish);
    while (this.#items.size > this.capacity) {
      const oldest = [...this.#items.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!oldest) break;
      this.#items.delete(oldest.id);
    }
    return structuredClone(wish);
  }

  setVisible(id: string, visible: boolean): boolean {
    const wish = this.#items.get(id);
    if (!wish) return false;
    wish.visible = visible;
    return true;
  }

  remove(id: string): boolean {
    return this.#items.delete(id);
  }

  list(includeHidden = false): readonly GiftWish[] {
    return [...this.#items.values()]
      .filter((wish) => includeHidden || wish.visible)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((wish) => structuredClone(wish));
  }
}

export interface LiveViewer {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  title: string;
}

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  timestamp: string;
  source: "tikfinity" | "fake" | "system";
  viewer?: LiveViewer;
  message?: string;
  gift?: { id?: string; name: string; count: number; diamonds: number; image?: string; super: boolean };
  likeCount?: number;
  command?: { name: string; response: string };
}

interface ViewerRecord extends LiveViewer {
  xp: number;
  gifts: number;
  likes: number;
  messages: number;
  followed: boolean;
  lastSeen: string;
}

interface RuntimeSnapshot {
  live: boolean;
  connection: ConnectionState;
  tikfinityUrl: string;
  stageUrl: string;
  localPort: number;
  viewerCount: number;
  queueDepth: number;
  speechQueueDepth: number;
  uptimeSeconds: number;
  music: { title: string; artist?: string; playing: boolean; volume: number; trackId?: string; source?: string };
  health: Record<string, "ok" | "warn" | "error">;
}

interface LiveRuntimeOptions {
  config: AppConfig;
  logger: StructuredLogger;
  stageUrl: () => string;
  onEvent: (event: { type: string; payload?: unknown }) => void;
  onConfigPatch: (patch: unknown) => Promise<AppConfig>;
}

const fakeEventSchema = z.object({
  type: z.enum(["join", "chat", "follow", "like", "gift"]),
  viewer: z.object({
    id: z.string().max(160).optional(),
    name: z.string().trim().min(1).max(80),
    avatar: z.string().url().max(2_048).optional().or(z.literal("")),
    level: z.number().int().min(1).max(99).optional()
  }),
  message: z.string().max(500).optional(),
  giftName: z.string().max(120).optional(),
  giftCount: z.number().int().min(1).max(10_000).optional(),
  diamonds: z.number().int().min(0).max(10_000_000).optional(),
  likeCount: z.number().int().min(1).max(1_000_000).optional()
});

const priority: Record<LiveEventType, number> = {
  gift: 100,
  follow: 80,
  chat: 60,
  like: 40,
  join: 20,
  reconnect: 10,
  disconnect: 10
};

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeEventType(value: unknown): LiveEventType | undefined {
  const key = String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (["join", "member", "viewerjoin", "userjoin", "roomuser"].includes(key)) return "join";
  if (["chat", "comment", "message"].includes(key)) return "chat";
  if (["follow", "socialfollow"].includes(key)) return "follow";
  if (["like", "likes"].includes(key)) return "like";
  if (["gift", "streakgift", "treasurebox"].includes(key)) return "gift";
  if (["disconnect", "disconnected"].includes(key)) return "disconnect";
  if (["reconnect", "reconnected"].includes(key)) return "reconnect";
  return undefined;
}

function levelForXp(xp: number): number {
  return Math.min(99, Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1));
}

function titleForLevel(level: number): string {
  if (level >= 40) return "Huyền thoại quỹ đạo";
  if (level >= 25) return "Siêu sao thiên hà";
  if (level >= 15) return "Phi hành gia VIP";
  if (level >= 8) return "Ngôi sao thân thiết";
  if (level >= 3) return "Bạn đồng hành";
  return "Khách mới";
}

export class LiveRuntime {
  #config: AppConfig;
  #socket?: WebSocket;
  #connection: ConnectionState = "offline";
  #running = false;
  #manualStop = true;
  #reconnectAttempt = 0;
  #reconnectTimer?: NodeJS.Timeout;
  #queue: LiveEvent[] = [];
  #draining = false;
  #viewers = new Map<string, ViewerRecord>();
  #wishes = new GiftWishBoard(500);
  #recent = new Map<string, number>();
  #startedAt = Date.now();
  #speechQueueDepth = 0;

  constructor(private readonly options: LiveRuntimeOptions) {
    this.#config = options.config;
  }

  updateConfig(config: AppConfig): void {
    const oldUrl = this.#config.live.tikfinityUrl;
    this.#config = config;
    this.emitSnapshot();
    if (this.#running && oldUrl !== config.live.tikfinityUrl) {
      this.disconnectSocket(4_001, "TikFinity URL changed");
      this.connect(true);
    }
    this.options.onEvent({ type: "config", payload: this.publicStageConfig() });
  }

  get connection(): ConnectionState {
    return this.#connection;
  }

  get running(): boolean {
    return this.#running;
  }

  setSpeechQueueDepth(depth: number): void {
    this.#speechQueueDepth = Math.max(0, Math.floor(depth));
    this.emitSnapshot();
  }

  wishes(includeHidden = true): readonly GiftWish[] {
    return this.#wishes.list(includeHidden);
  }

  setWishVisible(id: string, visible: boolean): readonly GiftWish[] {
    if (!this.#wishes.setVisible(id, visible)) throw new Error("Không tìm thấy lời chúc.");
    this.emitWishes();
    return this.wishes();
  }

  removeWish(id: string): readonly GiftWish[] {
    if (!this.#wishes.remove(id)) throw new Error("Không tìm thấy lời chúc.");
    this.emitWishes();
    return this.wishes();
  }

  snapshot(): RuntimeSnapshot {
    const track = this.#config.music.playlist.find((item) => item.id === this.#config.music.currentTrackId);
    return {
      live: this.#running,
      connection: this.#connection,
      tikfinityUrl: this.#config.live.tikfinityUrl,
      stageUrl: this.options.stageUrl(),
      localPort: this.#config.live.localPort,
      viewerCount: this.#viewers.size,
      queueDepth: this.#queue.length,
      speechQueueDepth: this.#speechQueueDepth,
      uptimeSeconds: Math.round((Date.now() - this.#startedAt) / 1_000),
      music: {
        title: track?.title ?? "Chưa chọn nhạc",
        playing: this.#config.music.playing,
        volume: this.#config.music.volume,
        ...(track ? { trackId: track.id, source: track.path } : {})
      },
      health: {
        desktop: "ok",
        localServer: "ok",
        tikfinity: this.#connection === "connected" ? "ok" : this.#running ? "warn" : "warn",
        aiWorker: this.#config.ai.enabled ? "ok" : "warn"
      }
    };
  }

  stageSnapshot(): unknown {
    const leaderboard = this.leaderboard();
    const viewers = Object.fromEntries([...this.#viewers.values()].map((viewer) => [viewer.id, this.toStageViewer(viewer)]));
    return {
      connection: this.#connection,
      live: this.#running,
      viewerCount: this.#viewers.size,
      led: this.#config.led,
      appearance: { ...this.#config.stage, transparent: false },
      characters: this.#config.characters,
      viewers,
      leaderboard: leaderboard.map((viewer) => viewer.id),
      wishes: this.wishes(),
      music: this.snapshot().music,
      sessionLikes: [...this.#viewers.values()].reduce((sum, viewer) => sum + viewer.likes, 0)
    };
  }

  health(): Record<string, unknown> {
    return {
      desktop: "ok",
      localServer: "ok",
      tikfinity: this.#connection,
      liveRunning: this.#running,
      eventQueueDepth: this.#queue.length,
      speechQueueDepth: this.#speechQueueDepth,
      viewerCount: this.#viewers.size,
      aiWorker: this.#config.ai.enabled ? "ready" : "disabled",
      license: this.#config.license.enabled ? "enabled" : "free-mode"
    };
  }

  start(): void {
    if (this.#running) return;
    this.#running = true;
    this.#manualStop = false;
    this.#reconnectAttempt = 0;
    this.connect(false);
    this.emitSnapshot();
  }

  stop(): void {
    this.#running = false;
    this.#manualStop = true;
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = undefined;
    this.disconnectSocket(1_000, "LIVE stopped");
    this.setConnection("offline");
    this.emitSnapshot();
  }

  shutdown(): void {
    this.stop();
  }

  fake(input: unknown): LiveEvent {
    const parsed = fakeEventSchema.parse(input);
    const type = parsed.type;
    const event: LiveEvent = {
      id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      source: "fake",
      viewer: {
        id: parsed.viewer.id ?? `fake:${parsed.viewer.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: parsed.viewer.name,
        level: parsed.viewer.level ?? 1,
        title: titleForLevel(parsed.viewer.level ?? 1),
        ...(parsed.viewer.avatar ? { avatar: parsed.viewer.avatar } : {})
      },
      ...(type === "chat" ? { message: parsed.message ?? "Xin chào OrbitStage!" } : {}),
      ...(type === "like" ? { likeCount: parsed.likeCount ?? 10 } : {}),
      ...(type === "gift" ? {
        ...(parsed.message ? { message: parsed.message } : {}),
        gift: {
          name: parsed.giftName ?? "Orbit Star",
          count: parsed.giftCount ?? 1,
          diamonds: parsed.diamonds ?? 100,
          super: (parsed.diamonds ?? 100) * (parsed.giftCount ?? 1) >= 1_000
        }
      } : {})
    };
    this.enqueue(event);
    return event;
  }

  async musicControl(action: string, value?: number): Promise<void> {
    const music = this.#config.music;
    const playlist = music.playlist;
    let index = Math.max(0, playlist.findIndex((item) => item.id === music.currentTrackId));
    const patch: Record<string, unknown> = {};
    switch (action) {
      case "play":
        if (!music.currentTrackId && playlist[0]) patch.currentTrackId = playlist[0].id;
        patch.playing = true;
        break;
      case "pause": patch.playing = false; break;
      case "stop": patch.playing = false; break;
      case "next":
        if (playlist.length) patch.currentTrackId = playlist[(index + 1) % playlist.length]?.id ?? null;
        patch.playing = true;
        break;
      case "previous":
        if (playlist.length) patch.currentTrackId = playlist[(index - 1 + playlist.length) % playlist.length]?.id ?? null;
        patch.playing = true;
        break;
      case "volume": patch.volume = Math.min(100, Math.max(0, value ?? music.volume)); break;
      default: throw new Error("Unknown music action");
    }
    const next = await this.options.onConfigPatch({ music: patch });
    this.updateConfig(next);
    this.options.onEvent({ type: "music", payload: next.music });
  }

  private connect(isReconnect: boolean): void {
    if (!this.#running || this.#socket?.readyState === WebSocket.OPEN || this.#socket?.readyState === WebSocket.CONNECTING) return;
    this.setConnection(isReconnect ? "reconnecting" : "connecting");
    const socket = new WebSocket(this.#config.live.tikfinityUrl, {
      handshakeTimeout: 8_000,
      maxPayload: 256 * 1024,
      perMessageDeflate: false
    });
    this.#socket = socket;
    socket.on("open", () => {
      this.#reconnectAttempt = 0;
      this.setConnection("connected");
      if (isReconnect) this.enqueue(this.systemEvent("reconnect"));
      this.options.logger.info("tikfinity.connected", { url: this.#config.live.tikfinityUrl });
    });
    socket.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString()) as unknown;
        const values = Array.isArray(parsed) ? parsed : [parsed];
        for (const value of values) {
          const event = this.fromTikFinity(value);
          if (event) this.enqueue(event);
        }
      } catch (error) {
        this.options.logger.warn("tikfinity.invalid_message", { message: error instanceof Error ? error.message : String(error) });
      }
    });
    socket.on("error", (error) => {
      this.options.logger.warn("tikfinity.socket_error", { message: error.message });
      this.setConnection("error");
    });
    socket.on("close", (code, reason) => {
      if (this.#socket === socket) this.#socket = undefined;
      this.options.logger.warn("tikfinity.disconnected", { code, reason: reason.toString() });
      if (!this.#manualStop) this.enqueue(this.systemEvent("disconnect"));
      if (this.#running && this.#config.live.reconnect && !this.#manualStop) this.scheduleReconnect();
      else this.setConnection("offline");
    });
  }

  private disconnectSocket(code: number, reason: string): void {
    const socket = this.#socket;
    this.#socket = undefined;
    if (socket?.readyState === WebSocket.OPEN) socket.close(code, reason);
    else if (socket?.readyState === WebSocket.CONNECTING) socket.terminate();
  }

  private scheduleReconnect(): void {
    if (this.#reconnectTimer) return;
    this.#reconnectAttempt += 1;
    const base = Math.min(30_000, 750 * 2 ** Math.min(this.#reconnectAttempt - 1, 6));
    const delay = Math.round(base * (0.85 + Math.random() * 0.3));
    this.setConnection("reconnecting");
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = undefined;
      this.connect(true);
    }, delay);
    this.#reconnectTimer.unref();
  }

  private fromTikFinity(input: unknown): LiveEvent | undefined {
    const root = asRecord(input);
    const nested = asRecord(root.data ?? root.payload ?? root.eventData);
    const data = { ...root, ...nested };
    const type = normalizeEventType(root.event ?? root.eventType ?? root.type ?? nested.event ?? nested.type);
    if (!type) return undefined;
    if (type === "disconnect" || type === "reconnect") return this.systemEvent(type);
    const userObject = asRecord(data.user ?? data.userDetails ?? data.author);
    const name = firstString(
      data.nickname, data.displayName, data.uniqueId, data.username,
      userObject.nickname, userObject.displayName, userObject.uniqueId, userObject.username
    ) ?? "Khách TikTok";
    const userId = firstString(data.userId, data.uniqueId, data.username, userObject.userId, userObject.uniqueId) ?? `viewer:${name}`;
    const avatar = firstString(
      data.profilePictureUrl, data.avatarUrl, data.avatar,
      userObject.profilePictureUrl, userObject.avatarUrl, userObject.avatar
    );
    const viewer: LiveViewer = { id: userId, name, level: 1, title: "Khách mới", ...(avatar ? { avatar } : {}) };
    const event: LiveEvent = {
      id: firstString(data.eventId, data.msgId, data.id) ?? randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      source: "tikfinity",
      viewer
    };
    if (type === "chat") event.message = firstString(data.comment, data.message, data.text) ?? "";
    if (type === "like") event.likeCount = Math.max(1, Math.round(firstNumber(data.likeCount, data.count, data.likes) ?? 1));
    if (type === "gift") {
      const count = Math.max(1, Math.round(firstNumber(data.repeatCount, data.giftCount, data.count) ?? 1));
      const diamonds = Math.max(0, Math.round(firstNumber(data.diamondCount, data.diamonds, data.value) ?? 0));
      const nameValue = firstString(data.giftName, data.name, asRecord(data.gift).name) ?? "Quà TikTok";
      event.gift = {
        id: firstString(data.giftId, asRecord(data.gift).id),
        name: nameValue,
        count,
        diamonds,
        image: firstString(data.giftPictureUrl, data.giftImage, asRecord(data.gift).image),
        super: count * diamonds >= 1_000
      };
      event.message = firstString(data.comment, data.message, data.wish)?.slice(0, 280);
    }
    return event;
  }

  private systemEvent(type: "disconnect" | "reconnect"): LiveEvent {
    return { id: randomUUID(), type, timestamp: new Date().toISOString(), source: "system" };
  }

  private enqueue(event: LiveEvent): void {
    if (this.isSpam(event)) return;
    const insertAt = this.#queue.findIndex((queued) => priority[event.type] > priority[queued.type]);
    if (insertAt === -1) this.#queue.push(event);
    else this.#queue.splice(insertAt, 0, event);
    if (this.#queue.length > 500) this.#queue.splice(450);
    this.emitSnapshot();
    if (!this.#draining) queueMicrotask(() => this.drain());
  }

  private isSpam(event: LiveEvent): boolean {
    if (!event.viewer || event.type === "gift" || event.type === "follow") return false;
    const now = Date.now();
    const content = event.type === "chat" ? event.message?.trim().toLowerCase() : String(event.likeCount ?? "");
    const key = `${event.viewer.id}:${event.type}:${content ?? ""}`;
    const last = this.#recent.get(key) ?? 0;
    const windowMs = this.#config.live.spamWindowSeconds * 1_000;
    this.#recent.set(key, now);
    if (this.#recent.size > 5_000) {
      for (const [storedKey, timestamp] of this.#recent) if (now - timestamp > 60_000) this.#recent.delete(storedKey);
    }
    return now - last < windowMs;
  }

  private drain(): void {
    this.#draining = true;
    try {
      let processed = 0;
      while (this.#queue.length && processed < 50) {
        const event = this.#queue.shift();
        if (!event) break;
        this.process(event);
        processed += 1;
      }
    } finally {
      this.#draining = false;
      this.emitSnapshot();
      if (this.#queue.length) setImmediate(() => this.drain());
    }
  }

  private process(event: LiveEvent): void {
    let wishesChanged = false;
    if (event.viewer) {
      const existing = this.#viewers.get(event.viewer.id);
      const record: ViewerRecord = existing ?? {
        ...event.viewer,
        xp: 0,
        gifts: 0,
        likes: 0,
        messages: 0,
        followed: false,
        lastSeen: event.timestamp
      };
      record.name = event.viewer.name;
      if (event.viewer.avatar) record.avatar = event.viewer.avatar;
      record.lastSeen = event.timestamp;
      if (event.type === "join") record.xp += 1;
      if (event.type === "chat") { record.xp += 2; record.messages += 1; }
      if (event.type === "follow") { record.xp += 20; record.followed = true; }
      if (event.type === "like") { record.likes += event.likeCount ?? 1; record.xp += Math.min(100, event.likeCount ?? 1) * 0.2; }
      if (event.type === "gift" && event.gift) {
        const giftScore = event.gift.diamonds * event.gift.count;
        record.gifts += giftScore;
        record.xp += Math.max(10, giftScore * 5);
        if (event.message?.trim()) {
          this.#wishes.addWish({
            id: event.id,
            viewerId: record.id,
            viewerName: record.name,
            message: event.message.trim().slice(0, 280),
            createdAt: event.timestamp,
            visible: true
          });
          wishesChanged = true;
        }
      }
      record.level = Math.max(event.viewer.level, levelForXp(record.xp));
      record.title = titleForLevel(record.level);
      event.viewer = { id: record.id, name: record.name, level: record.level, title: record.title, ...(record.avatar ? { avatar: record.avatar } : {}) };
      this.#viewers.set(record.id, record);
      if (this.#viewers.size > 2_500) {
        const oldest = [...this.#viewers.values()].sort((a, b) => a.lastSeen.localeCompare(b.lastSeen)).slice(0, 250);
        for (const viewer of oldest) this.#viewers.delete(viewer.id);
      }
      if (event.type === "chat" && event.message?.startsWith("!")) event.command = this.command(event.message, record);
    }
    this.options.onEvent({ type: "live-event", payload: event });
    this.options.onEvent({ type: "leaderboard", payload: { viewers: this.leaderboard().map((viewer) => this.toStageViewer(viewer)) } });
    if (wishesChanged) this.emitWishes();
    this.options.logger.info("live.event", { type: event.type, source: event.source, viewerId: event.viewer?.id });
  }

  private emitWishes(): void {
    this.options.onEvent({ type: "wishes", payload: { items: this.wishes() } });
  }

  private command(message: string, viewer: ViewerRecord): { name: string; response: string } | undefined {
    const command = message.trim().split(/\s+/)[0]?.toLowerCase();
    if (command === "!level") return { name: "level", response: `${viewer.name} đang ở level ${viewer.level} — ${viewer.title}.` };
    if (command === "!rank") {
      const rank = this.leaderboard().findIndex((item) => item.id === viewer.id) + 1;
      return { name: "rank", response: rank > 0 ? `${viewer.name} đang xếp hạng #${rank}.` : `${viewer.name} chưa có thứ hạng.` };
    }
    if (command === "!wish") return { name: "wish", response: message.replace(/^!wish\s*/i, "").slice(0, 160) || "Chúc mọi người một buổi LIVE thật vui!" };
    return undefined;
  }

  private leaderboard(): ViewerRecord[] {
    return [...this.#viewers.values()]
      .sort((a, b) => (b.gifts - a.gifts) || (b.likes - a.likes) || (b.xp - a.xp))
      .slice(0, 10)
      .map((viewer) => ({ ...viewer }));
  }

  private toStageViewer(viewer: ViewerRecord): Record<string, unknown> {
    return {
      id: viewer.id,
      name: viewer.name,
      avatar: viewer.avatar ?? "",
      level: viewer.level,
      badge: viewer.title,
      points: Math.round(viewer.xp),
      gifts: viewer.gifts,
      likes: viewer.likes
    };
  }

  private publicStageConfig(): unknown {
    return {
      led: this.#config.led,
      stage: this.#config.stage,
      characters: this.#config.characters,
      music: this.#config.music
    };
  }

  private setConnection(connection: ConnectionState): void {
    this.#connection = connection;
    this.options.onEvent({ type: "connection", payload: connection });
    this.emitSnapshot();
  }

  private emitSnapshot(): void {
    this.options.onEvent({ type: "snapshot", payload: this.snapshot() });
  }
}

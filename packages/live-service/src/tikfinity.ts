import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import WebSocket, { type RawData } from 'ws';
import {
  createLiveEvent,
  type ConnectionState,
  type LiveEvent,
  type ReconnectConfigSchema,
  type Viewer,
} from '@orbitstage/shared';
import type { z } from 'zod';
import { NOOP_LOGGER, SYSTEM_SCHEDULER, type Logger, type TimerScheduler } from './types.js';

export type ReconnectOptions = z.infer<typeof ReconnectConfigSchema>;

export interface TikFinitySocket {
  readonly readyState: number;
  on(event: 'open', listener: () => void): this;
  on(event: 'message', listener: (data: RawData | string) => void): this;
  on(event: 'close', listener: (code: number, reason: Buffer) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  close(code?: number, reason?: string): void;
  terminate?(): void;
}

export type TikFinitySocketFactory = (url: string) => TikFinitySocket;

export interface TikFinityBridgeStatus {
  state: ConnectionState;
  attempt: number;
  connectedAt?: string;
  lastMessageAt?: string;
  reason?: string;
  nextRetryMs?: number;
}

export interface TikFinityBridgeOptions {
  url: string;
  reconnect?: Partial<ReconnectOptions>;
  socketFactory?: TikFinitySocketFactory;
  logger?: Logger;
  scheduler?: TimerScheduler;
  random?: () => number;
}

const DEFAULT_RECONNECT: ReconnectOptions = {
  enabled: true,
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  factor: 2,
  jitterRatio: 0.2,
  maxAttempts: null,
};

const MAX_FIELD = 500;
const text = (value: unknown, maxLength = MAX_FIELD): string | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const normalized = String(value).trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
};
const number = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};
const boolean = (value: unknown): boolean => value === true || value === 1 || value === '1' || value === 'true';
const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
const first = <T>(...values: (T | undefined)[]): T | undefined => values.find((value) => value !== undefined);

const normalizeTimestamp = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value < 10_000_000_000 ? value * 1_000 : value).toISOString();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
};

const stableEventUuid = (value: string): string => {
  const bytes = createHash('sha256').update(value).digest().subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const viewerFrom = (data: Record<string, unknown>): Viewer | undefined => {
  const user = record(data.user) ?? record(data.viewer) ?? data;
  const uniqueId = first(text(user.uniqueId, 128), text(user.uniqueID, 128), text(user.username, 128));
  const id = first(text(user.userId, 128), text(user.userID, 128), text(user.id, 128), uniqueId);
  const displayName = first(
    text(user.nickname, 100),
    text(user.displayName, 100),
    text(user.name, 100),
    uniqueId,
  );
  if (!id || !displayName) return undefined;
  const avatarUrl = first(
    text(user.profilePictureUrl, 2_048),
    text(user.avatarUrl, 2_048),
    text(user.avatar, 2_048),
  );
  return {
    id,
    displayName,
    isModerator: boolean(first(user.isModerator, user.moderator)),
    isSubscriber: boolean(first(user.isSubscriber, user.subscribe, user.subscriber)),
    ...(uniqueId ? { uniqueId } : {}),
    ...(avatarUrl && /^https?:\/\//i.test(avatarUrl) ? { avatarUrl } : {}),
  };
};

const typeFrom = (message: Record<string, unknown>, data: Record<string, unknown>): string =>
  (first(
    text(message.event, 100),
    text(message.type, 100),
    text(message.eventType, 100),
    text(data.event, 100),
    text(data.type, 100),
  ) ?? '').toLocaleLowerCase().replace(/[^a-z]/g, '');

/** Converts supported TikFinity payload variants into the stable, validated app event schema. */
export function normalizeTikFinityMessage(input: unknown): LiveEvent[] {
  if (typeof input === 'string' || input instanceof Buffer || input instanceof Uint8Array) {
    try {
      return normalizeTikFinityMessage(JSON.parse(Buffer.from(input).toString('utf8')));
    } catch {
      return [];
    }
  }
  if (Array.isArray(input)) return input.flatMap(normalizeTikFinityMessage);
  const message = record(input);
  if (!message) return [];
  const nested = record(message.data) ?? record(message.payload) ?? message;
  const eventType = typeFrom(message, nested);
  const viewer = viewerFrom(nested);
  const occurredAt = normalizeTimestamp(first(nested.timestamp, nested.createTime, message.timestamp));
  const providerMessageId = first(
    text(nested.eventId, 256),
    text(nested.msgId, 256),
    text(nested.messageId, 256),
    text(message.eventId, 256),
    text(message.msgId, 256),
  );
  const options = {
    occurredAt,
    ...(providerMessageId ? { id: stableEventUuid(`tikfinity:${eventType}:${providerMessageId}`) } : {}),
    metadata: {
      providerEvent: eventType || 'unknown',
      ...(providerMessageId ? { providerMessageId } : {}),
    },
  };

  if ((eventType === 'member' || eventType === 'join' || eventType === 'roomuser') && viewer) {
    return [createLiveEvent('join', { viewer }, 'tikfinity', options)];
  }
  if ((eventType === 'chat' || eventType === 'comment') && viewer) {
    const chat = first(text(nested.comment), text(nested.message), text(nested.text));
    return chat ? [createLiveEvent('chat', { viewer, message: chat }, 'tikfinity', options)] : [];
  }
  if ((eventType === 'follow' || (eventType === 'social' && /follow/i.test(text(nested.displayType) ?? ''))) && viewer) {
    return [createLiveEvent('follow', { viewer }, 'tikfinity', options)];
  }
  if (eventType === 'like' && viewer) {
    const count = Math.max(1, Math.trunc(first(number(nested.likeCount), number(nested.count)) ?? 1));
    const totalValue = first(number(nested.totalLikeCount), number(nested.total));
    return [
      createLiveEvent(
        'like',
        {
          viewer,
          count: Math.min(count, 1_000_000),
          ...(totalValue !== undefined ? { total: Math.max(0, Math.trunc(totalValue)) } : {}),
        },
        'tikfinity',
        options,
      ),
    ];
  }
  if (eventType === 'gift' && viewer) {
    const gift = record(nested.gift) ?? nested;
    const giftId = first(text(gift.giftId, 128), text(gift.id, 128), text(nested.giftId, 128));
    const giftName = first(text(gift.giftName, 100), text(gift.name, 100), text(nested.giftName, 100));
    if (!giftId || !giftName) return [];
    const imageUrl = first(text(gift.imageUrl, 2_048), text(gift.pictureUrl, 2_048), text(nested.giftPictureUrl, 2_048));
    const repeatCount = Math.max(1, Math.trunc(first(number(nested.repeatCount), number(nested.count)) ?? 1));
    const diamondValue = Math.max(0, Math.trunc(first(number(gift.diamondCount), number(gift.diamondValue), number(nested.diamondCount)) ?? 0));
    const comboId = first(text(nested.comboId, 128), text(nested.groupId, 128));
    const giftMessage = first(text(nested.comment, 280), text(nested.message, 280));
    return [
      createLiveEvent(
        'gift',
        {
          viewer,
          giftId,
          giftName,
          repeatCount: Math.min(repeatCount, 100_000),
          diamondValue: Math.min(diamondValue, 100_000_000),
          repeatEnd: first(nested.repeatEnd, nested.isFinal) === undefined ? true : boolean(first(nested.repeatEnd, nested.isFinal)),
          ...(comboId ? { comboId } : {}),
          ...(imageUrl && /^https?:\/\//i.test(imageUrl) ? { imageUrl } : {}),
          ...(giftMessage ? { message: giftMessage } : {}),
        },
        'tikfinity',
        options,
      ),
    ];
  }
  return [];
}

export class TikFinityBridge {
  private readonly eventListeners = new Set<(event: LiveEvent) => void>();
  private readonly statusListeners = new Set<(status: TikFinityBridgeStatus) => void>();
  private readonly reconnect: ReconnectOptions;
  private readonly socketFactory: TikFinitySocketFactory;
  private readonly logger: Logger;
  private readonly scheduler: TimerScheduler;
  private readonly random: () => number;
  private socket?: TikFinitySocket;
  private cancelRetry?: () => void;
  private manualStop = true;
  private generation = 0;
  private mutableStatus: TikFinityBridgeStatus = { state: 'idle', attempt: 0 };

  public constructor(private readonly options: TikFinityBridgeOptions) {
    const url = new URL(options.url);
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new TypeError('TikFinity URL must use ws:// or wss://');
    if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname)) {
      throw new TypeError('TikFinity URL must use a loopback host');
    }
    if (url.username || url.password || [...url.searchParams.keys()].some((key) => /key|token|secret|auth|password/i.test(key))) {
      throw new TypeError('TikFinity URL must not contain credentials');
    }
    this.reconnect = { ...DEFAULT_RECONNECT, ...options.reconnect };
    if (this.reconnect.initialDelayMs > this.reconnect.maxDelayMs) {
      throw new RangeError('initialDelayMs cannot exceed maxDelayMs');
    }
    this.socketFactory = options.socketFactory ?? ((socketUrl) => new WebSocket(socketUrl, {
      handshakeTimeout: 8_000,
      maxPayload: 256 * 1_024,
      perMessageDeflate: false,
    }));
    this.logger = options.logger ?? NOOP_LOGGER;
    this.scheduler = options.scheduler ?? SYSTEM_SCHEDULER;
    this.random = options.random ?? Math.random;
  }

  public get status(): TikFinityBridgeStatus {
    return { ...this.mutableStatus };
  }

  public connect(): void {
    if (this.mutableStatus.state === 'connecting' || this.mutableStatus.state === 'connected') return;
    this.manualStop = false;
    this.cancelRetry?.();
    this.cancelRetry = undefined;
    this.mutableStatus = { state: this.mutableStatus.state, attempt: 0 };
    this.openSocket(false);
  }

  public disconnect(reason = 'manual disconnect'): void {
    this.manualStop = true;
    this.generation += 1;
    this.cancelRetry?.();
    this.cancelRetry = undefined;
    const socket = this.socket;
    this.socket = undefined;
    if (socket) {
      try {
        socket.close(1_000, reason.slice(0, 123));
      } catch {
        socket.terminate?.();
      }
    }
    this.emitEvent(createLiveEvent('disconnect', { reason, willReconnect: false, attempt: 0 }, 'system', { priority: 'high' }));
    this.updateStatus({ state: 'disconnected', attempt: 0, reason });
  }

  public onEvent(listener: (event: LiveEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public onStatus(listener: (status: TikFinityBridgeStatus) => void, emitCurrent = true): () => void {
    this.statusListeners.add(listener);
    if (emitCurrent) listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private openSocket(reconnecting: boolean): void {
    const generation = ++this.generation;
    this.updateStatus({
      state: reconnecting ? 'reconnecting' : 'connecting',
      attempt: this.mutableStatus.attempt,
    });
    let socket: TikFinitySocket;
    try {
      socket = this.socketFactory(this.options.url);
      this.socket = socket;
    } catch (error) {
      this.handleDisconnect(generation, `socket creation failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return;
    }

    socket.on('open', () => {
      if (generation !== this.generation || this.manualStop) return;
      const reconnectAttempt = this.mutableStatus.attempt;
      this.updateStatus({ state: 'connected', attempt: 0, connectedAt: new Date().toISOString() });
      if (reconnecting) {
        this.emitEvent(createLiveEvent('reconnect', { attempt: Math.max(1, reconnectAttempt) }, 'system', { priority: 'high' }));
      }
      this.logger.info('Connected to TikFinity WebSocket', { url: this.safeUrl() });
    });
    socket.on('message', (raw) => {
      if (generation !== this.generation || this.manualStop) return;
      this.mutableStatus = { ...this.mutableStatus, lastMessageAt: new Date().toISOString() };
      for (const event of normalizeTikFinityMessage(raw)) this.emitEvent(event);
    });
    socket.on('error', (error) => {
      if (generation !== this.generation || this.manualStop) return;
      this.logger.warn('TikFinity WebSocket error', { error });
    });
    socket.on('close', (code, reasonBuffer) => {
      if (generation !== this.generation || this.manualStop) return;
      this.socket = undefined;
      const reasonText = reasonBuffer.toString('utf8').slice(0, 300);
      this.handleDisconnect(generation, `WebSocket closed (${code})${reasonText ? `: ${reasonText}` : ''}`, code);
    });
  }

  private handleDisconnect(generation: number, reason: string, code?: number): void {
    if (generation !== this.generation || this.manualStop) return;
    const nextAttempt = this.mutableStatus.attempt + 1;
    if (!this.reconnect.enabled || (this.reconnect.maxAttempts !== null && nextAttempt > this.reconnect.maxAttempts)) {
      this.emitEvent(createLiveEvent(
        'disconnect',
        { reason, willReconnect: false, attempt: this.mutableStatus.attempt, ...(code !== undefined ? { code } : {}) },
        'system',
        { priority: 'high' },
      ));
      this.updateStatus({ state: 'failed', attempt: this.mutableStatus.attempt, reason });
      return;
    }
    const base = Math.min(
      this.reconnect.maxDelayMs,
      this.reconnect.initialDelayMs * this.reconnect.factor ** Math.max(0, nextAttempt - 1),
    );
    const jitter = base * this.reconnect.jitterRatio * (this.random() * 2 - 1);
    const delayMs = Math.max(0, Math.round(base + jitter));
    this.emitEvent(createLiveEvent(
      'disconnect',
      {
        reason,
        willReconnect: true,
        attempt: nextAttempt,
        nextRetryMs: delayMs,
        ...(code !== undefined ? { code } : {}),
      },
      'system',
      { priority: 'high' },
    ));
    this.updateStatus({ state: 'reconnecting', attempt: nextAttempt, reason, nextRetryMs: delayMs });
    this.cancelRetry = this.scheduler(() => {
      this.cancelRetry = undefined;
      if (!this.manualStop && generation === this.generation) this.openSocket(true);
    }, delayMs);
  }

  private updateStatus(status: TikFinityBridgeStatus): void {
    this.mutableStatus = status;
    const event = createLiveEvent(
      'connection',
      {
        state: status.state,
        attempt: status.attempt,
        ...(status.reason ? { reason: status.reason } : {}),
        ...(status.nextRetryMs !== undefined ? { nextRetryMs: status.nextRetryMs } : {}),
      },
      'system',
    );
    this.emitEvent(event);
    for (const listener of this.statusListeners) {
      try {
        listener(this.status);
      } catch (error) {
        this.logger.error('TikFinity status listener failed', { error });
      }
    }
  }

  private emitEvent(event: LiveEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.error('TikFinity event listener failed', { type: event.type, error });
      }
    }
  }

  private safeUrl(): string {
    const url = new URL(this.options.url);
    url.username = '';
    url.password = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/key|token|secret|auth/i.test(key)) url.searchParams.set(key, '[REDACTED]');
    }
    return url.toString();
  }
}

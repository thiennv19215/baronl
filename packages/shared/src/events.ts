import { z } from 'zod';

export const LiveEventTypeSchema = z.enum([
  'connection',
  'disconnect',
  'reconnect',
  'join',
  'chat',
  'follow',
  'like',
  'gift',
]);
export type LiveEventType = z.infer<typeof LiveEventTypeSchema>;

export const EventSourceSchema = z.enum(['tikfinity', 'fake', 'system']);
export type EventSource = z.infer<typeof EventSourceSchema>;

export const EventPrioritySchema = z.enum(['low', 'normal', 'high', 'critical']);
export type EventPriority = z.infer<typeof EventPrioritySchema>;

export const ConnectionStateSchema = z.enum([
  'idle',
  'connecting',
  'connected',
  'reconnecting',
  'disconnected',
  'failed',
]);
export type ConnectionState = z.infer<typeof ConnectionStateSchema>;

export const ViewerSchema = z.object({
  id: z.string().trim().min(1).max(128),
  uniqueId: z.string().trim().min(1).max(128).optional(),
  displayName: z.string().trim().min(1).max(100),
  avatarUrl: z.string().url().max(2_048).optional(),
  isModerator: z.boolean().default(false),
  isSubscriber: z.boolean().default(false),
});
export type Viewer = z.infer<typeof ViewerSchema>;

export const ConnectionPayloadSchema = z.object({
  state: ConnectionStateSchema,
  attempt: z.number().int().nonnegative().default(0),
  reason: z.string().max(500).optional(),
  nextRetryMs: z.number().int().nonnegative().optional(),
});

export const DisconnectPayloadSchema = z.object({
  reason: z.string().max(500).optional(),
  code: z.number().int().min(0).max(65_535).optional(),
  willReconnect: z.boolean(),
  attempt: z.number().int().nonnegative().default(0),
  nextRetryMs: z.number().int().nonnegative().optional(),
});

export const ReconnectPayloadSchema = z.object({
  attempt: z.number().int().positive(),
});

export const JoinPayloadSchema = z.object({
  viewer: ViewerSchema,
});

export const ChatPayloadSchema = z.object({
  viewer: ViewerSchema,
  message: z.string().trim().min(1).max(500),
});

export const FollowPayloadSchema = z.object({
  viewer: ViewerSchema,
});

export const LikePayloadSchema = z.object({
  viewer: ViewerSchema,
  count: z.number().int().positive().max(1_000_000),
  total: z.number().int().nonnegative().optional(),
});

export const GiftPayloadSchema = z.object({
  viewer: ViewerSchema,
  giftId: z.string().trim().min(1).max(128),
  giftName: z.string().trim().min(1).max(100),
  imageUrl: z.string().url().max(2_048).optional(),
  repeatCount: z.number().int().positive().max(100_000).default(1),
  diamondValue: z.number().int().nonnegative().max(100_000_000).default(0),
  comboId: z.string().max(128).optional(),
  repeatEnd: z.boolean().default(true),
  message: z.string().trim().max(280).optional(),
});

const EnvelopeBaseSchema = z.object({
  id: z.string().uuid(),
  source: EventSourceSchema,
  occurredAt: z.string().datetime({ offset: true }),
  receivedAt: z.string().datetime({ offset: true }),
  priority: EventPrioritySchema.default('normal'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const ConnectionEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('connection'),
  payload: ConnectionPayloadSchema,
});
export const DisconnectEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('disconnect'),
  payload: DisconnectPayloadSchema,
});
export const ReconnectEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('reconnect'),
  payload: ReconnectPayloadSchema,
});
export const JoinEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('join'),
  payload: JoinPayloadSchema,
});
export const ChatEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('chat'),
  payload: ChatPayloadSchema,
});
export const FollowEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('follow'),
  payload: FollowPayloadSchema,
});
export const LikeEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('like'),
  payload: LikePayloadSchema,
});
export const GiftEventSchema = EnvelopeBaseSchema.extend({
  type: z.literal('gift'),
  payload: GiftPayloadSchema,
});

export const LiveEventSchema = z.discriminatedUnion('type', [
  ConnectionEventSchema,
  DisconnectEventSchema,
  ReconnectEventSchema,
  JoinEventSchema,
  ChatEventSchema,
  FollowEventSchema,
  LikeEventSchema,
  GiftEventSchema,
]);

export type ConnectionEvent = z.infer<typeof ConnectionEventSchema>;
export type DisconnectEvent = z.infer<typeof DisconnectEventSchema>;
export type ReconnectEvent = z.infer<typeof ReconnectEventSchema>;
export type JoinEvent = z.infer<typeof JoinEventSchema>;
export type ChatEvent = z.infer<typeof ChatEventSchema>;
export type FollowEvent = z.infer<typeof FollowEventSchema>;
export type LikeEvent = z.infer<typeof LikeEventSchema>;
export type GiftEvent = z.infer<typeof GiftEventSchema>;
export type LiveEvent = z.infer<typeof LiveEventSchema>;

export interface LiveEventPayloadMap {
  connection: z.input<typeof ConnectionPayloadSchema>;
  disconnect: z.input<typeof DisconnectPayloadSchema>;
  reconnect: z.input<typeof ReconnectPayloadSchema>;
  join: z.input<typeof JoinPayloadSchema>;
  chat: z.input<typeof ChatPayloadSchema>;
  follow: z.input<typeof FollowPayloadSchema>;
  like: z.input<typeof LikePayloadSchema>;
  gift: z.input<typeof GiftPayloadSchema>;
}

export interface CreateLiveEventOptions {
  id?: string;
  occurredAt?: string | Date;
  receivedAt?: string | Date;
  priority?: EventPriority;
  metadata?: Record<string, unknown>;
  idFactory?: () => string;
}

const fallbackUuid = (): string => {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
};

const createId = (): string => globalThis.crypto?.randomUUID?.() ?? fallbackUuid();
const iso = (value: string | Date | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date().toISOString();

export function createLiveEvent<TType extends LiveEventType>(
  type: TType,
  payload: LiveEventPayloadMap[TType],
  source: EventSource,
  options: CreateLiveEventOptions = {},
): Extract<LiveEvent, { type: TType }> {
  return LiveEventSchema.parse({
    id: options.id ?? options.idFactory?.() ?? createId(),
    type,
    source,
    occurredAt: iso(options.occurredAt),
    receivedAt: iso(options.receivedAt),
    priority: options.priority ?? (type === 'gift' ? 'high' : 'normal'),
    metadata: options.metadata ?? {},
    payload,
  }) as Extract<LiveEvent, { type: TType }>;
}

export const parseLiveEvent = (input: unknown): LiveEvent => LiveEventSchema.parse(input);

export const isViewerEvent = (
  event: LiveEvent,
): event is Exclude<LiveEvent, ConnectionEvent | DisconnectEvent | ReconnectEvent> =>
  event.type !== 'connection' && event.type !== 'disconnect' && event.type !== 'reconnect';

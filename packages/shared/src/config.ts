import { z } from 'zod';

export const DEFAULT_LOCAL_PORT = 17_321;
export const DEFAULT_TIKFINITY_URL = 'ws://127.0.0.1:21213/';

const HexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, 'Expected a six-digit hex color');
const containsCredentialMaterial = (url: URL): boolean =>
  Boolean(url.username || url.password || [...url.searchParams.keys()].some((key) => /(?:key|token|secret|auth|password)/i.test(key)));
const SafeProviderEndpointSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  const loopback = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname);
  return (url.protocol === 'https:' || (url.protocol === 'http:' && loopback)) && !containsCredentialMaterial(url);
}, 'Provider endpoint must use HTTPS (or loopback HTTP) and must not contain credentials');
const SafeHttpsUrlSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !containsCredentialMaterial(url);
}, 'URL must use HTTPS and must not contain credentials');
const LoopbackWebSocketSchema = z.string().url().refine((value) => {
  const url = new URL(value);
  return (
    (url.protocol === 'ws:' || url.protocol === 'wss:')
    && ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname)
  );
}, 'TikFinity must use a loopback ws:// or wss:// URL');

export const ReconnectConfigSchema = z.object({
  enabled: z.boolean().default(true),
  initialDelayMs: z.number().int().min(100).max(60_000).default(1_000),
  maxDelayMs: z.number().int().min(1_000).max(300_000).default(30_000),
  factor: z.number().min(1).max(10).default(2),
  jitterRatio: z.number().min(0).max(1).default(0.2),
  maxAttempts: z.number().int().positive().nullable().default(null),
});

export const SpamPolicySchema = z.object({
  windowMs: z.number().int().min(250).max(600_000).default(10_000),
  maxEventsPerViewer: z.number().int().positive().max(1_000).default(12),
  maxChatPerViewer: z.number().int().positive().max(1_000).default(5),
  duplicateWindowMs: z.number().int().min(0).max(600_000).default(15_000),
  maxQueueDepth: z.number().int().positive().max(100_000).default(2_000),
});

export const AiProviderIdSchema = z.enum([
  'openai',
  'groq',
  'deepseek',
  'qwen',
  'glm',
  'grok',
  'compatible',
]);
export type AiProviderId = z.infer<typeof AiProviderIdSchema>;

export const AppConfigSchema = z.object({
  schemaVersion: z.literal(1),
  server: z.object({
    host: z.literal('127.0.0.1').default('127.0.0.1'),
    port: z.number().int().min(1_024).max(65_535).default(DEFAULT_LOCAL_PORT),
    stagePath: z.string().regex(/^\/[a-z0-9/_-]*$/i).default('/stage'),
  }),
  tikfinity: z.object({
    tiktokAccount: z.string().trim().max(64).default(''),
    url: LoopbackWebSocketSchema.default(DEFAULT_TIKFINITY_URL),
    connectOnLaunch: z.boolean().default(false),
    reconnect: ReconnectConfigSchema,
  }),
  spam: SpamPolicySchema,
  viewer: z.object({
    pointsPerJoin: z.number().int().nonnegative().default(1),
    pointsPerFollow: z.number().int().nonnegative().default(25),
    pointsPerLike: z.number().nonnegative().default(0.1),
    pointsPerDiamond: z.number().nonnegative().default(1),
    leaderboardSize: z.number().int().min(1).max(100).default(10),
  }),
  music: z.object({
    volume: z.number().min(0).max(1).default(0.65),
    crossfadeMs: z.number().int().min(0).max(30_000).default(750),
    repeat: z.enum(['off', 'one', 'all']).default('all'),
    shuffle: z.boolean().default(false),
    playlist: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(200),
          title: z.string().trim().min(1).max(200),
          artist: z.string().trim().max(200).optional(),
          assetId: z.string().trim().min(1).max(200),
        }),
      )
      .max(1_000)
      .default([]),
  }),
  led: z.object({
    enabled: z.boolean().default(true),
    text: z.string().max(240).default('ORBITSTAGE LIVE • CHÀO MỪNG BẠN'),
    speed: z.number().min(0).max(100).default(35),
    color: HexColorSchema.default('#f4f7ff'),
    glowColor: HexColorSchema.default('#8b5cf6'),
    style: z.enum(['marquee', 'pulse', 'static']).default('marquee'),
  }),
  stage: z.object({
    theme: z.enum(['cosmos', 'aurora', 'midnight']).default('cosmos'),
    accentColor: HexColorSchema.default('#8b5cf6'),
    backgroundType: z.enum(['gradient', 'image', 'video']).default('gradient'),
    backgroundAssetId: z.string().max(200).nullable().default(null),
    characterAssetIds: z.array(z.string().max(200)).max(2).default([]),
    showLeaderboard: z.boolean().default(true),
    showChat: z.boolean().default(true),
    showViewerLevels: z.boolean().default(true),
    showGiftWishes: z.boolean().default(true),
    effectQuality: z.enum(['low', 'balanced', 'high']).default('balanced'),
    avatarStyle: z.enum(['round', 'hex', 'neon']).default('neon'),
  }),
  characters: z.object({
    enabled: z.boolean().default(true),
    dualHost: z.boolean().default(false),
    hostAAssetId: z.string().trim().max(200).nullable().default(null),
    hostBAssetId: z.string().trim().max(200).nullable().default(null),
    lipSync: z.boolean().default(true),
    blink: z.boolean().default(true),
    shuffle: z.boolean().default(false),
  }),
  ai: z.object({
    enabled: z.boolean().default(false),
    provider: AiProviderIdSchema.default('openai'),
    endpoint: SafeProviderEndpointSchema.default('https://api.openai.com'),
    model: z.string().trim().min(1).max(200).default('gpt-5-mini'),
    apiKeySecretId: z.string().trim().min(1).max(200).optional(),
    persona: z.string().max(4_000).default('Bạn là MC sân khấu thân thiện, súc tích và tích cực.'),
    contentFilter: z.boolean().default(true),
    maxRequestsPerMinute: z.number().int().positive().max(120).default(12),
    timeoutMs: z.number().int().min(1_000).max(120_000).default(20_000),
    autoHype: z.object({
      enabled: z.boolean().default(false),
      minimumIntervalMs: z.number().int().min(5_000).max(3_600_000).default(60_000),
      idleIntervalMs: z.number().int().min(10_000).max(3_600_000).default(180_000),
      likeMilestone: z.number().int().positive().default(100),
    }),
  }),
  tts: z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(['openai', 'edge']).default('edge'),
    apiKeySecretId: z.string().trim().min(1).max(200).optional(),
    model: z.string().trim().min(1).max(200).default('gpt-4o-mini-tts'),
    voice: z.string().trim().min(1).max(100).default('alloy'),
    volume: z.number().min(0).max(1).default(1),
    maxQueueDepth: z.number().int().min(1).max(1_000).default(100),
  }),
  license: z.object({
    enabled: z.boolean().default(false),
    serverUrl: SafeHttpsUrlSchema.optional(),
    productId: z.string().trim().min(1).max(100).optional(),
    offlineGraceHours: z.number().int().min(0).max(8_760).default(72),
  }),
  updater: z.object({
    enabled: z.boolean().default(false),
    manifestUrl: SafeHttpsUrlSchema.optional(),
    requireSignature: z.boolean().default(true),
    channel: z.enum(['stable', 'beta']).default('stable'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    maxFiles: z.number().int().min(1).max(30).default(7),
    maxFileSizeBytes: z.number().int().min(64_000).max(100_000_000).default(5_000_000),
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type AppConfigInput = z.input<typeof AppConfigSchema>;

export const DEFAULT_APP_CONFIG: AppConfig = AppConfigSchema.parse({
  schemaVersion: 1,
  server: {},
  tikfinity: {
    url: DEFAULT_TIKFINITY_URL,
    reconnect: {},
  },
  spam: {},
  viewer: {},
  music: {},
  led: {},
  stage: {},
  characters: {},
  ai: {
    autoHype: {},
  },
  tts: {},
  license: {},
  updater: {},
  logging: {},
});

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeObjects = (base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const previous = merged[key];
    merged[key] = isPlainObject(previous) && isPlainObject(value) ? mergeObjects(previous, value) : value;
  }
  return merged;
};

export const mergeAppConfig = (base: AppConfig, patch: DeepPartial<AppConfig>): AppConfig =>
  AppConfigSchema.parse(mergeObjects(base as unknown as Record<string, unknown>, patch as Record<string, unknown>));

export type PublicAppConfig = Omit<AppConfig, 'ai' | 'tts'> & {
  ai: Omit<AppConfig['ai'], 'apiKeySecretId'>;
  tts: Omit<AppConfig['tts'], 'apiKeySecretId'>;
};

export const sanitizeConfigForExport = (config: AppConfig): PublicAppConfig => {
  const { apiKeySecretId: _aiSecret, ...ai } = config.ai;
  const { apiKeySecretId: _ttsSecret, ...tts } = config.tts;
  return { ...config, ai, tts };
};

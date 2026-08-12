import { z } from "zod";

export const DEFAULT_PORT = 17_321;
export const DEFAULT_TIKFINITY_URL = "ws://127.0.0.1:21213/";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);
const localWebSocketUrl = z.string().url().refine((value) => {
  const parsed = new URL(value);
  return (
    (parsed.protocol === "ws:" || parsed.protocol === "wss:") &&
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)
  );
}, "TikFinity must use a loopback WebSocket URL");

export const appConfigSchema = z.object({
  version: z.literal(1),
  live: z.object({
    tiktokAccount: z.string().trim().max(64).default(""),
    tikfinityUrl: localWebSocketUrl.default(DEFAULT_TIKFINITY_URL),
    localPort: z.number().int().min(1024).max(65_535).default(DEFAULT_PORT),
    reconnect: z.boolean().default(true),
    spamWindowSeconds: z.number().min(0.25).max(60).default(2),
    maxEventsPerViewer: z.number().int().min(1).max(120).default(20)
  }),
  led: z.object({
    enabled: z.boolean().default(true),
    text: z.string().max(120).default("ORBITSTAGE LIVE • CHÀO MỪNG BẠN"),
    speed: z.number().min(0).max(100).default(35),
    color: hexColor.default("#f4f7ff"),
    glowColor: hexColor.default("#7c5cff"),
    style: z.enum(["marquee", "pulse", "static"]).default("marquee")
  }),
  stage: z.object({
    gameMode: z.enum(["dance-floor", "bamboo-battle"]).default("dance-floor"),
    bambooRoundSeconds: z.number().int().min(30).max(300).default(60),
    bambooAutoRestart: z.boolean().default(true),
    bambooLikePower: z.number().min(0.01).max(2).default(0.08),
    bambooGiftPower: z.number().min(0.1).max(5).default(0.8),
    bambooGreenCharacter: z.enum(["bear", "dog"]).default("bear"),
    bambooOrangeCharacter: z.enum(["bear", "dog"]).default("dog"),
    theme: z.enum(["cosmos", "aurora", "midnight"]).default("cosmos"),
    backgroundType: z.enum(["gradient", "image", "video"]).default("gradient"),
    backgroundSource: z.string().max(1024).default(""),
    showChat: z.boolean().default(true),
    showLeaderboard: z.boolean().default(true),
    showLevel: z.boolean().default(true),
    showWishes: z.boolean().default(true),
    effectQuality: z.enum(["low", "balanced", "high"]).default("balanced"),
    avatarStyle: z.enum(["round", "hex", "neon"]).default("neon"),
    threeDEnabled: z.boolean().default(true),
    danceFloorStyle: z.enum(["orbit", "club", "prism"]).default("orbit"),
    cameraMode: z.enum(["ambient", "cinematic", "locked"]).default("ambient"),
    floorBright: z.boolean().default(true),
    lasers: z.boolean().default(true),
    ledScreens: z.boolean().default(true),
    topPodiums: z.boolean().default(true),
    autoFitCrowd: z.boolean().default(true),
    maxFloorActors: z.number().int().min(8).max(80).default(50),
    floorWidth: z.number().int().min(80).max(110).default(100),
    commandBoardEnabled: z.boolean().default(true),
    commandToggles: z.object({
      HEY: z.boolean().default(true), QUAY: z.boolean().default(true), CAM: z.boolean().default(true), CHUC: z.boolean().default(true),
      NHAY: z.boolean().default(true), PARTY: z.boolean().default(true), TIM: z.boolean().default(true), HELLO: z.boolean().default(true)
    }).default({ HEY: true, QUAY: true, CAM: true, CHUC: true, NHAY: true, PARTY: true, TIM: true, HELLO: true }),
    audioOwner: z.enum(["stage-window", "obs"]).default("stage-window"),
  }),
  music: z.object({
    volume: z.number().min(0).max(100).default(70),
    playlist: z.array(z.object({
      id: z.string().min(1).max(80),
      title: z.string().min(1).max(160),
      path: z.string().max(1024),
      rights: z.enum(["owned", "licensed", "cc0", "placeholder"])
    })).max(500).default([]),
    currentTrackId: z.string().max(80).nullable().default(null),
    playing: z.boolean().default(false),
    crossfadeSeconds: z.number().min(0).max(8).default(1.5),
    beatSensitivity: z.number().min(0.5).max(3).default(1.4)
  }),
  characters: z.object({
    enabled: z.boolean().default(true),
    dualHost: z.boolean().default(true),
    hostA: z.string().max(120).default("Luna"),
    hostB: z.string().max(120).default("Ryan"),
    lipSync: z.boolean().default(true),
    blink: z.boolean().default(true),
    shuffle: z.boolean().default(false)
  }),
  ai: z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(["openai", "compatible", "groq", "deepseek", "qwen", "glm", "grok"]).default("openai"),
    endpoint: z.string().max(500).refine((value) => value === "" || z.url().safeParse(value).success, "Endpoint must be blank or a URL").default(""),
    model: z.string().max(160).default("gpt-4.1-mini"),
    persona: z.string().max(4_000).default("Bạn là MC thân thiện, sôi động và tôn trọng người xem."),
    autoHype: z.boolean().default(false),
    mcEnabled: z.boolean().default(true),
    djEnabled: z.boolean().default(true),
    greetJoins: z.boolean().default(true),
    commentReplies: z.boolean().default(true),
    giftThanks: z.boolean().default(true),
    praiseTease: z.boolean().default(true),
    liveTime: z.boolean().default(true),
    joinBatchSeconds: z.number().int().min(2).max(30).default(7),
    liveTimeMinutes: z.number().int().min(5).max(120).default(15),
    hypeIntervalSeconds: z.number().int().min(15).max(3_600).default(120),
    rateLimitPerMinute: z.number().int().min(1).max(60).default(12),
    contentFilter: z.boolean().default(true),
    ttsProvider: z.enum(["openai", "edge"]).default("edge"),
    ttsVoice: z.string().max(120).default("vi-VN-HoaiMyNeural"),
    ttsVolume: z.number().min(0).max(100).default(80)
  })
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export const DEFAULT_CONFIG: AppConfig = appConfigSchema.parse({
  version: 1,
  live: {},
  led: {},
  stage: {},
  music: {},
  characters: {},
  ai: {}
});

export type SecretName = "aiApiKey";

export function mergeConfig(current: AppConfig, patch: unknown): AppConfig {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new Error("Config patch must be an object");
  }

  const incoming = patch as Record<string, unknown>;
  const merged = structuredClone(current) as Record<string, unknown>;
  for (const section of ["live", "led", "stage", "music", "characters", "ai"] as const) {
    if (incoming[section] !== undefined) {
      if (!incoming[section] || typeof incoming[section] !== "object" || Array.isArray(incoming[section])) {
        throw new Error(`Config section ${section} must be an object`);
      }
      merged[section] = {
        ...(merged[section] as Record<string, unknown>),
        ...(incoming[section] as Record<string, unknown>)
      };
    }
  }
  merged.version = 1;
  return appConfigSchema.parse(merged);
}

export function publicConfig(config: AppConfig): AppConfig {
  return structuredClone(config);
}

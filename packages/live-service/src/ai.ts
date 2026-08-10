import type { AiProviderId, LiveEvent } from '@orbitstage/shared';
import { SlidingWindowRateLimiter } from './rate-limiter.js';
import {
  NOOP_LOGGER,
  SYSTEM_CLOCK,
  SYSTEM_SCHEDULER,
  type Clock,
  type Logger,
  type SecretResolver,
  type TimerScheduler,
} from './types.js';

export interface AiCompletionRequest {
  prompt: string;
  persona?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AiCompletion {
  text: string;
  provider: AiProviderId;
  model: string;
  latencyMs: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface AiProvider {
  readonly id: AiProviderId;
  readonly model: string;
  complete(request: AiCompletionRequest, signal?: AbortSignal): Promise<AiCompletion>;
}

export type AiApiProtocol = 'responses' | 'chat-completions';

export interface OpenAICompatibleProviderOptions {
  id: AiProviderId;
  endpoint: string;
  model: string;
  secretId: string;
  secrets: SecretResolver;
  protocol?: AiApiProtocol;
  timeoutMs?: number;
  retries?: number;
  fetch?: typeof fetch;
  logger?: Logger;
  additionalHeaders?: Record<string, string>;
  sleep?: (delayMs: number, signal?: AbortSignal) => Promise<void>;
}

export const AI_PROVIDER_PRESETS: Record<Exclude<AiProviderId, 'compatible'>, { endpoint: string; protocol: AiApiProtocol }> = {
  openai: { endpoint: 'https://api.openai.com', protocol: 'responses' },
  groq: { endpoint: 'https://api.groq.com/openai', protocol: 'chat-completions' },
  deepseek: { endpoint: 'https://api.deepseek.com', protocol: 'chat-completions' },
  qwen: { endpoint: 'https://dashscope-intl.aliyuncs.com/compatible-mode', protocol: 'chat-completions' },
  glm: { endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', protocol: 'chat-completions' },
  grok: { endpoint: 'https://api.x.ai', protocol: 'chat-completions' },
};

export interface AiProviderRuntimeConfig {
  id: AiProviderId;
  model: string;
  secretId: string;
  endpoint?: string;
  protocol?: AiApiProtocol;
  timeoutMs?: number;
  retries?: number;
}

export function createAiProvider(
  config: AiProviderRuntimeConfig,
  dependencies: Pick<OpenAICompatibleProviderOptions, 'secrets'>
    & Partial<Pick<OpenAICompatibleProviderOptions, 'fetch' | 'logger' | 'sleep' | 'additionalHeaders'>>,
): OpenAICompatibleProvider {
  const preset = config.id === 'compatible' ? undefined : AI_PROVIDER_PRESETS[config.id];
  const endpoint = config.endpoint ?? preset?.endpoint;
  if (!endpoint) throw new TypeError('A custom AI provider endpoint is required');
  return new OpenAICompatibleProvider({
    id: config.id,
    endpoint,
    model: config.model,
    secretId: config.secretId,
    protocol: config.protocol ?? preset?.protocol ?? 'chat-completions',
    timeoutMs: config.timeoutMs,
    retries: config.retries,
    secrets: dependencies.secrets,
    fetch: dependencies.fetch,
    logger: dependencies.logger,
    sleep: dependencies.sleep,
    additionalHeaders: dependencies.additionalHeaders,
  });
}

const defaultSleep = async (delayMs: number, signal?: AbortSignal): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('Aborted'));
      return;
    }
    const finish = (): void => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    const timer = setTimeout(finish, delayMs);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
};

export class AiProviderError extends Error {
  public constructor(
    message: string,
    public readonly code: 'missing-secret' | 'timeout' | 'http' | 'invalid-response' | 'aborted',
    public readonly retryable = false,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export class OpenAICompatibleProvider implements AiProvider {
  public readonly id: AiProviderId;
  public readonly model: string;
  private readonly protocol: AiApiProtocol;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly logger: Logger;
  private readonly sleep: (delayMs: number, signal?: AbortSignal) => Promise<void>;

  public constructor(private readonly options: OpenAICompatibleProviderOptions) {
    this.id = options.id;
    this.model = options.model;
    this.protocol = options.protocol ?? (options.id === 'openai' ? 'responses' : 'chat-completions');
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.retries = options.retries ?? 1;
    this.logger = options.logger ?? NOOP_LOGGER;
    this.sleep = options.sleep ?? defaultSleep;
    if (!this.fetchImpl) throw new TypeError('A Fetch implementation is required');
    if (!this.model.trim()) throw new TypeError('AI model is required');
    const endpoint = new URL(options.endpoint);
    if (endpoint.protocol !== 'https:' && !isLoopback(endpoint)) throw new TypeError('AI endpoint must use HTTPS unless it is loopback');
    if (endpoint.username || endpoint.password) throw new TypeError('AI endpoint must not contain credentials');
  }

  public async complete(request: AiCompletionRequest, signal?: AbortSignal): Promise<AiCompletion> {
    const prompt = request.prompt.trim();
    if (!prompt || prompt.length > 20_000) throw new TypeError('Prompt must contain 1 to 20,000 characters');
    const secret = await this.options.secrets.resolve(this.options.secretId);
    if (!secret) throw new AiProviderError('AI provider credential is not configured', 'missing-secret');
    const startedAt = Date.now();
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new AiProviderError('AI request timed out', 'timeout', true)), this.timeoutMs);
      const onAbort = (): void => controller.abort(signal?.reason ?? new AiProviderError('AI request aborted', 'aborted'));
      signal?.addEventListener('abort', onAbort, { once: true });
      try {
        const response = await this.fetchImpl(this.requestUrl(), {
          method: 'POST',
          headers: {
            ...this.options.additionalHeaders,
            'content-type': 'application/json',
            authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify(this.requestBody(request)),
          signal: controller.signal,
          redirect: 'error',
        });
        if (!response.ok) {
          const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
          throw new AiProviderError(`AI provider returned HTTP ${response.status}`, 'http', retryable, response.status);
        }
        const body = (await response.json()) as unknown;
        const parsed = parseAiResponse(body, this.protocol);
        return {
          text: parsed.text,
          provider: this.id,
          model: this.model,
          latencyMs: Date.now() - startedAt,
          ...(parsed.usage ? { usage: parsed.usage } : {}),
        };
      } catch (error) {
        lastError = controller.signal.aborted
          ? controller.signal.reason ?? new AiProviderError('AI request aborted', 'aborted')
          : error instanceof AiProviderError
            ? error
            : new AiProviderError('AI provider network request failed', 'http', true);
        const retryable = lastError instanceof AiProviderError && lastError.retryable;
        if (!retryable || attempt >= this.retries || signal?.aborted) break;
        this.logger.warn('Retrying AI provider request', { provider: this.id, attempt: attempt + 1, error: lastError });
        await this.sleep(Math.min(2_000, 250 * 2 ** attempt), signal);
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', onAbort);
      }
    }
    if (lastError instanceof AiProviderError) throw lastError;
    throw new AiProviderError(lastError instanceof Error ? lastError.message : 'AI provider request failed', 'http', false);
  }

  private requestUrl(): string {
    const url = new URL(this.options.endpoint);
    const suffix = this.protocol === 'responses' ? 'responses' : 'chat/completions';
    const current = url.pathname.replace(/\/+$/, '');
    if (current.endsWith('/responses') || current.endsWith('/chat/completions')) return url.toString();
    url.pathname = `${current}${current.endsWith('/v1') ? '' : '/v1'}/${suffix}`.replace(/\/+/g, '/');
    return url.toString();
  }

  private requestBody(request: AiCompletionRequest): Record<string, unknown> {
    const maxOutputTokens = Math.min(4_096, Math.max(1, request.maxOutputTokens ?? 300));
    if (this.protocol === 'responses') {
      return {
        model: this.model,
        store: false,
        instructions: request.persona,
        input: request.prompt,
        max_output_tokens: maxOutputTokens,
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      };
    }
    return {
      model: this.model,
      messages: [
        ...(request.persona ? [{ role: 'system', content: request.persona }] : []),
        { role: 'user', content: request.prompt },
      ],
      max_tokens: maxOutputTokens,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    };
  }
}

const isLoopback = (url: URL): boolean =>
  url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]';

interface ParsedAiResponse {
  text: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

function parseAiResponse(input: unknown, protocol: AiApiProtocol): ParsedAiResponse {
  const body = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : undefined;
  if (!body) throw new AiProviderError('AI provider returned invalid JSON', 'invalid-response');
  let responseText: string | undefined;
  if (protocol === 'responses') {
    responseText = typeof body.output_text === 'string' ? body.output_text : undefined;
    if (!responseText && Array.isArray(body.output)) {
      const segments: string[] = [];
      for (const output of body.output) {
        const item = typeof output === 'object' && output !== null ? (output as Record<string, unknown>) : undefined;
        if (!item || !Array.isArray(item.content)) continue;
        for (const content of item.content) {
          const part = typeof content === 'object' && content !== null ? (content as Record<string, unknown>) : undefined;
          if (typeof part?.text === 'string') segments.push(part.text);
        }
      }
      responseText = segments.join('\n');
    }
  } else if (Array.isArray(body.choices)) {
    const firstChoice = body.choices[0] as Record<string, unknown> | undefined;
    const message = firstChoice && typeof firstChoice.message === 'object' ? (firstChoice.message as Record<string, unknown>) : undefined;
    responseText = typeof message?.content === 'string' ? message.content : undefined;
  }
  if (!responseText?.trim()) throw new AiProviderError('AI provider response did not contain text', 'invalid-response');
  const rawUsage = typeof body.usage === 'object' && body.usage !== null ? (body.usage as Record<string, unknown>) : undefined;
  const inputTokens = numericToken(rawUsage?.input_tokens ?? rawUsage?.prompt_tokens);
  const outputTokens = numericToken(rawUsage?.output_tokens ?? rawUsage?.completion_tokens);
  return {
    text: responseText.trim(),
    ...(inputTokens !== undefined || outputTokens !== undefined
      ? { usage: { ...(inputTokens !== undefined ? { inputTokens } : {}), ...(outputTokens !== undefined ? { outputTokens } : {}) } }
      : {}),
  };
}

const numericToken = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : undefined;

export type SafetyCategory = 'sexual' | 'violence' | 'self-harm' | 'hate' | 'personal-data' | 'prompt-injection';
export interface SafetyDecision {
  safe: boolean;
  categories: readonly SafetyCategory[];
  sanitizedText: string;
}

const DEFAULT_SAFETY_RULES: ReadonlyArray<{ category: SafetyCategory; pattern: RegExp }> = [
  { category: 'sexual', pattern: /\b(?:porn|nude|explicit sex)\b/i },
  { category: 'violence', pattern: /\b(?:kill|murder|chém|giết)\b/i },
  { category: 'self-harm', pattern: /\b(?:suicide|self[- ]?harm|tự tử)\b/i },
  { category: 'hate', pattern: /\b(?:racial slur|ethnic cleansing)\b/i },
  { category: 'personal-data', pattern: /\b(?:\d[ -]*?){13,19}\b|\b\d{9,12}\b/i },
  { category: 'prompt-injection', pattern: /(?:ignore|bỏ qua).{0,30}(?:previous|trước|system).{0,20}(?:instruction|hướng dẫn)/i },
];

export class ContentSafetyFilter {
  public constructor(
    private readonly rules: ReadonlyArray<{ category: SafetyCategory; pattern: RegExp }> = DEFAULT_SAFETY_RULES,
    private readonly customBlockedTerms: readonly string[] = [],
  ) {}

  public inspect(value: string): SafetyDecision {
    const sanitizedText = value
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .replace(/https?:\/\/\S+/gi, '[liên kết]')
      .trim()
      .slice(0, 20_000);
    const categories = new Set<SafetyCategory>();
    for (const rule of this.rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(sanitizedText)) categories.add(rule.category);
    }
    const folded = sanitizedText.toLocaleLowerCase();
    if (this.customBlockedTerms.some((term) => term.trim() && folded.includes(term.trim().toLocaleLowerCase()))) {
      categories.add('hate');
    }
    return { safe: categories.size === 0, categories: [...categories], sanitizedText };
  }
}

export interface SafeAiServiceOptions {
  provider: AiProvider;
  safety?: ContentSafetyFilter;
  requestsPerMinute?: number;
  fallbackText?: string;
  clock?: Clock;
}

export class SafeAiService {
  private readonly safety: ContentSafetyFilter;
  private readonly limiter: SlidingWindowRateLimiter;
  private readonly fallbackText: string;

  public constructor(private readonly options: SafeAiServiceOptions) {
    this.safety = options.safety ?? new ContentSafetyFilter();
    this.limiter = new SlidingWindowRateLimiter(options.requestsPerMinute ?? 12, 60_000, options.clock);
    this.fallbackText = options.fallbackText ?? 'Mình xin phép chuyển sang một chủ đề tích cực hơn nhé!';
  }

  public async complete(request: AiCompletionRequest, actorId = 'system', signal?: AbortSignal): Promise<AiCompletion> {
    if (!this.limiter.check(actorId).allowed) throw new AiProviderError('AI request rate limit exceeded', 'http', true, 429);
    const input = this.safety.inspect(request.prompt);
    if (!input.safe) return this.fallback(request, input.categories);
    const completion = await this.options.provider.complete({ ...request, prompt: input.sanitizedText }, signal);
    const output = this.safety.inspect(completion.text);
    return output.safe ? { ...completion, text: output.sanitizedText } : this.fallback(request, output.categories);
  }

  private fallback(request: AiCompletionRequest, categories: readonly SafetyCategory[]): AiCompletion {
    void request;
    void categories;
    return { text: this.fallbackText, provider: this.options.provider.id, model: this.options.provider.model, latencyMs: 0 };
  }
}

export type AutoHypeReason = 'follow' | 'gift' | 'like-milestone' | 'idle';
export interface AutoHypeTrigger {
  reason: AutoHypeReason;
  prompt: string;
  event?: LiveEvent;
}

export interface AutoHypeOptions {
  minimumIntervalMs?: number;
  idleIntervalMs?: number;
  likeMilestone?: number;
  clock?: Clock;
  scheduler?: TimerScheduler;
  logger?: Logger;
}

export class AutoHypeEngine {
  private readonly listeners = new Set<(trigger: AutoHypeTrigger) => void>();
  private readonly minimumIntervalMs: number;
  private readonly idleIntervalMs: number;
  private readonly likeMilestone: number;
  private readonly clock: Clock;
  private readonly scheduler: TimerScheduler;
  private readonly logger: Logger;
  private cancelTimer?: () => void;
  private lastActivityAt: number;
  private lastHypeAt = Number.NEGATIVE_INFINITY;
  private likesSinceHype = 0;

  public constructor(options: AutoHypeOptions = {}) {
    this.minimumIntervalMs = options.minimumIntervalMs ?? 60_000;
    this.idleIntervalMs = options.idleIntervalMs ?? 180_000;
    this.likeMilestone = options.likeMilestone ?? 100;
    this.clock = options.clock ?? SYSTEM_CLOCK;
    this.scheduler = options.scheduler ?? SYSTEM_SCHEDULER;
    this.logger = options.logger ?? NOOP_LOGGER;
    if (!Number.isFinite(this.minimumIntervalMs) || this.minimumIntervalMs < 0) {
      throw new RangeError('minimumIntervalMs must be non-negative');
    }
    if (!Number.isFinite(this.idleIntervalMs) || this.idleIntervalMs < 1_000) {
      throw new RangeError('idleIntervalMs must be at least 1000ms');
    }
    if (!Number.isInteger(this.likeMilestone) || this.likeMilestone < 1) {
      throw new RangeError('likeMilestone must be a positive integer');
    }
    this.lastActivityAt = this.clock.now();
  }

  public start(): void {
    if (!this.cancelTimer) this.scheduleIdleCheck();
  }

  public stop(): void {
    this.cancelTimer?.();
    this.cancelTimer = undefined;
  }

  public observe(event: LiveEvent): AutoHypeTrigger | undefined {
    if (event.type === 'connection' || event.type === 'disconnect' || event.type === 'reconnect') return undefined;
    this.lastActivityAt = this.clock.now();
    if (event.type === 'like') {
      this.likesSinceHype += event.payload.count;
      if (this.likesSinceHype >= this.likeMilestone) {
        return this.tryEmit({
          reason: 'like-milestone',
          prompt: `Cảm ơn khán giả vì ${this.likesSinceHype} lượt thích gần đây bằng một câu ngắn, hào hứng.`,
          event,
        });
      }
    }
    if (event.type === 'gift') {
      return this.tryEmit({
        reason: 'gift',
        prompt: `Cảm ơn ${safeName(event.payload.viewer.displayName)} đã tặng ${event.payload.repeatCount} ${event.payload.giftName}. Nói tối đa hai câu.`,
        event,
      });
    }
    if (event.type === 'follow') {
      return this.tryEmit({
        reason: 'follow',
        prompt: `Chào mừng ${safeName(event.payload.viewer.displayName)} vừa theo dõi. Nói một câu vui vẻ.`,
        event,
      });
    }
    return undefined;
  }

  public onTrigger(listener: (trigger: AutoHypeTrigger) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public checkIdle(): AutoHypeTrigger | undefined {
    const now = this.clock.now();
    if (now - this.lastActivityAt < this.idleIntervalMs) return undefined;
    this.lastActivityAt = now;
    return this.tryEmit({ reason: 'idle', prompt: 'Khuấy động sân khấu bằng một câu tích cực, ngắn gọn và mời khán giả tương tác.' });
  }

  private tryEmit(trigger: AutoHypeTrigger): AutoHypeTrigger | undefined {
    const now = this.clock.now();
    if (now - this.lastHypeAt < this.minimumIntervalMs) return undefined;
    this.lastHypeAt = now;
    this.likesSinceHype = 0;
    for (const listener of this.listeners) {
      try {
        listener(trigger);
      } catch (error) {
        this.logger.error('Auto-hype listener failed', { reason: trigger.reason, error });
      }
    }
    return trigger;
  }

  private scheduleIdleCheck(): void {
    this.cancelTimer = this.scheduler(() => {
      this.cancelTimer = undefined;
      this.checkIdle();
      this.scheduleIdleCheck();
    }, Math.min(this.idleIntervalMs, 30_000));
  }
}

const safeName = (name: string): string =>
  name.replace(/[\r\n<>]/g, '').trim().slice(0, 100) || 'một khán giả';

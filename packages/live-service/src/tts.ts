import { createHash } from 'node:crypto';
import { ContentSafetyFilter } from './ai.js';
import { NOOP_LOGGER, type Logger, type SecretResolver } from './types.js';

export type SpeechPriority = 'low' | 'normal' | 'high' | 'critical';
export type SpeechSource = 'mc' | 'dj' | 'viewer' | 'system' | 'test';

export interface SpeechRequest {
  id: string;
  text: string;
  source: SpeechSource;
  priority?: SpeechPriority;
  voice?: string;
  volume?: number;
  dedupeKey?: string;
}

export interface SynthesizedSpeech {
  audio: Uint8Array;
  mimeType: string;
  provider: string;
  voice: string;
}

export interface TtsProvider {
  readonly id: 'openai' | 'edge' | string;
  synthesize(text: string, options?: { voice?: string; volume?: number; signal?: AbortSignal }): Promise<SynthesizedSpeech>;
}

export const OPENAI_TTS_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
] as const;

export type OpenAiSpeechFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

export interface OpenAiTtsProviderOptions {
  endpoint?: string;
  secretId: string;
  secrets: SecretResolver;
  model?: string;
  voice?: string;
  responseFormat?: OpenAiSpeechFormat;
  instructions?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export class TtsProviderError extends Error {
  public constructor(
    message: string,
    public readonly code: 'missing-secret' | 'invalid-input' | 'timeout' | 'http' | 'empty-audio' | 'aborted',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'TtsProviderError';
  }
}

export class OpenAiTtsProvider implements TtsProvider {
  public readonly id = 'openai';
  private readonly endpoint: string;
  private readonly model: string;
  private readonly defaultVoice: string;
  private readonly responseFormat: OpenAiSpeechFormat;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  public constructor(private readonly options: OpenAiTtsProviderOptions) {
    this.endpoint = options.endpoint ?? 'https://api.openai.com';
    this.model = options.model ?? 'gpt-4o-mini-tts';
    this.defaultVoice = options.voice ?? 'alloy';
    this.responseFormat = options.responseFormat ?? 'mp3';
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) throw new TypeError('A Fetch implementation is required');
    const endpoint = new URL(this.endpoint);
    if (endpoint.protocol !== 'https:' && !isLoopback(endpoint)) throw new TypeError('TTS endpoint must use HTTPS unless loopback');
    if (endpoint.username || endpoint.password) throw new TypeError('TTS endpoint must not contain credentials');
  }

  public async synthesize(
    input: string,
    options: { voice?: string; volume?: number; signal?: AbortSignal } = {},
  ): Promise<SynthesizedSpeech> {
    const speechInput = input.trim();
    if (!speechInput || speechInput.length > 4_096) {
      throw new TtsProviderError('OpenAI TTS input must contain 1 to 4096 characters', 'invalid-input');
    }
    const secret = await this.options.secrets.resolve(this.options.secretId);
    if (!secret) throw new TtsProviderError('OpenAI TTS credential is not configured', 'missing-secret');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new TtsProviderError('TTS request timed out', 'timeout')), this.timeoutMs);
    const onAbort = (): void => controller.abort(options.signal?.reason ?? new TtsProviderError('TTS request aborted', 'aborted'));
    options.signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const voice = options.voice ?? this.defaultVoice;
      const response = await this.fetchImpl(this.requestUrl(), {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
        body: JSON.stringify({
          model: this.model,
          input: speechInput,
          voice,
          response_format: this.responseFormat,
          ...(this.options.instructions ? { instructions: this.options.instructions } : {}),
        }),
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok) throw new TtsProviderError(`TTS provider returned HTTP ${response.status}`, 'http', response.status);
      const audio = new Uint8Array(await response.arrayBuffer());
      if (audio.byteLength === 0) throw new TtsProviderError('TTS provider returned empty audio', 'empty-audio');
      return { audio, mimeType: MIME_TYPES[this.responseFormat], provider: this.id, voice };
    } catch (error) {
      if (controller.signal.aborted) throw controller.signal.reason;
      throw error;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', onAbort);
    }
  }

  private requestUrl(): string {
    const url = new URL(this.endpoint);
    const current = url.pathname.replace(/\/+$/, '');
    if (current.endsWith('/audio/speech')) return url.toString();
    url.pathname = `${current}${current.endsWith('/v1') ? '' : '/v1'}/audio/speech`.replace(/\/+/g, '/');
    return url.toString();
  }
}

const MIME_TYPES: Record<OpenAiSpeechFormat, string> = {
  mp3: 'audio/mpeg',
  opus: 'audio/opus',
  aac: 'audio/aac',
  flac: 'audio/flac',
  wav: 'audio/wav',
  pcm: 'audio/L16',
};

const isLoopback = (url: URL): boolean =>
  url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]';

export type EdgeSpeechSynthesizer = (
  text: string,
  options: { voice: string; volume: number; signal?: AbortSignal },
) => Promise<{ audio: Uint8Array | ArrayBuffer; mimeType?: string }>;

/** Adapter around a Main-process Edge speech implementation; no credential is exposed to renderers. */
export class EdgeTtsProvider implements TtsProvider {
  public readonly id = 'edge';

  public constructor(
    private readonly adapter: EdgeSpeechSynthesizer,
    private readonly defaultVoice = 'vi-VN-HoaiMyNeural',
  ) {}

  public async synthesize(
    input: string,
    options: { voice?: string; volume?: number; signal?: AbortSignal } = {},
  ): Promise<SynthesizedSpeech> {
    const text = input.trim();
    if (!text || text.length > 4_096) throw new TtsProviderError('Edge TTS input must contain 1 to 4096 characters', 'invalid-input');
    const voice = options.voice ?? this.defaultVoice;
    const result = await this.adapter(text, { voice, volume: options.volume ?? 1, ...(options.signal ? { signal: options.signal } : {}) });
    const audio = result.audio instanceof Uint8Array ? result.audio : new Uint8Array(result.audio);
    if (audio.byteLength === 0) throw new TtsProviderError('Edge TTS returned empty audio', 'empty-audio');
    return { audio, mimeType: result.mimeType ?? 'audio/mpeg', provider: this.id, voice };
  }
}

export class CachingTtsProvider implements TtsProvider {
  public readonly id: string;
  private readonly cache = new Map<string, SynthesizedSpeech>();

  public constructor(
    private readonly delegate: TtsProvider,
    private readonly capacity = 100,
  ) {
    this.id = delegate.id;
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('cache capacity must be positive');
  }

  public async synthesize(
    text: string,
    options: { voice?: string; volume?: number; signal?: AbortSignal } = {},
  ): Promise<SynthesizedSpeech> {
    const key = createHash('sha256').update(`${this.id}\u0000${options.voice ?? ''}\u0000${text}`).digest('hex');
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cloneSpeech(cached);
    }
    const generated = await this.delegate.synthesize(text, options);
    this.cache.set(key, cloneSpeech(generated));
    if (this.cache.size > this.capacity) this.cache.delete(this.cache.keys().next().value as string);
    return cloneSpeech(generated);
  }

  public clear(): void {
    this.cache.clear();
  }
}

const cloneSpeech = (speech: SynthesizedSpeech): SynthesizedSpeech => ({ ...speech, audio: speech.audio.slice() });

export type SpeechPlayer = (
  speech: SynthesizedSpeech,
  request: Readonly<SpeechRequest>,
  signal: AbortSignal,
) => Promise<void>;

export interface SpeechQueueState {
  paused: boolean;
  speaking: boolean;
  activeId: string | null;
  queued: number;
}

export interface SpeechQueueOptions {
  provider: TtsProvider | ((request: Readonly<SpeechRequest>) => TtsProvider);
  player: SpeechPlayer;
  maxDepth?: number;
  safety?: ContentSafetyFilter;
  logger?: Logger;
}

export interface SpeechQueueResult {
  id: string;
  status: 'played' | 'cancelled';
}

export class SpeechQueueError extends Error {
  public constructor(message: string, public readonly code: 'duplicate-id' | 'queue-full' | 'unsafe-content' | 'invalid-request') {
    super(message);
    this.name = 'SpeechQueueError';
  }
}

interface QueueItem {
  request: Required<Pick<SpeechRequest, 'id' | 'text' | 'source' | 'priority'>> & Omit<SpeechRequest, 'id' | 'text' | 'source' | 'priority'>;
  sequence: number;
  resolve: (result: SpeechQueueResult) => void;
  reject: (error: unknown) => void;
  promise: Promise<SpeechQueueResult>;
}

const PRIORITY: Record<SpeechPriority, number> = { low: 1, normal: 2, high: 3, critical: 4 };

export class SpeechQueue {
  private readonly queue: QueueItem[] = [];
  private readonly listeners = new Set<(state: SpeechQueueState) => void>();
  private readonly ids = new Set<string>();
  private readonly dedupe = new Map<string, Promise<SpeechQueueResult>>();
  private readonly maxDepth: number;
  private readonly safety: ContentSafetyFilter;
  private readonly logger: Logger;
  private sequence = 0;
  private paused = false;
  private active?: { item: QueueItem; controller: AbortController };

  public constructor(private readonly options: SpeechQueueOptions) {
    this.maxDepth = options.maxDepth ?? 100;
    this.safety = options.safety ?? new ContentSafetyFilter();
    this.logger = options.logger ?? NOOP_LOGGER;
  }

  public get state(): SpeechQueueState {
    return { paused: this.paused, speaking: Boolean(this.active), activeId: this.active?.item.request.id ?? null, queued: this.queue.length };
  }

  public enqueue(input: SpeechRequest): Promise<SpeechQueueResult> {
    const id = input.id.trim();
    if (!id || !input.text.trim() || input.text.length > 4_096) {
      throw new SpeechQueueError('Speech id and text (1-4096 characters) are required', 'invalid-request');
    }
    if (this.ids.has(id)) throw new SpeechQueueError(`Duplicate speech id: ${id}`, 'duplicate-id');
    if (input.dedupeKey) {
      const existing = this.dedupe.get(input.dedupeKey);
      if (existing) return existing;
    }
    if (this.queue.length + (this.active ? 1 : 0) >= this.maxDepth) throw new SpeechQueueError('Speech queue is full', 'queue-full');
    const safety = this.safety.inspect(input.text);
    if (!safety.safe) throw new SpeechQueueError('Speech text did not pass content safety', 'unsafe-content');
    if (input.volume !== undefined && (!Number.isFinite(input.volume) || input.volume < 0 || input.volume > 1)) {
      throw new SpeechQueueError('Speech volume must be between 0 and 1', 'invalid-request');
    }

    let resolve!: (result: SpeechQueueResult) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<SpeechQueueResult>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    });
    const request: QueueItem['request'] = {
      ...input,
      id,
      text: safety.sanitizedText,
      source: input.source,
      priority: input.priority ?? 'normal',
    };
    const item: QueueItem = { request, sequence: this.sequence++, resolve, reject, promise };
    this.ids.add(id);
    if (request.dedupeKey) this.dedupe.set(request.dedupeKey, promise);
    this.queue.push(item);
    this.queue.sort((a, b) => PRIORITY[b.request.priority] - PRIORITY[a.request.priority] || a.sequence - b.sequence);
    this.emitState();
    void this.drain();
    return promise;
  }

  public cancel(id: string): boolean {
    if (this.active?.item.request.id === id) {
      this.active.controller.abort(new Error('Speech cancelled'));
      return true;
    }
    const index = this.queue.findIndex((item) => item.request.id === id);
    if (index < 0) return false;
    const [item] = this.queue.splice(index, 1);
    if (item) {
      this.release(item);
      item.resolve({ id, status: 'cancelled' });
    }
    this.emitState();
    return true;
  }

  public clear(includeActive = false): void {
    for (const item of this.queue.splice(0)) {
      this.release(item);
      item.resolve({ id: item.request.id, status: 'cancelled' });
    }
    if (includeActive) this.active?.controller.abort(new Error('Speech queue cleared'));
    this.emitState();
  }

  public pause(): void {
    this.paused = true;
    this.emitState();
  }

  public resume(): void {
    this.paused = false;
    this.emitState();
    void this.drain();
  }

  public subscribe(listener: (state: SpeechQueueState) => void, emitCurrent = true): () => void {
    this.listeners.add(listener);
    if (emitCurrent) listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private async drain(): Promise<void> {
    if (this.active || this.paused) return;
    const item = this.queue.shift();
    if (!item) {
      this.emitState();
      return;
    }
    const controller = new AbortController();
    this.active = { item, controller };
    this.emitState();
    try {
      const provider = typeof this.options.provider === 'function' ? this.options.provider(item.request) : this.options.provider;
      const speech = await provider.synthesize(item.request.text, {
        ...(item.request.voice ? { voice: item.request.voice } : {}),
        ...(item.request.volume !== undefined ? { volume: item.request.volume } : {}),
        signal: controller.signal,
      });
      await this.options.player(speech, item.request, controller.signal);
      item.resolve({ id: item.request.id, status: 'played' });
    } catch (error) {
      if (controller.signal.aborted) item.resolve({ id: item.request.id, status: 'cancelled' });
      else {
        this.logger.error('Speech queue item failed', { id: item.request.id, source: item.request.source, error });
        item.reject(error);
      }
    } finally {
      this.release(item);
      this.active = undefined;
      this.emitState();
      void this.drain();
    }
  }

  private release(item: QueueItem): void {
    this.ids.delete(item.request.id);
    if (item.request.dedupeKey) this.dedupe.delete(item.request.dedupeKey);
  }

  private emitState(): void {
    const snapshot = this.state;
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (error) {
        this.logger.error('Speech queue state listener failed', { error });
      }
    }
  }
}

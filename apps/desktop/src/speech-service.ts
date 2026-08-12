import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import type { AppConfig } from "@orbitstage/runtime";
import type { StructuredLogger } from "./logger";

interface SpeechServiceOptions {
  cacheDirectory: string;
  getConfig: () => AppConfig;
  getApiKey: () => Promise<string | undefined>;
  logger: StructuredLogger;
  onQueueDepth: (depth: number) => void;
  onAudio: (payload: SpeechAudioPayload) => void;
}

interface QueueItem {
  id: string;
  text: string;
  source: "mc" | "dj" | "test" | "auto-hype";
  resolve: () => void;
  reject: (error: Error) => void;
}

export interface SpeechAudioPayload {
  id: string;
  text: string;
  source: QueueItem["source"];
  mimeType: string;
  dataUrl: string;
  volume: number;
}

function escapeXml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function collectStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => reject(new Error("Edge TTS timed out")), 30_000);
    stream.on("data", (chunk: Buffer | Uint8Array | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.once("error", (error) => { clearTimeout(timer); reject(error); });
    stream.once("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
    stream.once("close", () => {
      if (chunks.length) { clearTimeout(timer); resolve(Buffer.concat(chunks)); }
    });
  });
}

export class SpeechService {
  #queue: QueueItem[] = [];
  #processing = false;
  #recentText = new Map<string, number>();

  constructor(private readonly options: SpeechServiceOptions) {}

  enqueue(text: string, source: QueueItem["source"] = "mc"): Promise<void> {
    const normalized = text.replace(/\s+/g, " ").trim().slice(0, 4_096);
    if (!normalized) return Promise.reject(new Error("Nội dung TTS trống"));
    const key = normalized.toLocaleLowerCase("vi");
    const now = Date.now();
    if (now - (this.#recentText.get(key) ?? 0) < 5_000) {
      return Promise.reject(new Error("Nội dung TTS trùng lặp vừa được xếp hàng"));
    }
    this.#recentText.set(key, now);
    return new Promise<void>((resolve, reject) => {
      this.#queue.push({ id: randomUUID(), text: normalized, source, resolve, reject });
      if (this.#queue.length > 100) {
        const dropped = this.#queue.splice(0, this.#queue.length - 100);
        for (const item of dropped) item.reject(new Error("Hàng đợi TTS đã đầy"));
      }
      this.updateDepth();
      void this.drain();
    });
  }

  get depth(): number {
    return this.#queue.length + (this.#processing ? 1 : 0);
  }

  clear(): void {
    const pending = this.#queue.splice(0);
    for (const item of pending) item.reject(new Error("Hàng đợi TTS đã bị xóa"));
    this.updateDepth();
  }

  private async drain(): Promise<void> {
    if (this.#processing) return;
    this.#processing = true;
    this.updateDepth();
    try {
      while (this.#queue.length) {
        const item = this.#queue.shift();
        if (!item) break;
        try {
          const { buffer, mimeType } = await this.synthesize(item.text);
          this.options.onAudio({
            id: item.id,
            text: item.text,
            source: item.source,
            mimeType,
            dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
            volume: this.options.getConfig().ai.ttsVolume / 100
          });
          this.options.logger.info("tts.completed", { provider: this.options.getConfig().ai.ttsProvider, characters: item.text.length, source: item.source });
          item.resolve();
        } catch (error) {
          const normalized = error instanceof Error ? error : new Error(String(error));
          this.options.logger.error("tts.failed", normalized, { provider: this.options.getConfig().ai.ttsProvider, source: item.source });
          item.reject(normalized);
        } finally {
          this.updateDepth();
        }
      }
    } finally {
      this.#processing = false;
      this.updateDepth();
    }
  }

  private async synthesize(text: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const config = this.options.getConfig().ai;
    const cacheKey = createHash("sha256").update(JSON.stringify({ provider: config.ttsProvider, voice: config.ttsVoice, text })).digest("hex");
    const extension = config.ttsProvider === "openai" ? "mp3" : "webm";
    const mimeType = config.ttsProvider === "openai" ? "audio/mpeg" : "audio/webm";
    const cachedPath = path.join(this.options.cacheDirectory, `${cacheKey}.${extension}`);
    const cached = await fs.readFile(cachedPath).catch(() => undefined);
    if (cached) return { buffer: cached, mimeType };

    let buffer: Buffer;
    if (config.ttsProvider === "openai") {
      const apiKey = await this.options.getApiKey();
      if (!apiKey) throw new Error("Chưa lưu API key OpenAI cho TTS");
      const openAiEndpoint = config.provider === "openai" && config.endpoint
        ? config.endpoint.replace(/\/+$/, "")
        : "https://api.openai.com/v1";
      const response = await fetch(`${openAiEndpoint}/audio/speech`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: config.ttsVoice || "alloy", input: text, response_format: "mp3" }),
        signal: AbortSignal.timeout(30_000),
        redirect: "error"
      });
      if (!response.ok) throw new Error(`OpenAI TTS trả về HTTP ${response.status}`);
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      const edge = new MsEdgeTTS();
      await edge.setMetadata(config.ttsVoice || "vi-VN-HoaiMyNeural", OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS);
      const result = edge.toStream(escapeXml(text));
      buffer = await collectStream(result.audioStream);
    }
    if (!buffer.length) throw new Error("TTS không trả về dữ liệu âm thanh");
    await fs.mkdir(this.options.cacheDirectory, { recursive: true });
    await fs.writeFile(cachedPath, buffer, { mode: 0o600 });
    void this.pruneCache();
    return { buffer, mimeType };
  }

  private updateDepth(): void {
    this.options.onQueueDepth(this.depth);
  }

  private async pruneCache(): Promise<void> {
    const entries = await fs.readdir(this.options.cacheDirectory, { withFileTypes: true }).catch(() => []);
    const files = await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
      const filePath = path.join(this.options.cacheDirectory, entry.name);
      return { filePath, stat: await fs.stat(filePath) };
    }));
    files.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    for (const item of files.slice(100)) await fs.unlink(item.filePath).catch(() => undefined);
  }
}

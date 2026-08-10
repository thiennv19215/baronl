import type { AppConfig } from "./app-config";
import type { AiService } from "./ai-service";
import type { StructuredLogger } from "./logger";
import type { SpeechService } from "./speech-service";

interface AutoHypeOptions {
  getConfig: () => AppConfig;
  ai: AiService;
  speech: SpeechService;
  logger: StructuredLogger;
  onCaption: (text: string) => void;
}

export class AutoHypeEngine {
  #timer?: NodeJS.Timeout;
  #busy = false;
  #lastRun = 0;

  constructor(private readonly options: AutoHypeOptions) {}

  refresh(): void {
    this.stop();
    const config = this.options.getConfig().ai;
    if (!config.enabled || !config.autoHype) return;
    this.#timer = setInterval(() => void this.trigger("nhịp tự động"), config.hypeIntervalSeconds * 1_000);
    this.#timer.unref();
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = undefined;
  }

  async trigger(reason: string): Promise<void> {
    const config = this.options.getConfig().ai;
    if (!config.enabled || !config.autoHype || this.#busy || Date.now() - this.#lastRun < 15_000) return;
    this.#busy = true;
    this.#lastRun = Date.now();
    try {
      const { text } = await this.options.ai.generate(
        `Viết lời hype bằng tiếng Việt cho TikTok LIVE vì ${reason}. Tối đa hai câu, vui tươi, không gây áp lực tặng quà.`
      );
      this.options.onCaption(text);
      await this.options.speech.enqueue(text, "auto-hype");
    } catch (error) {
      this.options.logger.warn("auto_hype.skipped", { message: error instanceof Error ? error.message : String(error) });
    } finally {
      this.#busy = false;
    }
  }
}

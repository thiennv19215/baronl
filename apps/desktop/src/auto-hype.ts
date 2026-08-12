import type { AppConfig } from "@orbitstage/runtime";
import type { AiService } from "./ai-service";
import type { LiveEvent } from "@orbitstage/runtime";
import type { StructuredLogger } from "./logger";
import type { SpeechService } from "./speech-service";

interface AutoHypeOptions {
  getConfig: () => AppConfig;
  ai: AiService;
  speech: SpeechService;
  logger: StructuredLogger;
  onCaption: (text: string, source: "AI MC" | "AI DJ") => void;
}

type HostRole = "mc" | "dj";

export class AutoHypeEngine {
  #hypeTimer?: NodeJS.Timeout;
  #liveTimeTimer?: NodeJS.Timeout;
  #joinTimer?: NodeJS.Timeout;
  #busy = false;
  #lastRun = 0;
  #startedAt = Date.now();
  #joinNames = new Set<string>();
  #viewerReplyAt = new Map<string, number>();

  constructor(private readonly options: AutoHypeOptions) {}

  refresh(): void {
    this.stopTimers();
    const config = this.options.getConfig().ai;
    if (!config.enabled) return;
    if (config.autoHype) {
      this.#hypeTimer = setInterval(() => void this.trigger("nhịp tự động"), config.hypeIntervalSeconds * 1_000);
      this.#hypeTimer.unref();
    }
    if (config.liveTime) {
      this.#liveTimeTimer = setInterval(() => {
        const minutes = Math.max(1, Math.round((Date.now() - this.#startedAt) / 60_000));
        void this.speak("mc", `Hãy thông báo kênh đã LIVE ${minutes} phút, cảm ơn mọi người và mời tương tác tự nhiên. Tối đa hai câu.`, "live-time");
      }, config.liveTimeMinutes * 60_000);
      this.#liveTimeTimer.unref();
    }
  }

  stop(): void {
    this.stopTimers();
    if (this.#joinTimer) clearTimeout(this.#joinTimer);
    this.#joinTimer = undefined;
    this.#joinNames.clear();
  }

  handleEvent(event: LiveEvent): void {
    const config = this.options.getConfig().ai;
    if (!config.enabled || !event.viewer) return;
    const name = event.viewer.name.slice(0, 48);
    if (event.type === "join" && config.greetJoins && config.mcEnabled) {
      this.#joinNames.add(name);
      if (!this.#joinTimer) {
        this.#joinTimer = setTimeout(() => {
          this.#joinTimer = undefined;
          const names = [...this.#joinNames].slice(0, 8);
          this.#joinNames.clear();
          if (names.length) void this.speak("mc", `Chào nhóm người xem mới: ${names.join(", ")}. Chào ngắn gọn, ấm áp, không đọc như danh sách.`, "join-batch");
        }, config.joinBatchSeconds * 1_000);
        this.#joinTimer.unref();
      }
      return;
    }
    if (event.type === "gift" && event.gift && config.giftThanks && config.mcEnabled) {
      const value = event.gift.diamonds * event.gift.count;
      const tone = value >= 1_000 ? "bùng nổ và đặc biệt" : value >= 100 ? "nhiệt tình" : "ngắn gọn, thân thiện";
      void this.speak("mc", `Cảm ơn ${name} đã tặng ${event.gift.name} x${event.gift.count}, giá trị ${value} kim cương. Giọng ${tone}; không gây áp lực tặng thêm.`, "gift-thanks", value >= 1_000);
      return;
    }
    if (event.type === "follow" && config.praiseTease && config.mcEnabled) {
      void this.speak("mc", `${name} vừa theo dõi. Khen hoặc trêu vui an toàn trong đúng một câu.`, "follow-praise");
      return;
    }
    if (event.type === "chat" && event.message && config.commentReplies && config.mcEnabled) {
      const message = event.message.trim().slice(0, 220);
      const asksQuestion = /[?？]$/.test(message) || /^(ai|gì|sao|khi nào|ở đâu|bao nhiêu|hello|hey|chào)\b/i.test(message);
      const lastReply = this.#viewerReplyAt.get(event.viewer.id) ?? 0;
      if (asksQuestion && Date.now() - lastReply >= 30_000) {
        this.#viewerReplyAt.set(event.viewer.id, Date.now());
        void this.speak("mc", `${name} bình luận: “${message}”. Trả lời hữu ích, vui vẻ, tối đa hai câu; không bịa khi thiếu dữ kiện.`, "comment-reply");
      }
    }
  }

  async trigger(reason: string): Promise<void> {
    const config = this.options.getConfig().ai;
    const role: HostRole = config.djEnabled ? "dj" : "mc";
    await this.speak(role, `Hãy tạo lời hype vì ${reason}. Tối đa hai câu, vui tươi, có nhịp điệu và không gây áp lực tặng quà.`, "auto-hype");
  }

  private async speak(role: HostRole, prompt: string, source: string, urgent = false): Promise<void> {
    const config = this.options.getConfig().ai;
    if (!config.enabled || (role === "mc" && !config.mcEnabled) || (role === "dj" && !config.djEnabled)) return;
    const cooldown = urgent ? 3_000 : 10_000;
    if (this.#busy || Date.now() - this.#lastRun < cooldown) return;
    this.#busy = true;
    this.#lastRun = Date.now();
    try {
      const rolePrompt = role === "mc"
        ? "Bạn đang nói với vai MC Luna: gần gũi, tinh tế, nhớ tên người xem."
        : "Bạn đang nói với vai DJ Ryan: giàu năng lượng, câu ngắn, hợp nhịp nhạc.";
      const { text } = await this.options.ai.generate(`${rolePrompt}\n${prompt}`);
      const captionSource = role === "mc" ? "AI MC" : "AI DJ";
      this.options.onCaption(text, captionSource);
      await this.options.speech.enqueue(text, role);
    } catch (error) {
      this.options.logger.warn("interactive_ai.skipped", { role, source, message: error instanceof Error ? error.message : String(error) });
    } finally {
      this.#busy = false;
    }
  }

  private stopTimers(): void {
    if (this.#hypeTimer) clearInterval(this.#hypeTimer);
    if (this.#liveTimeTimer) clearInterval(this.#liveTimeTimer);
    this.#hypeTimer = undefined;
    this.#liveTimeTimer = undefined;
  }
}

import type { AppConfig } from "./app-config";
import type { StructuredLogger } from "./logger";

interface AiServiceOptions {
  getConfig: () => AppConfig;
  getApiKey: () => Promise<string | undefined>;
  logger: StructuredLogger;
}

const UNSAFE_PATTERNS = [
  /\b(tự sát|tu sat|giết người|giet nguoi)\b/i,
  /\b(nude|khiêu dâm|khieu dam|ấu dâm|au dam)\b/i,
  /\b(mua bán ma túy|mua ban ma tuy|chế tạo bom|che tao bom)\b/i,
  /\b(doxx|địa chỉ nhà riêng|dia chi nha rieng)\b/i
];

function ensureSafe(text: string, enabled: boolean): string {
  const normalized = text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) throw new Error("Nội dung trống");
  if (enabled && UNSAFE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new Error("Nội dung bị chặn bởi bộ lọc an toàn");
  }
  return normalized;
}

function endpoint(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

const PROVIDER_ENDPOINTS: Record<AppConfig["ai"]["provider"], string> = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  deepseek: "https://api.deepseek.com/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  glm: "https://open.bigmodel.cn/api/paas/v4",
  grok: "https://api.x.ai/v1",
  compatible: ""
};

function extractResponseText(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  if (Array.isArray(record.output)) {
    const fragments: string[] = [];
    for (const item of record.output) {
      if (!item || typeof item !== "object") continue;
      const content = (item as Record<string, unknown>).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (part && typeof part === "object") {
          const text = (part as Record<string, unknown>).text;
          if (typeof text === "string") fragments.push(text);
        }
      }
    }
    if (fragments.length) return fragments.join("\n");
  }
  if (Array.isArray(record.choices)) {
    const first = record.choices[0];
    if (first && typeof first === "object") {
      const message = (first as Record<string, unknown>).message;
      if (message && typeof message === "object") {
        const content = (message as Record<string, unknown>).content;
        if (typeof content === "string") return content;
      }
    }
  }
  return undefined;
}

export class AiService {
  #requests: number[] = [];

  constructor(private readonly options: AiServiceOptions) {}

  async generate(prompt: string): Promise<{ text: string; latencyMs: number }> {
    const config = this.options.getConfig().ai;
    if (!config.enabled) throw new Error("AI đang tắt. Hãy bật AI trong màn AI MC/DJ.");
    const cleanPrompt = ensureSafe(prompt.slice(0, 4_000), config.contentFilter);
    this.enforceRateLimit(config.rateLimitPerMinute);
    const apiKey = await this.options.getApiKey();
    if (!apiKey) throw new Error("Chưa lưu API key AI trong kho secret an toàn.");

    const useResponses = config.provider === "openai";
    const baseEndpoint = config.endpoint || PROVIDER_ENDPOINTS[config.provider];
    if (!baseEndpoint) throw new Error("Provider tương thích cần endpoint HTTPS được cấu hình rõ ràng.");
    const requestUrl = endpoint(baseEndpoint, useResponses ? "responses" : "chat/completions");
    const body = useResponses ? {
      model: config.model,
      store: false,
      max_output_tokens: 300,
      input: [
        { role: "developer", content: config.persona },
        { role: "user", content: cleanPrompt }
      ]
    } : {
      model: config.model,
      max_tokens: 300,
      temperature: 0.8,
      messages: [
        { role: "system", content: config.persona },
        { role: "user", content: cleanPrompt }
      ]
    };

    const startedAt = Date.now();
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(requestUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
          redirect: "error"
        });
        if (!response.ok) {
          const requestId = response.headers.get("x-request-id") ?? undefined;
          const retryable = response.status === 429 || response.status >= 500;
          const error = new Error(`AI provider trả về HTTP ${response.status}${requestId ? ` (request ${requestId})` : ""}`);
          if (!retryable || attempt === 1) throw error;
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        const value = await response.json() as unknown;
        const rawText = extractResponseText(value);
        if (!rawText) throw new Error("AI provider không trả về nội dung văn bản hợp lệ.");
        const text = ensureSafe(rawText.slice(0, 2_000), config.contentFilter);
        const latencyMs = Date.now() - startedAt;
        this.options.logger.info("ai.completed", { provider: config.provider, model: config.model, latencyMs });
        return { text, latencyMs };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === 0 && /fetch|timeout|HTTP 429|HTTP 5\d\d/i.test(lastError.message)) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }
        break;
      }
    }
    this.options.logger.error("ai.failed", lastError ?? new Error("Unknown AI failure"), {
      provider: config.provider,
      model: config.model
    });
    throw lastError ?? new Error("AI request failed");
  }

  safeText(text: string): string {
    return ensureSafe(text, this.options.getConfig().ai.contentFilter);
  }

  private enforceRateLimit(limit: number): void {
    const now = Date.now();
    this.#requests = this.#requests.filter((timestamp) => now - timestamp < 60_000);
    if (this.#requests.length >= limit) throw new Error("AI đang giới hạn tần suất. Vui lòng thử lại sau.");
    this.#requests.push(now);
  }
}

import { promises as fs } from "node:fs";
import path from "node:path";

const SECRET_KEY = /(api[-_]?key|authorization|token|secret|password|license[-_]?key)/i;
const BEARER = /Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const COMMON_KEY = /\b(sk-[A-Za-z0-9_-]{12,}|gsk_[A-Za-z0-9_-]{12,})\b/g;
const AWS_ACCESS_KEY = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g;
const GITHUB_TOKEN = /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g;
const PRIVATE_KEY = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g;
const DIAGNOSTIC_CANARY = /\bORBITSTAGE_CANARY_SECRET_[A-Za-z0-9_-]+\b/g;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[TRUNCATED]";
  if (typeof value === "string") {
    return value
      .replace(PRIVATE_KEY, "[REDACTED_PRIVATE_KEY]")
      .replace(BEARER, "Bearer [REDACTED]")
      .replace(COMMON_KEY, "[REDACTED_KEY]")
      .replace(AWS_ACCESS_KEY, "[REDACTED_AWS_KEY]")
      .replace(GITHUB_TOKEN, "[REDACTED_GITHUB_TOKEN]")
      .replace(DIAGNOSTIC_CANARY, "[REDACTED]");
  }
  if (Array.isArray(value)) return value.map((entry) => redact(entry, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key,
      SECRET_KEY.test(key) ? "[REDACTED]" : redact(entry, depth + 1)
    ]));
  }
  return value;
}

export class StructuredLogger {
  readonly logPath: string;

  constructor(dataDirectory: string) {
    this.logPath = path.join(dataDirectory, "logs", "orbitstage.jsonl");
  }

  info(event: string, data: unknown = {}): void {
    void this.write("info", event, data);
  }

  warn(event: string, data: unknown = {}): void {
    void this.write("warn", event, data);
  }

  error(event: string, error: unknown, data: unknown = {}): void {
    void this.write("error", event, {
      ...((data && typeof data === "object") ? data : { data }),
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
    });
  }

  async tail(maxBytes = 256_000): Promise<string> {
    try {
      const handle = await fs.open(this.logPath, "r");
      try {
        const stat = await handle.stat();
        const length = Math.min(stat.size, maxBytes);
        const buffer = Buffer.alloc(length);
        await handle.read(buffer, 0, length, Math.max(0, stat.size - length));
        return buffer.toString("utf8");
      } finally {
        await handle.close();
      }
    } catch {
      return "";
    }
  }

  private async write(level: "info" | "warn" | "error", event: string, data: unknown): Promise<void> {
    const line = JSON.stringify(redact({ timestamp: new Date().toISOString(), level, event, data }));
    try {
      await fs.mkdir(path.dirname(this.logPath), { recursive: true });
      await fs.appendFile(this.logPath, `${line}\n`, "utf8");
    } catch {
      // Logging must never crash the live show.
    }
  }
}

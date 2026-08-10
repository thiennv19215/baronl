import type { Logger } from './types.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export type LogSink = (record: LogRecord) => void | Promise<void>;

const SECRET_KEY = /(?:api[-_]?key|authorization|password|passwd|secret|token|license[-_]?key|private[-_]?key|cookie)/i;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const COMMON_SECRET = /\b(?:sk|key|tok|lic)[-_][A-Za-z0-9_-]{8,}\b/gi;
const QUERY_SECRET = /([?&](?:api[-_]?key|token|secret|key)=)[^&#\s]+/gi;

const redactString = (value: string): string =>
  value.replace(BEARER, 'Bearer [REDACTED]').replace(COMMON_SECRET, '[REDACTED]').replace(QUERY_SECRET, '$1[REDACTED]');

export function redact<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (typeof value === 'string') return redactString(value) as T;
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]' as T;
  seen.add(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    } as T;
  }
  if (Array.isArray(value)) return value.map((entry) => redact(entry, seen)) as T;

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = SECRET_KEY.test(key) ? '[REDACTED]' : redact(entry, seen);
  }
  return output as T;
}

const LEVEL_VALUE: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export class StructuredLogger implements Logger {
  public constructor(
    private readonly sink: LogSink,
    private readonly minimumLevel: LogLevel = 'info',
    private readonly baseContext: Record<string, unknown> = {},
  ) {}

  public child(context: Record<string, unknown>): StructuredLogger {
    return new StructuredLogger(this.sink, this.minimumLevel, { ...this.baseContext, ...context });
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context);
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVEL_VALUE[level] < LEVEL_VALUE[this.minimumLevel]) return;
    const merged = context ? { ...this.baseContext, ...context } : this.baseContext;
    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      message: redact(message),
      ...(Object.keys(merged).length > 0 ? { context: redact(merged) } : {}),
    };
    try {
      const result = this.sink(record);
      if (result && typeof result.catch === 'function') void result.catch(() => undefined);
    } catch {
      // Logging must never crash a LIVE session.
    }
  }
}

export class MemoryLogSink {
  private readonly records: LogRecord[] = [];

  public constructor(private readonly capacity = 1_000) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be a positive integer');
  }

  public write = (record: LogRecord): void => {
    this.records.push(record);
    if (this.records.length > this.capacity) this.records.splice(0, this.records.length - this.capacity);
  };

  public snapshot(): readonly LogRecord[] {
    return structuredClone(this.records);
  }
}

export const jsonLineSink = (writer: (line: string) => void): LogSink => (record) => writer(`${JSON.stringify(record)}\n`);

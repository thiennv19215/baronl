export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export const NOOP_LOGGER: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export interface Clock {
  now(): number;
}

export const SYSTEM_CLOCK: Clock = { now: () => Date.now() };

export type CancelTimer = () => void;
export type TimerScheduler = (callback: () => void, delayMs: number) => CancelTimer;

export const SYSTEM_SCHEDULER: TimerScheduler = (callback, delayMs) => {
  const handle = setTimeout(callback, delayMs);
  handle.unref?.();
  return () => clearTimeout(handle);
};

export interface SecretResolver {
  /** Resolves an opaque safeStorage/keychain identifier in the trusted main/service process. */
  resolve(secretId: string): Promise<string | undefined>;
}

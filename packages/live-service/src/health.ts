import { NOOP_LOGGER, SYSTEM_SCHEDULER, type Logger, type TimerScheduler } from './types.js';

export type HealthLevel = 'ok' | 'warn' | 'error';

export interface HealthProbeResult {
  status: HealthLevel;
  message?: string;
  details?: Record<string, unknown>;
}

export type HealthProbe = () => Promise<HealthProbeResult | boolean> | HealthProbeResult | boolean;

export interface HealthCheck extends HealthProbeResult {
  name: string;
  critical: boolean;
  checkedAt: string;
  durationMs: number;
}

export interface HealthSnapshot {
  status: HealthLevel;
  checkedAt: string;
  checks: Readonly<Record<string, HealthCheck>>;
}

interface RegisteredProbe {
  probe: HealthProbe;
  critical: boolean;
  timeoutMs: number;
}

export class HealthRegistry {
  private readonly probes = new Map<string, RegisteredProbe>();

  public register(name: string, probe: HealthProbe, options: { critical?: boolean; timeoutMs?: number } = {}): () => void {
    if (!/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(name)) throw new TypeError('Invalid health probe name');
    if (this.probes.has(name)) throw new TypeError(`Health probe already registered: ${name}`);
    const timeoutMs = options.timeoutMs ?? 3_000;
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1) throw new RangeError('Health probe timeout must be positive');
    this.probes.set(name, { probe, critical: options.critical ?? false, timeoutMs });
    return () => this.probes.delete(name);
  }

  public async check(name: string): Promise<HealthCheck> {
    const registration = this.probes.get(name);
    if (!registration) throw new TypeError(`Unknown health probe: ${name}`);
    const startedAt = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        Promise.resolve().then(registration.probe),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error(`Health probe timed out after ${registration.timeoutMs}ms`)), registration.timeoutMs);
          timer.unref?.();
        }),
      ]);
      const normalized: HealthProbeResult = typeof result === 'boolean' ? { status: result ? 'ok' : 'error' } : result;
      return {
        name,
        critical: registration.critical,
        checkedAt: new Date().toISOString(),
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        ...normalized,
      };
    } catch (error) {
      return {
        name,
        critical: registration.critical,
        status: 'error',
        checkedAt: new Date().toISOString(),
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        message: error instanceof Error ? error.message : 'Health probe failed',
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  public async checkAll(): Promise<HealthSnapshot> {
    const checks = await Promise.all([...this.probes.keys()].map((name) => this.check(name)));
    const record = Object.fromEntries(checks.map((check) => [check.name, check]));
    const criticalError = checks.some((check) => check.critical && check.status === 'error');
    const anyProblem = checks.some((check) => check.status !== 'ok');
    return {
      status: criticalError ? 'error' : anyProblem ? 'warn' : 'ok',
      checkedAt: new Date().toISOString(),
      checks: record,
    };
  }
}

export interface HealthMonitorOptions {
  registry: HealthRegistry;
  intervalMs?: number;
  scheduler?: TimerScheduler;
  logger?: Logger;
}

export class HealthMonitor {
  private readonly listeners = new Set<(snapshot: HealthSnapshot) => void>();
  private readonly intervalMs: number;
  private readonly scheduler: TimerScheduler;
  private readonly logger: Logger;
  private cancelTimer?: () => void;
  private running = false;
  private latestValue?: HealthSnapshot;

  public constructor(private readonly options: HealthMonitorOptions) {
    this.intervalMs = options.intervalMs ?? 15_000;
    this.scheduler = options.scheduler ?? SYSTEM_SCHEDULER;
    this.logger = options.logger ?? NOOP_LOGGER;
  }

  public get latest(): HealthSnapshot | undefined {
    return this.latestValue ? structuredClone(this.latestValue) : undefined;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    void this.tick();
  }

  public stop(): void {
    this.running = false;
    this.cancelTimer?.();
    this.cancelTimer = undefined;
  }

  public subscribe(listener: (snapshot: HealthSnapshot) => void, emitCurrent = true): () => void {
    this.listeners.add(listener);
    const current = this.latest;
    if (emitCurrent && current) listener(current);
    return () => this.listeners.delete(listener);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    try {
      this.latestValue = await this.options.registry.checkAll();
      const snapshot = this.latest;
      if (snapshot) {
        for (const listener of this.listeners) {
          try {
            listener(snapshot);
          } catch (error) {
            this.logger.error('Health monitor listener failed', { error });
          }
        }
      }
    } catch (error) {
      this.logger.error('Health monitor cycle failed', { error });
    }
    if (this.running) {
      this.cancelTimer = this.scheduler(() => {
        this.cancelTimer = undefined;
        void this.tick();
      }, this.intervalMs);
    }
  }
}

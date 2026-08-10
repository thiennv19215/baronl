import type { StructuredLogger } from "./logger";

export interface SupervisedService {
  name: string;
  healthy: () => boolean | Promise<boolean>;
  restart: () => void | Promise<void>;
}

interface ServiceState {
  failures: number;
  restarts: number;
  restarting: boolean;
  lastError?: string;
}

export class ServiceSupervisor {
  #timer?: NodeJS.Timeout;
  #services = new Map<string, SupervisedService>();
  #states = new Map<string, ServiceState>();

  constructor(
    private readonly logger: StructuredLogger,
    private readonly intervalMs = 10_000,
    private readonly failureThreshold = 3
  ) {}

  register(service: SupervisedService): () => void {
    if (this.#services.has(service.name)) throw new Error(`Service already registered: ${service.name}`);
    this.#services.set(service.name, service);
    this.#states.set(service.name, { failures: 0, restarts: 0, restarting: false });
    return () => {
      this.#services.delete(service.name);
      this.#states.delete(service.name);
    };
  }

  start(): void {
    if (this.#timer) return;
    this.#timer = setInterval(() => void this.checkNow(), this.intervalMs);
    this.#timer.unref();
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = undefined;
  }

  snapshot(): Record<string, ServiceState> {
    return Object.fromEntries([...this.#states].map(([name, state]) => [name, { ...state }]));
  }

  async checkNow(): Promise<void> {
    await Promise.all([...this.#services.values()].map((service) => this.checkService(service)));
  }

  private async checkService(service: SupervisedService): Promise<void> {
    const state = this.#states.get(service.name);
    if (!state || state.restarting) return;
    let healthy = false;
    try {
      healthy = await service.healthy();
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error);
    }
    if (healthy) {
      state.failures = 0;
      state.lastError = undefined;
      return;
    }
    state.failures += 1;
    if (state.failures < this.failureThreshold) return;
    state.restarting = true;
    try {
      await service.restart();
      state.restarts += 1;
      state.failures = 0;
      state.lastError = undefined;
      this.logger.warn("service.restarted", { service: service.name, restarts: state.restarts });
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error("service.restart_failed", error, { service: service.name });
    } finally {
      state.restarting = false;
    }
  }
}

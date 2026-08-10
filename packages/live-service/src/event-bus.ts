import { LiveEventSchema, type LiveEvent, type LiveEventType } from '@orbitstage/shared';
import { NOOP_LOGGER, type Logger } from './types.js';

export type EventListener<TEvent extends LiveEvent = LiveEvent> = (event: TEvent) => void | Promise<void>;

interface PendingEvent {
  event: LiveEvent;
  resolve: (accepted: boolean) => void;
}

export interface EventBusOptions {
  maxQueueDepth?: number;
  logger?: Logger;
}

const PRIORITY_VALUE = { critical: 4, high: 3, normal: 2, low: 1 } as const;

export class LiveEventBus {
  private readonly listeners = new Set<EventListener>();
  private readonly typeListeners = new Map<LiveEventType, Set<EventListener>>();
  private readonly queue: PendingEvent[] = [];
  private readonly idleWaiters = new Set<() => void>();
  private readonly maxQueueDepth: number;
  private readonly logger: Logger;
  private draining = false;
  private closed = false;
  private published = 0;
  private dropped = 0;

  public constructor(options: EventBusOptions = {}) {
    this.maxQueueDepth = options.maxQueueDepth ?? 2_000;
    if (!Number.isInteger(this.maxQueueDepth) || this.maxQueueDepth < 1) {
      throw new RangeError('maxQueueDepth must be a positive integer');
    }
    this.logger = options.logger ?? NOOP_LOGGER;
  }

  public subscribe(listener: EventListener): () => void;
  public subscribe<TType extends LiveEventType>(
    type: TType,
    listener: EventListener<Extract<LiveEvent, { type: TType }>>,
  ): () => void;
  public subscribe(
    typeOrListener: LiveEventType | EventListener,
    maybeListener?: EventListener,
  ): () => void {
    if (typeof typeOrListener === 'function') {
      this.listeners.add(typeOrListener);
      return () => this.listeners.delete(typeOrListener);
    }
    if (!maybeListener) throw new TypeError('listener is required');
    const listeners = this.typeListeners.get(typeOrListener) ?? new Set<EventListener>();
    listeners.add(maybeListener);
    this.typeListeners.set(typeOrListener, listeners);
    return () => listeners.delete(maybeListener);
  }

  /** Resolves true after all subscribers received the event, or false when backpressure dropped it. */
  public publish(untrustedEvent: LiveEvent): Promise<boolean> {
    if (this.closed) return Promise.resolve(false);
    const event = LiveEventSchema.parse(untrustedEvent);

    if (this.queue.length >= this.maxQueueDepth && !this.makeRoom(event)) {
      this.dropped += 1;
      this.logger.warn('Live event dropped due to event-bus backpressure', { type: event.type, eventId: event.id });
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.queue.push({ event, resolve });
      this.queue.sort((a, b) => PRIORITY_VALUE[b.event.priority] - PRIORITY_VALUE[a.event.priority]);
      void this.drain();
    });
  }

  public stats(): { queued: number; published: number; dropped: number } {
    return { queued: this.queue.length, published: this.published, dropped: this.dropped };
  }

  public async waitForIdle(): Promise<void> {
    if (!this.draining && this.queue.length === 0) return;
    await new Promise<void>((resolve) => this.idleWaiters.add(resolve));
  }

  public close(): void {
    this.closed = true;
    for (const item of this.queue.splice(0)) item.resolve(false);
    this.listeners.clear();
    this.typeListeners.clear();
    this.resolveIdle();
  }

  private makeRoom(incoming: LiveEvent): boolean {
    const incomingPriority = PRIORITY_VALUE[incoming.priority];
    let candidate = -1;
    let candidatePriority = incomingPriority;
    for (let index = this.queue.length - 1; index >= 0; index -= 1) {
      const queuedPriority = PRIORITY_VALUE[this.queue[index]?.event.priority ?? 'critical'];
      if (queuedPriority < candidatePriority) {
        candidate = index;
        candidatePriority = queuedPriority;
      }
    }
    if (candidate < 0) return false;
    const [removed] = this.queue.splice(candidate, 1);
    removed?.resolve(false);
    this.dropped += 1;
    return true;
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length > 0 && !this.closed) {
        const pending = this.queue.shift();
        if (!pending) break;
        const listeners = [
          ...this.listeners,
          ...(this.typeListeners.get(pending.event.type) ?? []),
        ];
        const outcomes = await Promise.allSettled(
          listeners.map((listener) => Promise.resolve().then(() => listener(pending.event))),
        );
        for (const outcome of outcomes) {
          if (outcome.status === 'rejected') {
            this.logger.error('Live event subscriber failed', {
              eventId: pending.event.id,
              type: pending.event.type,
              error: outcome.reason,
            });
          }
        }
        this.published += 1;
        pending.resolve(true);
      }
    } finally {
      this.draining = false;
      this.resolveIdle();
    }
  }

  private resolveIdle(): void {
    if (this.draining || this.queue.length > 0) return;
    for (const resolve of this.idleWaiters) resolve();
    this.idleWaiters.clear();
  }
}

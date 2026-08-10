import type { SpamPolicySchema } from '@orbitstage/shared';
import { LiveEventSchema, isViewerEvent, type LiveEvent } from '@orbitstage/shared';
import type { z } from 'zod';
import { LiveEventBus } from './event-bus.js';
import { SlidingWindowRateLimiter } from './rate-limiter.js';
import { NOOP_LOGGER, SYSTEM_CLOCK, type Clock, type Logger } from './types.js';

export type SpamPolicy = z.infer<typeof SpamPolicySchema>;

export type RouteDecision =
  | { accepted: true; event: LiveEvent }
  | { accepted: false; event?: LiveEvent; reason: 'invalid' | 'duplicate' | 'rate-limited' | 'backpressure'; error?: string };

export interface EventRouterOptions {
  bus: LiveEventBus;
  spam: SpamPolicy;
  clock?: Clock;
  logger?: Logger;
}

export class EventRouter {
  private readonly viewerLimiter: SlidingWindowRateLimiter;
  private readonly chatLimiter: SlidingWindowRateLimiter;
  private readonly seenIds = new Map<string, number>();
  private readonly seenChats = new Map<string, number>();
  private readonly clock: Clock;
  private readonly logger: Logger;

  public constructor(private readonly options: EventRouterOptions) {
    this.clock = options.clock ?? SYSTEM_CLOCK;
    this.logger = options.logger ?? NOOP_LOGGER;
    this.viewerLimiter = new SlidingWindowRateLimiter(
      options.spam.maxEventsPerViewer,
      options.spam.windowMs,
      this.clock,
    );
    this.chatLimiter = new SlidingWindowRateLimiter(
      options.spam.maxChatPerViewer,
      options.spam.windowMs,
      this.clock,
    );
  }

  public async route(input: unknown): Promise<RouteDecision> {
    const parsed = LiveEventSchema.safeParse(input);
    if (!parsed.success) {
      this.logger.warn('Rejected malformed live event', { issues: parsed.error.issues });
      return { accepted: false, reason: 'invalid', error: parsed.error.message };
    }
    const event = parsed.data;
    this.pruneDeduplicationCaches();
    if (this.seenIds.has(event.id)) return { accepted: false, event, reason: 'duplicate' };
    this.seenIds.set(event.id, this.clock.now());

    if (isViewerEvent(event)) {
      const viewerId = event.payload.viewer.id;
      // Follow/gift events are high-value state transitions and must not be lost to chat/like spam limits.
      if (event.type !== 'gift' && event.type !== 'follow' && !this.viewerLimiter.check(viewerId).allowed) {
        return { accepted: false, event, reason: 'rate-limited' };
      }
      if (event.type === 'chat') {
        if (!this.chatLimiter.check(viewerId).allowed) return { accepted: false, event, reason: 'rate-limited' };
        const fingerprint = `${viewerId}\u0000${event.payload.message.toLocaleLowerCase()}`;
        if (this.seenChats.has(fingerprint)) return { accepted: false, event, reason: 'duplicate' };
        this.seenChats.set(fingerprint, this.clock.now());
      }
    }

    const published = await this.options.bus.publish(event);
    return published ? { accepted: true, event } : { accepted: false, event, reason: 'backpressure' };
  }

  private pruneDeduplicationCaches(): void {
    const now = this.clock.now();
    const eventCutoff = now - Math.max(this.options.spam.windowMs, this.options.spam.duplicateWindowMs);
    const chatCutoff = now - this.options.spam.duplicateWindowMs;
    for (const [id, timestamp] of this.seenIds) if (timestamp <= eventCutoff) this.seenIds.delete(id);
    for (const [fingerprint, timestamp] of this.seenChats) if (timestamp <= chatCutoff) this.seenChats.delete(fingerprint);
  }
}

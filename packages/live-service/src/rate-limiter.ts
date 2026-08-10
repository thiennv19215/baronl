import { SYSTEM_CLOCK, type Clock } from './types.js';

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  public constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly clock: Clock = SYSTEM_CLOCK,
  ) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer');
    if (!Number.isFinite(windowMs) || windowMs < 1) throw new RangeError('windowMs must be positive');
  }

  public check(key: string, cost = 1): RateLimitDecision {
    if (!Number.isInteger(cost) || cost < 1) throw new RangeError('cost must be a positive integer');
    const now = this.clock.now();
    const cutoff = now - this.windowMs;
    const previous = (this.hits.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
    const allowed = previous.length + cost <= this.limit;
    if (allowed) {
      for (let index = 0; index < cost; index += 1) previous.push(now);
      this.hits.set(key, previous);
    } else if (previous.length > 0) {
      this.hits.set(key, previous);
    }
    return {
      allowed,
      remaining: Math.max(0, this.limit - previous.length),
      retryAfterMs: allowed || previous.length === 0 ? 0 : Math.max(1, (previous[0] ?? now) + this.windowMs - now),
    };
  }

  public reset(key?: string): void {
    if (key === undefined) this.hits.clear();
    else this.hits.delete(key);
  }

  public prune(): void {
    const cutoff = this.clock.now() - this.windowMs;
    for (const [key, timestamps] of this.hits) {
      const current = timestamps.filter((timestamp) => timestamp > cutoff);
      if (current.length === 0) this.hits.delete(key);
      else this.hits.set(key, current);
    }
  }
}

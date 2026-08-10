import type { LiveEvent, Viewer } from '@orbitstage/shared';
import { SYSTEM_CLOCK, type Clock } from './types.js';

export interface ViewerLevel {
  level: number;
  minimumPoints: number;
  title: string;
}

export const DEFAULT_VIEWER_LEVELS: readonly ViewerLevel[] = [
  { level: 1, minimumPoints: 0, title: 'Tân binh' },
  { level: 2, minimumPoints: 50, title: 'Bạn sân khấu' },
  { level: 3, minimumPoints: 150, title: 'Fan năng động' },
  { level: 4, minimumPoints: 400, title: 'Ngôi sao' },
  { level: 5, minimumPoints: 1_000, title: 'VIP' },
  { level: 6, minimumPoints: 2_500, title: 'Huyền thoại' },
];

export interface ViewerScoring {
  pointsPerJoin: number;
  pointsPerFollow: number;
  pointsPerLike: number;
  pointsPerDiamond: number;
}

export interface ViewerStats {
  viewer: Viewer;
  points: number;
  level: ViewerLevel;
  joins: number;
  chats: number;
  follows: number;
  likes: number;
  gifts: number;
  diamonds: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface MutableViewerStats extends Omit<ViewerStats, 'level'> {
  followed: boolean;
}

export type LeaderboardMetric = 'points' | 'diamonds' | 'gifts' | 'likes';
export interface LeaderboardEntry extends ViewerStats {
  rank: number;
}

export interface ViewerStoreOptions {
  scoring?: Partial<ViewerScoring>;
  levels?: readonly ViewerLevel[];
  clock?: Clock;
  comboRetentionMs?: number;
  maxViewers?: number;
  maxTrackedCombos?: number;
}

const DEFAULT_SCORING: ViewerScoring = {
  pointsPerJoin: 1,
  pointsPerFollow: 25,
  pointsPerLike: 0.1,
  pointsPerDiamond: 1,
};

export function validateViewerLevels(levels: readonly ViewerLevel[]): readonly ViewerLevel[] {
  if (levels.length === 0) throw new TypeError('At least one viewer level is required');
  const sorted = [...levels].sort((a, b) => a.minimumPoints - b.minimumPoints);
  if (sorted[0]?.minimumPoints !== 0) throw new TypeError('The first viewer level must start at zero points');
  for (let index = 0; index < sorted.length; index += 1) {
    const level = sorted[index];
    const previous = sorted[index - 1];
    if (!level || !Number.isInteger(level.level) || level.level < 1 || level.minimumPoints < 0 || !level.title.trim()) {
      throw new TypeError('Viewer levels contain an invalid entry');
    }
    if (previous && (level.minimumPoints <= previous.minimumPoints || level.level <= previous.level)) {
      throw new TypeError('Viewer levels must have strictly increasing level and points');
    }
  }
  return Object.freeze(sorted.map((level) => Object.freeze({ ...level })));
}

export function levelForPoints(points: number, levels: readonly ViewerLevel[] = DEFAULT_VIEWER_LEVELS): ViewerLevel {
  let selected = levels[0];
  for (const candidate of levels) {
    if (candidate.minimumPoints <= points) selected = candidate;
    else break;
  }
  if (!selected) throw new TypeError('At least one viewer level is required');
  return { ...selected };
}

export class ViewerStore {
  private readonly viewers = new Map<string, MutableViewerStats>();
  private readonly combos = new Map<string, { repeatCount: number; updatedAt: number; complete: boolean }>();
  private readonly scoring: ViewerScoring;
  private readonly levels: readonly ViewerLevel[];
  private readonly clock: Clock;
  private readonly comboRetentionMs: number;
  private readonly maxViewers: number;
  private readonly maxTrackedCombos: number;

  public constructor(options: ViewerStoreOptions = {}) {
    this.scoring = { ...DEFAULT_SCORING, ...options.scoring };
    for (const [key, value] of Object.entries(this.scoring)) {
      if (!Number.isFinite(value) || value < 0) throw new RangeError(`${key} must be a non-negative finite number`);
    }
    this.levels = validateViewerLevels(options.levels ?? DEFAULT_VIEWER_LEVELS);
    this.clock = options.clock ?? SYSTEM_CLOCK;
    this.comboRetentionMs = options.comboRetentionMs ?? 10 * 60_000;
    this.maxViewers = options.maxViewers ?? 10_000;
    this.maxTrackedCombos = options.maxTrackedCombos ?? 20_000;
    if (!Number.isInteger(this.maxViewers) || this.maxViewers < 1) throw new RangeError('maxViewers must be positive');
    if (!Number.isInteger(this.maxTrackedCombos) || this.maxTrackedCombos < 1) throw new RangeError('maxTrackedCombos must be positive');
  }

  public apply(event: LiveEvent): ViewerStats | undefined {
    if (!('viewer' in event.payload)) return undefined;
    const stats = this.getOrCreate(event.payload.viewer);
    stats.viewer = mergeViewer(stats.viewer, event.payload.viewer);
    stats.lastSeenAt = new Date(this.clock.now()).toISOString();

    switch (event.type) {
      case 'join':
        stats.joins += 1;
        stats.points += this.scoring.pointsPerJoin;
        break;
      case 'chat':
        stats.chats += 1;
        break;
      case 'follow':
        if (!stats.followed) {
          stats.followed = true;
          stats.follows += 1;
          stats.points += this.scoring.pointsPerFollow;
        }
        break;
      case 'like':
        stats.likes += event.payload.count;
        stats.points += event.payload.count * this.scoring.pointsPerLike;
        break;
      case 'gift': {
        const units = this.newGiftUnits(event);
        stats.gifts += units;
        const diamonds = units * event.payload.diamondValue;
        stats.diamonds += diamonds;
        stats.points += diamonds * this.scoring.pointsPerDiamond;
        break;
      }
    }
    return this.freezeStats(stats);
  }

  public get(viewerId: string): ViewerStats | undefined {
    const stats = this.viewers.get(viewerId);
    return stats ? this.freezeStats(stats) : undefined;
  }

  public snapshot(): readonly ViewerStats[] {
    return [...this.viewers.values()].map((stats) => this.freezeStats(stats));
  }

  public leaderboard(metric: LeaderboardMetric = 'points', limit = 10): readonly LeaderboardEntry[] {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer');
    return [...this.viewers.values()]
      .sort((a, b) => b[metric] - a[metric] || b.points - a.points || a.firstSeenAt.localeCompare(b.firstSeenAt))
      .slice(0, limit)
      .map((stats, index) => ({ ...this.freezeStats(stats), rank: index + 1 }));
  }

  public clear(): void {
    this.viewers.clear();
    this.combos.clear();
  }

  private getOrCreate(viewer: Viewer): MutableViewerStats {
    const existing = this.viewers.get(viewer.id);
    if (existing) return existing;
    if (this.viewers.size >= this.maxViewers) {
      let oldest: MutableViewerStats | undefined;
      for (const candidate of this.viewers.values()) {
        if (!oldest || candidate.lastSeenAt < oldest.lastSeenAt) oldest = candidate;
      }
      if (oldest) this.viewers.delete(oldest.viewer.id);
    }
    const now = new Date(this.clock.now()).toISOString();
    const created: MutableViewerStats = {
      viewer: { ...viewer },
      points: 0,
      joins: 0,
      chats: 0,
      follows: 0,
      likes: 0,
      gifts: 0,
      diamonds: 0,
      followed: false,
      firstSeenAt: now,
      lastSeenAt: now,
    };
    this.viewers.set(viewer.id, created);
    return created;
  }

  private newGiftUnits(event: Extract<LiveEvent, { type: 'gift' }>): number {
    this.pruneCombos();
    if (!event.payload.comboId) return event.payload.repeatCount;
    const key = `${event.payload.viewer.id}:${event.payload.giftId}:${event.payload.comboId}`;
    const previous = this.combos.get(key);
    const units = Math.max(0, event.payload.repeatCount - (previous?.repeatCount ?? 0));
    this.combos.set(key, {
      repeatCount: Math.max(event.payload.repeatCount, previous?.repeatCount ?? 0),
      updatedAt: this.clock.now(),
      complete: Boolean(event.payload.repeatEnd || previous?.complete),
    });
    if (this.combos.size > this.maxTrackedCombos) {
      let oldestKey: string | undefined;
      let oldestTimestamp = Number.POSITIVE_INFINITY;
      for (const [candidateKey, combo] of this.combos) {
        if (combo.updatedAt < oldestTimestamp) {
          oldestKey = candidateKey;
          oldestTimestamp = combo.updatedAt;
        }
      }
      if (oldestKey) this.combos.delete(oldestKey);
    }
    return units;
  }

  private pruneCombos(): void {
    const cutoff = this.clock.now() - this.comboRetentionMs;
    for (const [key, combo] of this.combos) if (combo.updatedAt <= cutoff) this.combos.delete(key);
  }

  private freezeStats(stats: MutableViewerStats): ViewerStats {
    const { followed: _followed, ...publicStats } = stats;
    return structuredClone({ ...publicStats, level: levelForPoints(stats.points, this.levels) });
  }
}

const mergeViewer = (current: Viewer, incoming: Viewer): Viewer => ({
  ...current,
  ...incoming,
  avatarUrl: incoming.avatarUrl ?? current.avatarUrl,
  uniqueId: incoming.uniqueId ?? current.uniqueId,
  isModerator: current.isModerator || incoming.isModerator,
  isSubscriber: current.isSubscriber || incoming.isSubscriber,
});

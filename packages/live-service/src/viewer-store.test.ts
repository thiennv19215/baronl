import { describe, expect, it } from 'vitest';
import { createLiveEvent } from '@orbitstage/shared';
import { ViewerStore, levelForPoints } from './viewer-store.js';

describe('ViewerStore', () => {
  it('calculates levels and leaderboard without double-counting gift combo updates', () => {
    let now = Date.parse('2026-01-01T00:00:00.000Z');
    const store = new ViewerStore({ clock: { now: () => now } });
    const lan = { id: 'lan', displayName: 'Lan' };
    const minh = { id: 'minh', displayName: 'Minh' };
    store.apply(createLiveEvent('gift', {
      viewer: lan,
      giftId: 'rose',
      giftName: 'Rose',
      repeatCount: 2,
      diamondValue: 10,
      comboId: 'combo-1',
      repeatEnd: false,
    }, 'fake'));
    now += 100;
    store.apply(createLiveEvent('gift', {
      viewer: lan,
      giftId: 'rose',
      giftName: 'Rose',
      repeatCount: 5,
      diamondValue: 10,
      comboId: 'combo-1',
      repeatEnd: true,
    }, 'fake'));
    store.apply(createLiveEvent('like', { viewer: minh, count: 20 }, 'fake'));

    expect(store.get('lan')).toMatchObject({ gifts: 5, diamonds: 50, points: 50 });
    expect(store.leaderboard('points', 2).map((entry) => entry.viewer.id)).toEqual(['lan', 'minh']);
    expect(levelForPoints(150)).toMatchObject({ level: 3, title: 'Fan năng động' });
  });

  it('awards follow points only once', () => {
    const store = new ViewerStore();
    const viewer = { id: 'u', displayName: 'User' };
    store.apply(createLiveEvent('follow', { viewer }, 'fake'));
    store.apply(createLiveEvent('follow', { viewer }, 'fake'));
    expect(store.get('u')).toMatchObject({ follows: 1, points: 25 });
  });
});

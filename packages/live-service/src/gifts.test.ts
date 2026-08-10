import { describe, expect, it } from 'vitest';
import { createLiveEvent } from '@orbitstage/shared';
import { GiftCatalog, GiftWishBoard } from './gifts.js';

describe('gifts', () => {
  it('resolves licensed registry metadata and manages wishes', () => {
    const catalog = new GiftCatalog([{ id: 'star', name: 'Orbit Star', tier: 'super', animationAssetId: 'gift.orbit-star' }]);
    const event = createLiveEvent('gift', {
      viewer: { id: 'u', displayName: 'Chi' },
      giftId: 'star',
      giftName: 'Star',
      repeatCount: 2,
      diamondValue: 600,
      message: 'Chúc sân khấu thật vui!',
    }, 'fake');
    const presentation = catalog.resolve(event);
    const wishes = new GiftWishBoard();
    const wish = wishes.add(presentation);

    expect(presentation).toMatchObject({ tier: 'super', totalDiamonds: 1_200, animationAssetId: 'gift.orbit-star' });
    expect(wishes.setVisible(wish!.id, false)).toBe(true);
    expect(wishes.list()).toHaveLength(0);
    expect(wishes.list(true)).toHaveLength(1);
    expect(wishes.get(wish!.id)?.visible).toBe(false);
    expect(wishes.remove(wish!.id)).toBe(true);
    expect(wishes.list(true)).toHaveLength(0);
  });

  it('validates direct wishes and evicts the oldest entry at capacity', () => {
    const wishes = new GiftWishBoard(1);
    wishes.addWish({ id: 'first', viewerId: 'u1', viewerName: 'Lan', message: 'Lời chúc đầu', createdAt: '2026-08-10T00:00:00.000Z', visible: true });
    wishes.addWish({ id: 'second', viewerId: 'u2', viewerName: 'Minh', message: 'Lời chúc sau', createdAt: '2026-08-10T00:00:01.000Z', visible: true });

    expect(wishes.get('first')).toBeUndefined();
    expect(wishes.list(true).map((wish) => wish.id)).toEqual(['second']);
    expect(() => wishes.addWish({ id: '', viewerId: 'u', viewerName: 'Lan', message: 'Hi', createdAt: new Date().toISOString(), visible: true })).toThrow();
  });
});

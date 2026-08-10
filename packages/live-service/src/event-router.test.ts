import { describe, expect, it } from 'vitest';
import { createLiveEvent, DEFAULT_APP_CONFIG } from '@orbitstage/shared';
import { LiveEventBus } from './event-bus.js';
import { EventRouter } from './event-router.js';

describe('EventRouter', () => {
  it('routes valid events once and rejects duplicate/spam events', async () => {
    let now = 1_000;
    const bus = new LiveEventBus();
    const received: string[] = [];
    bus.subscribe((event) => received.push(event.id));
    const router = new EventRouter({
      bus,
      spam: { ...DEFAULT_APP_CONFIG.spam, maxEventsPerViewer: 2, maxChatPerViewer: 2 },
      clock: { now: () => now },
    });
    const viewer = { id: 'u1', displayName: 'Lan' };
    const first = createLiveEvent('chat', { viewer, message: 'hello' }, 'fake');

    expect((await router.route(first)).accepted).toBe(true);
    expect(await router.route(first)).toMatchObject({ accepted: false, reason: 'duplicate' });
    expect(await router.route(createLiveEvent('chat', { viewer, message: 'hello' }, 'fake'))).toMatchObject({
      accepted: false,
      reason: 'duplicate',
    });
    now += DEFAULT_APP_CONFIG.spam.duplicateWindowMs + 1;
    expect((await router.route(createLiveEvent('chat', { viewer, message: 'hello again' }, 'fake'))).accepted).toBe(true);
    expect(received).toHaveLength(2);
  });

  it('contains subscriber errors without losing later subscribers', async () => {
    const bus = new LiveEventBus();
    let called = false;
    bus.subscribe(() => {
      throw new Error('listener failure');
    });
    bus.subscribe(() => {
      called = true;
    });
    await bus.publish(createLiveEvent('join', { viewer: { id: 'u2', displayName: 'Minh' } }, 'fake'));
    expect(called).toBe(true);
  });

  it('never drops gift combo updates because of chat/like spam limits', async () => {
    const bus = new LiveEventBus();
    const router = new EventRouter({
      bus,
      spam: { ...DEFAULT_APP_CONFIG.spam, maxEventsPerViewer: 1 },
    });
    const viewer = { id: 'supporter', displayName: 'Supporter' };
    for (let count = 1; count <= 3; count += 1) {
      expect(await router.route(createLiveEvent('gift', {
        viewer,
        giftId: 'rose',
        giftName: 'Rose',
        repeatCount: count,
        diamondValue: 1,
        comboId: 'combo',
        repeatEnd: count === 3,
      }, 'fake'))).toMatchObject({ accepted: true });
    }
  });
});

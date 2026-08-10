import { describe, expect, it } from 'vitest';
import { createLiveEvent, LiveEventSchema } from './events.js';

describe('LiveEventSchema', () => {
  it('creates and validates normalized gift events', () => {
    const event = createLiveEvent(
      'gift',
      {
        viewer: { id: 'viewer-1', displayName: 'Lan' },
        giftId: 'rose',
        giftName: 'Rose',
        repeatCount: 3,
        diamondValue: 1,
      },
      'fake',
    );

    expect(event.type).toBe('gift');
    expect(event.payload.repeatCount).toBe(3);
    expect(LiveEventSchema.parse(event)).toEqual(event);
  });

  it('rejects malformed untrusted event payloads', () => {
    expect(() =>
      LiveEventSchema.parse({
        id: 'not-a-uuid',
        type: 'chat',
        source: 'tikfinity',
        occurredAt: 'today',
        receivedAt: 'today',
        payload: { viewer: {}, message: '' },
      }),
    ).toThrow();
  });
});

import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { TikFinityBridge, normalizeTikFinityMessage, type TikFinitySocket } from './tikfinity.js';

class FakeSocket extends EventEmitter {
  public readyState = 0;

  public close(code = 1_000, reason = ''): void {
    this.readyState = 3;
    this.emit('close', code, Buffer.from(reason));
  }

  public terminate(): void {
    this.close(1_006, 'terminated');
  }
}

describe('TikFinity', () => {
  it('normalizes join, chat, follow, like and gift payload shapes', () => {
    const common = { user: { userId: '123', uniqueId: 'lan-live', nickname: 'Lan' } };
    expect(normalizeTikFinityMessage({ event: 'member', data: common })[0]?.type).toBe('join');
    expect(normalizeTikFinityMessage({ event: 'chat', data: { ...common, comment: 'Xin chào' } })[0]).toMatchObject({
      type: 'chat',
      payload: { message: 'Xin chào' },
    });
    expect(normalizeTikFinityMessage({ event: 'follow', data: common })[0]?.type).toBe('follow');
    expect(normalizeTikFinityMessage({ event: 'like', data: { ...common, likeCount: 12 } })[0]).toMatchObject({
      type: 'like',
      payload: { count: 12 },
    });
    expect(normalizeTikFinityMessage({
      event: 'gift',
      data: { ...common, giftId: 'rose', giftName: 'Rose', repeatCount: 3, diamondCount: 1 },
    })[0]).toMatchObject({ type: 'gift', payload: { giftId: 'rose', repeatCount: 3, diamondValue: 1 } });
    const replayed = { event: 'chat', data: { ...common, msgId: 'provider-42', comment: 'Một lần' } };
    expect(normalizeTikFinityMessage(replayed)[0]?.id).toBe(normalizeTikFinityMessage(replayed)[0]?.id);
    expect(normalizeTikFinityMessage('{bad json')).toEqual([]);
  });

  it('reports status and reconnects with bounded backoff', () => {
    const sockets: FakeSocket[] = [];
    let scheduled: (() => void) | undefined;
    let scheduledDelay = -1;
    const bridge = new TikFinityBridge({
      url: 'ws://127.0.0.1:21213/',
      reconnect: { initialDelayMs: 100, maxDelayMs: 1_000, jitterRatio: 0 },
      socketFactory: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket as unknown as TikFinitySocket;
      },
      scheduler: (callback, delayMs) => {
        scheduled = callback;
        scheduledDelay = delayMs;
        return () => {
          scheduled = undefined;
        };
      },
    });
    const received: string[] = [];
    bridge.onEvent((event) => received.push(event.type));
    bridge.connect();
    sockets[0]!.readyState = 1;
    sockets[0]!.emit('open');
    sockets[0]!.emit('message', Buffer.from(JSON.stringify({
      event: 'chat',
      data: { userId: 'u', nickname: 'User', comment: 'Hi' },
    })));
    sockets[0]!.emit('close', 1_006, Buffer.from('network'));

    expect(bridge.status).toMatchObject({ state: 'reconnecting', attempt: 1, nextRetryMs: 100 });
    expect(scheduledDelay).toBe(100);
    scheduled!();
    expect(sockets).toHaveLength(2);
    sockets[1]!.readyState = 1;
    sockets[1]!.emit('open');
    expect(received).toContain('chat');
    expect(received).toContain('disconnect');
    expect(received).toContain('reconnect');
    bridge.disconnect();
    expect(bridge.status.state).toBe('disconnected');
  });
});

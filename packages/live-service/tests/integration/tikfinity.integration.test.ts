import type { AddressInfo } from 'node:net';
import { WebSocketServer } from 'ws';
import { describe, expect, it, vi } from 'vitest';
import { TikFinityBridge } from '../../src/tikfinity.js';

describe('TikFinity bridge integration', () => {
  it('receives real WebSocket frames and reconnects to a fake TikFinity server', async () => {
    const fakeTikFinity = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise<void>((resolve, reject) => {
      fakeTikFinity.once('listening', resolve);
      fakeTikFinity.once('error', reject);
    });
    const address = fakeTikFinity.address() as AddressInfo;
    let connections = 0;
    fakeTikFinity.on('connection', (client) => {
      connections += 1;
      if (connections === 1) {
        client.send(JSON.stringify({ event: 'chat', data: { userId: 'u1', nickname: 'Lan', comment: 'Xin chào' } }));
        setTimeout(() => client.close(4_001, 'test reconnect'), 5);
      } else {
        client.send(JSON.stringify({
          event: 'gift',
          data: { userId: 'u1', nickname: 'Lan', giftId: 'rose', giftName: 'Rose', repeatCount: 2, diamondCount: 1 },
        }));
      }
    });
    const bridge = new TikFinityBridge({
      url: `ws://127.0.0.1:${address.port}`,
      reconnect: { initialDelayMs: 10, maxDelayMs: 20, jitterRatio: 0 },
    });
    const types: string[] = [];
    bridge.onEvent((event) => types.push(event.type));
    bridge.connect();
    try {
      await vi.waitFor(() => {
        expect(connections).toBeGreaterThanOrEqual(2);
        expect(types).toContain('chat');
        expect(types).toContain('gift');
        expect(types).toContain('disconnect');
        expect(types).toContain('reconnect');
      }, { timeout: 3_000 });
    } finally {
      bridge.disconnect();
      await new Promise<void>((resolve) => fakeTikFinity.close(() => resolve()));
    }
  });
});

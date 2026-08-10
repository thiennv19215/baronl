import WebSocket from 'ws';
import { describe, expect, it } from 'vitest';
import { LiveEventBus } from '../../src/event-bus.js';
import { HealthRegistry } from '../../src/health.js';
import { LocalLiveServer } from '../../src/local-server.js';

describe('LocalLiveServer integration', () => {
  it('binds loopback, exposes health/stage, authenticates mutation and broadcasts events', async () => {
    const bus = new LiveEventBus();
    const health = new HealthRegistry();
    health.register('live-service', () => true, { critical: true });
    const server = new LocalLiveServer({
      port: 0,
      eventBus: bus,
      health,
      accessToken: 'test-token-with-at-least-24-characters',
      enableFakeEvents: true,
      snapshot: () => ({ ready: true }),
    });
    const info = await server.start();
    try {
      expect(info.host).toBe('127.0.0.1');
      const healthResponse = await fetch(`${info.baseUrl}/health`);
      expect(healthResponse.status).toBe(200);
      expect(await healthResponse.json()).toMatchObject({ status: 'ok' });

      const unauthorized = await fetch(`${info.baseUrl}/api/fake-event`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'join' }),
      });
      expect(unauthorized.status).toBe(401);

      const socket = new WebSocket(info.websocketUrl);
      const messages: unknown[] = [];
      socket.on('message', (data) => messages.push(JSON.parse(data.toString())));
      await new Promise<void>((resolve, reject) => {
        socket.once('open', resolve);
        socket.once('error', reject);
      });
      const fake = await fetch(`${info.baseUrl}/api/fake-event`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-orbitstage-token': server.accessToken,
        },
        body: JSON.stringify({ type: 'gift', viewer: { name: 'Lan' }, giftName: 'Rose', diamondValue: 1 }),
      });
      expect(fake.status).toBe(202);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(messages).toContainEqual(expect.objectContaining({ kind: 'hello', snapshot: { ready: true } }));
      expect(messages).toContainEqual(expect.objectContaining({ kind: 'live-event', event: expect.objectContaining({ type: 'gift' }) }));

      const stage = await fetch(info.stageUrl);
      expect(stage.status).toBe(200);
      expect(await stage.text()).toContain('OrbitStage Stage');
      socket.close();
    } finally {
      await server.stop();
      bus.close();
    }
  });
});

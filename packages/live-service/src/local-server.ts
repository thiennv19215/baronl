import { randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import type { AddressInfo } from 'node:net';
import { WebSocketServer, type WebSocket } from 'ws';
import { z } from 'zod';
import type { LiveEvent } from '@orbitstage/shared';
import { LiveEventBus } from './event-bus.js';
import { FakeEventGenerator } from './fake-events.js';
import type { HealthRegistry } from './health.js';
import { NOOP_LOGGER, type Logger } from './types.js';

const FakeRequestSchema = z.object({
  type: z.enum(['join', 'chat', 'follow', 'like', 'gift']),
  viewer: z
    .object({
      id: z.string().trim().min(1).max(128).optional(),
      name: z.string().trim().min(1).max(100).optional(),
      displayName: z.string().trim().min(1).max(100).optional(),
      avatar: z.string().url().max(2_048).optional(),
      avatarUrl: z.string().url().max(2_048).optional(),
    })
    .optional(),
  message: z.string().trim().min(1).max(500).optional(),
  likeCount: z.number().int().positive().max(1_000_000).optional(),
  giftId: z.string().trim().min(1).max(128).optional(),
  giftName: z.string().trim().min(1).max(100).optional(),
  repeatCount: z.number().int().positive().max(100_000).optional(),
  diamondValue: z.number().int().nonnegative().max(100_000_000).optional(),
});

export interface LocalLiveServerOptions {
  port: number;
  eventBus: LiveEventBus;
  health: HealthRegistry;
  host?: '127.0.0.1';
  stageDirectory?: string;
  accessToken?: string;
  enableFakeEvents?: boolean;
  snapshot?: () => unknown | Promise<unknown>;
  onFakeEvent?: (event: LiveEvent) => void | Promise<void>;
  logger?: Logger;
}

export interface LocalLiveServerInfo {
  host: '127.0.0.1';
  port: number;
  baseUrl: string;
  stageUrl: string;
  websocketUrl: string;
}

export class LocalLiveServer {
  private readonly host: '127.0.0.1';
  private readonly token: string;
  private readonly logger: Logger;
  private readonly fake = new FakeEventGenerator();
  private readonly websocket = new WebSocketServer({ noServer: true, clientTracking: true, maxPayload: 64 * 1_024 });
  private server?: Server;
  private unsubscribeEvents?: () => void;
  private infoValue?: LocalLiveServerInfo;

  public constructor(private readonly options: LocalLiveServerOptions) {
    this.host = options.host ?? '127.0.0.1';
    if (this.host !== '127.0.0.1') throw new TypeError('Local server must bind to 127.0.0.1');
    if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65_535) throw new RangeError('Invalid local server port');
    if (options.stageDirectory && !isAbsolute(options.stageDirectory)) throw new TypeError('stageDirectory must be absolute');
    this.token = options.accessToken ?? randomBytes(32).toString('base64url');
    if (this.token.length < 24) throw new TypeError('Local server access token is too short');
    this.logger = options.logger ?? NOOP_LOGGER;
  }

  public get info(): LocalLiveServerInfo | undefined {
    return this.infoValue ? { ...this.infoValue } : undefined;
  }

  /** Trusted Main-process accessor; do not send this token to the control renderer. */
  public get accessToken(): string {
    return this.token;
  }

  public async start(): Promise<LocalLiveServerInfo> {
    if (this.server && this.infoValue) return { ...this.infoValue };
    this.server = createServer((request, response) => void this.handleRequest(request, response));
    this.server.on('upgrade', (request, socket, head) => {
      try {
        const url = new URL(request.url ?? '/', `http://${this.host}`);
        if (url.pathname !== '/events' || !this.authorized(request, url)) {
          socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
          socket.destroy();
          return;
        }
        this.websocket.handleUpgrade(request, socket, head, (client) => this.websocket.emit('connection', client, request));
      } catch {
        socket.destroy();
      }
    });
    this.websocket.on('connection', (client) => void this.greet(client));
    this.websocket.on('error', (error) => this.logger.error('Local WebSocket server failed', { error }));
    await new Promise<void>((resolvePromise, reject) => {
      const server = this.server!;
      const onError = (error: Error): void => reject(error);
      server.once('error', onError);
      server.listen(this.options.port, this.host, () => {
        server.off('error', onError);
        resolvePromise();
      });
    });
    const address = this.server.address() as AddressInfo;
    const baseUrl = `http://${this.host}:${address.port}`;
    const encodedToken = encodeURIComponent(this.token);
    this.infoValue = {
      host: this.host,
      port: address.port,
      baseUrl,
      stageUrl: `${baseUrl}/stage/?token=${encodedToken}`,
      websocketUrl: `ws://${this.host}:${address.port}/events?token=${encodedToken}`,
    };
    this.unsubscribeEvents = this.options.eventBus.subscribe((event) => this.broadcast({ kind: 'live-event', event }));
    this.logger.info('Local LIVE server started', { host: this.host, port: address.port });
    return { ...this.infoValue };
  }

  public async stop(): Promise<void> {
    this.unsubscribeEvents?.();
    this.unsubscribeEvents = undefined;
    for (const client of this.websocket.clients) client.close(1_001, 'service stopping');
    const server = this.server;
    this.server = undefined;
    this.infoValue = undefined;
    if (!server) return;
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
  }

  public broadcast(message: unknown): void {
    const serialized = JSON.stringify(message);
    for (const client of this.websocket.clients) {
      if (client.readyState === client.OPEN && client.bufferedAmount < 1_000_000) client.send(serialized);
    }
  }

  private async greet(client: WebSocket): Promise<void> {
    try {
      const snapshot = await this.options.snapshot?.();
      client.send(JSON.stringify({ kind: 'hello', protocolVersion: 1, snapshot: snapshot ?? null }));
    } catch (error) {
      this.logger.warn('Unable to send local WebSocket snapshot', { error });
      client.send(JSON.stringify({ kind: 'hello', protocolVersion: 1, snapshot: null }));
    }
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    this.setSecurityHeaders(response);
    try {
      const url = new URL(request.url ?? '/', `http://${this.host}`);
      if (request.method === 'GET' && url.pathname === '/health') {
        const health = await this.options.health.checkAll();
        this.json(response, health.status === 'error' ? 503 : 200, health);
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/snapshot') {
        if (!this.authorized(request, url)) return this.json(response, 401, { error: 'unauthorized' });
        this.json(response, 200, (await this.options.snapshot?.()) ?? null);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/fake-event') {
        if (!this.authorized(request, url)) return this.json(response, 401, { error: 'unauthorized' });
        if (!this.options.enableFakeEvents) return this.json(response, 403, { error: 'fake_events_disabled' });
        const parsed = FakeRequestSchema.safeParse(await readJsonBody(request, 64 * 1_024));
        if (!parsed.success) return this.json(response, 400, { error: 'invalid_event', issues: parsed.error.issues });
        const viewer = parsed.data.viewer;
        const event = this.fake.next(parsed.data.type, {
          viewer: viewer
            ? {
                ...(viewer.id ? { id: viewer.id } : {}),
                ...(viewer.displayName ?? viewer.name ? { displayName: viewer.displayName ?? viewer.name } : {}),
                ...(viewer.avatarUrl ?? viewer.avatar ? { avatarUrl: viewer.avatarUrl ?? viewer.avatar } : {}),
              }
            : undefined,
          ...(parsed.data.message ? { message: parsed.data.message } : {}),
          ...(parsed.data.likeCount ? { likeCount: parsed.data.likeCount } : {}),
          ...(parsed.data.giftId ? { giftId: parsed.data.giftId } : {}),
          ...(parsed.data.giftName ? { giftName: parsed.data.giftName } : {}),
          ...(parsed.data.repeatCount ? { repeatCount: parsed.data.repeatCount } : {}),
          ...(parsed.data.diamondValue !== undefined ? { diamondValue: parsed.data.diamondValue } : {}),
        });
        if (this.options.onFakeEvent) await this.options.onFakeEvent(event);
        else await this.options.eventBus.publish(event);
        this.json(response, 202, { accepted: true, eventId: event.id });
        return;
      }
      if (request.method === 'GET' && (url.pathname === '/stage' || url.pathname.startsWith('/stage/'))) {
        if (!this.authorized(request, url)) return this.text(response, 401, 'Unauthorized');
        if (url.searchParams.has('token')) {
          response.setHeader('set-cookie', `OrbitStageToken=${encodeURIComponent(this.token)}; HttpOnly; SameSite=Strict; Path=/`);
        }
        await this.serveStage(url.pathname, response);
        return;
      }
      this.json(response, 404, { error: 'not_found' });
    } catch (error) {
      this.logger.error('Local HTTP request failed', { method: request.method, url: request.url, error });
      if (!response.headersSent) this.json(response, 500, { error: 'internal_error' });
      else response.destroy();
    }
  }

  private async serveStage(pathname: string, response: ServerResponse): Promise<void> {
    if (!this.options.stageDirectory) {
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.statusCode = 200;
      response.end('<!doctype html><html><body style="margin:0;background:#080b18;color:white;font-family:sans-serif"><main>OrbitStage Stage is starting…</main></body></html>');
      return;
    }
    const root = resolve(this.options.stageDirectory);
    const rawRelative = decodeURIComponent(pathname.replace(/^\/stage\/?/, '')) || 'index.html';
    const normalizedRelative = rawRelative.replaceAll('/', sep);
    let filePath = resolve(root, normalizedRelative);
    if (!insideOrEqual(root, filePath)) return this.text(response, 404, 'Not found');
    let info = await stat(filePath).catch(() => undefined);
    if (info?.isDirectory()) {
      filePath = resolve(filePath, 'index.html');
      if (!insideOrEqual(root, filePath)) return this.text(response, 404, 'Not found');
      info = await stat(filePath).catch(() => undefined);
    }
    if (!info?.isFile()) return this.text(response, 404, 'Not found');
    response.statusCode = 200;
    response.setHeader('content-type', CONTENT_TYPES[extname(filePath).toLocaleLowerCase()] ?? 'application/octet-stream');
    response.setHeader('cache-control', filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable');
    response.end(await readFile(filePath));
  }

  private authorized(request: IncomingMessage, url: URL): boolean {
    const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const header = request.headers['x-orbitstage-token'];
    const cookie = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim().split('='))
      .find(([name]) => name === 'OrbitStageToken')?.[1];
    const provided = bearer
      ?? (Array.isArray(header) ? header[0] : header)
      ?? url.searchParams.get('token')
      ?? (cookie ? decodeURIComponent(cookie) : undefined);
    return typeof provided === 'string' && timingSafeTextEqual(provided, this.token);
  }

  private setSecurityHeaders(response: ServerResponse): void {
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('referrer-policy', 'no-referrer');
    response.setHeader('x-frame-options', 'SAMEORIGIN');
    response.setHeader(
      'content-security-policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:* wss://127.0.0.1:*",
    );
    response.setHeader('cache-control', 'no-store');
  }

  private json(response: ServerResponse, status: number, body: unknown): void {
    response.statusCode = status;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(body));
  }

  private text(response: ServerResponse, status: number, body: string): void {
    response.statusCode = status;
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    response.end(body);
  }
}

const timingSafeTextEqual = (left: string, right: string): boolean => {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  return difference === 0;
};

const insideOrEqual = (parent: string, candidate: string): boolean => {
  const value = relative(parent, candidate);
  return value === '' || (!value.startsWith('..') && !isAbsolute(value));
};

const readJsonBody = async (request: IncomingMessage, maximumBytes: number): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += bytes.length;
    if (length > maximumBytes) throw new RangeError('Request body is too large');
    chunks.push(bytes);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
};

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
};

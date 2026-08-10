import { createReadStream, promises as fs } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import type { StructuredLogger } from "./logger";

export interface LocalServerSnapshot {
  appVersion: string;
  liveStatus: string;
  tikfinityStatus: string;
  startedAt: string;
  config: unknown;
  stage: unknown;
}

interface LocalServerOptions {
  stageRoot: string;
  assetRoot: string;
  userAssetRoot: string;
  devStageUrl?: string;
  token: string;
  logger: StructuredLogger;
  getSnapshot: () => LocalServerSnapshot;
  onFakeEvent: (value: unknown) => Promise<unknown> | unknown;
}

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".woff2": "font/woff2"
};

function isLoopbackHost(request: IncomingMessage): boolean {
  const raw = request.headers.host ?? "";
  const hostname = raw.startsWith("[") ? raw.slice(1, raw.indexOf("]")) : raw.split(":")[0];
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
}

function isTrustedWebSocketOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "http:" || parsed.protocol === "https:")
      && ["127.0.0.1", "localhost", "::1", "[::1]"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function securityHeaders(response: ServerResponse, port: number): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'none'",
    `connect-src 'self' ws://127.0.0.1:${port} ws://localhost:${port}`,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'"
  ].join("; "));
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}

async function readJson(request: IncomingMessage, maxBytes = 64 * 1024): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error("Request body is too large");
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

function safeAssetPath(root: string, relativePath: string): string | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(relativePath).replaceAll("\\", "/");
  } catch {
    return undefined;
  }
  const normalized = path.posix.normalize(`/${decoded}`).replace(/^\/+/, "");
  const absolute = path.resolve(root, ...normalized.split("/"));
  const resolvedRoot = path.resolve(root);
  if (absolute !== resolvedRoot && !absolute.startsWith(`${resolvedRoot}${path.sep}`)) return undefined;
  return absolute;
}

export class LocalStageServer {
  #http?: Server;
  #webSocket?: WebSocketServer;
  #port?: number;

  constructor(private readonly options: LocalServerOptions) {}

  get port(): number | undefined {
    return this.#port;
  }

  get obsUrl(): string | undefined {
    return this.#port ? `http://127.0.0.1:${this.#port}/?source=obs&audio=1` : undefined;
  }

  get clientCount(): number {
    return this.#webSocket?.clients.size ?? 0;
  }

  async start(port: number): Promise<void> {
    if (this.#http) return;
    this.#port = port;
    this.#http = createServer((request, response) => {
      void this.handleRequest(request, response).catch((error) => {
        this.options.logger.error("local_server.request_failed", error, { url: request.url });
        if (!response.headersSent) json(response, 500, { ok: false, error: "Internal server error" });
        else response.end();
      });
    });
    this.#webSocket = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024, perMessageDeflate: false });
    this.#http.on("upgrade", (request, socket, head) => {
      if (!isLoopbackHost(request) || !isTrustedWebSocketOrigin(request) || request.url !== "/ws") {
        socket.destroy();
        return;
      }
      this.#webSocket?.handleUpgrade(request, socket, head, (client) => {
        this.#webSocket?.emit("connection", client, request);
      });
    });
    this.#webSocket.on("connection", (client) => {
      client.send(JSON.stringify({ type: "snapshot", payload: this.options.getSnapshot().stage }));
      client.on("error", (error) => this.options.logger.warn("local_server.websocket_error", { message: error.message }));
    });

    await new Promise<void>((resolve, reject) => {
      const server = this.#http;
      if (!server) return reject(new Error("HTTP server was not initialized"));
      const onError = (error: Error) => {
        server.off("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        server.off("error", onError);
        const address = server.address();
        if (address && typeof address === "object") this.#port = address.port;
        resolve();
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, "127.0.0.1");
    });
    this.options.logger.info("local_server.started", { port, host: "127.0.0.1" });
  }

  broadcast(type: string, payload: unknown): void {
    const message = JSON.stringify({ type, payload });
    for (const client of this.#webSocket?.clients ?? []) {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    }
  }

  async stop(): Promise<void> {
    const webSocket = this.#webSocket;
    const http = this.#http;
    this.#webSocket = undefined;
    this.#http = undefined;
    this.#port = undefined;
    for (const client of webSocket?.clients ?? []) client.close(1001, "App shutting down");
    await Promise.all([
      webSocket ? new Promise<void>((resolve) => webSocket.close(() => resolve())) : Promise.resolve(),
      http ? new Promise<void>((resolve) => http.close(() => resolve())) : Promise.resolve()
    ]);
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    securityHeaders(response, this.#port ?? 0);
    if (!isLoopbackHost(request)) {
      json(response, 403, { ok: false, error: "Loopback host required" });
      return;
    }
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${this.#port ?? 0}`);

    if (request.method === "GET" && url.pathname === "/health") {
      const snapshot = this.options.getSnapshot();
      json(response, 200, {
        ok: true,
        service: "orbitstage-local",
        version: snapshot.appVersion,
        live: snapshot.liveStatus,
        tikfinity: snapshot.tikfinityStatus,
        websocketClients: this.clientCount,
        uptimeSeconds: Math.round(process.uptime())
      });
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/state") {
      json(response, 200, this.options.getSnapshot());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/fake-event") {
      if (request.headers.authorization !== `Bearer ${this.options.token}`) {
        json(response, 401, { ok: false, error: "Unauthorized" });
        return;
      }
      try {
        const result = await this.options.onFakeEvent(await readJson(request));
        json(response, 202, { ok: true, event: result });
      } catch (error) {
        json(response, 400, { ok: false, error: error instanceof Error ? error.message : "Invalid event" });
      }
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      json(response, 405, { ok: false, error: "Method not allowed" });
      return;
    }

    const projectAssetRequest = url.pathname.startsWith("/project-assets/");
    const userAssetRequest = url.pathname.startsWith("/user-assets/");
    if (projectAssetRequest) response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    const assetRequest = projectAssetRequest || userAssetRequest;
    const root = projectAssetRequest ? this.options.assetRoot : userAssetRequest ? this.options.userAssetRoot : this.options.stageRoot;
    let relative = projectAssetRequest
      ? url.pathname.slice("/project-assets/".length)
      : userAssetRequest ? url.pathname.slice("/user-assets/".length) : url.pathname.slice(1);
    if (!relative || relative.endsWith("/")) relative += "index.html";
    let filePath = safeAssetPath(root, relative);
    if (!filePath) {
      json(response, 400, { ok: false, error: "Invalid path" });
      return;
    }
    let stat = await fs.stat(filePath).catch(() => undefined);
    if ((!stat || !stat.isFile()) && !assetRequest && !path.extname(relative)) {
      filePath = path.join(root, "index.html");
      stat = await fs.stat(filePath).catch(() => undefined);
    }
    if (!stat?.isFile() && !assetRequest && this.options.devStageUrl) {
      const target = new URL(this.options.devStageUrl);
      target.search = url.search;
      target.searchParams.set("ws", `ws://127.0.0.1:${this.#port ?? 0}/ws`);
      response.statusCode = 302;
      response.setHeader("Location", target.toString());
      response.end();
      return;
    }
    if (!stat?.isFile()) {
      json(response, 404, { ok: false, error: "Not found" });
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Length", stat.size);
    response.setHeader("Content-Type", MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream");
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  }
}

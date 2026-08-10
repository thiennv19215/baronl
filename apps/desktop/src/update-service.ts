import { createHash, createPublicKey, verify } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { AppConfig } from "./app-config";
import type { StructuredLogger } from "./logger";

const execFileAsync = promisify(execFile);

interface UpdateManifest {
  version: string;
  url: string;
  sha256: string;
  size: number;
  publishedAt: string;
  releaseNotes?: string;
  signature: string;
}

export interface UpdateSnapshot {
  currentVersion: string;
  availableVersion?: string;
  status: "idle" | "checking" | "available" | "downloading" | "ready" | "up-to-date" | "error";
  progress?: number;
  message?: string;
  signatureVerified?: boolean;
  backupReady?: boolean;
}

interface UpdateServiceOptions {
  dataDirectory: string;
  getConfig: () => AppConfig;
  logger: StructuredLogger;
  publicKey?: string;
  onStatus: (status: UpdateSnapshot) => void;
}

function isManifest(value: unknown): value is UpdateManifest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return ["version", "url", "sha256", "publishedAt", "signature"].every((key) => typeof record[key] === "string") &&
    typeof record.size === "number" && Number.isSafeInteger(record.size) && record.size > 0 && record.size <= 600 * 1024 * 1024 &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(record.version)) && /^[0-9a-f]{64}$/i.test(String(record.sha256));
}

function canonicalManifest(value: Omit<UpdateManifest, "signature" | "releaseNotes">): string {
  return [value.version, value.url, value.sha256.toLowerCase(), String(value.size), value.publishedAt].join("\n");
}

function compareVersions(left: string, right: string): number {
  const a = left.split(/[.-]/).slice(0, 3).map(Number);
  const b = right.split(/[.-]/).slice(0, 3).map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

export class UpdateService {
  #snapshot: UpdateSnapshot = { currentVersion: app.getVersion(), status: "idle" };
  #manifest?: UpdateManifest;
  #installerPath?: string;
  #backupPath?: string;

  constructor(private readonly options: UpdateServiceOptions) {}

  get snapshot(): UpdateSnapshot {
    return { ...this.#snapshot };
  }

  async check(): Promise<UpdateSnapshot> {
    const config = this.options.getConfig().update;
    if (!config.enabled || !config.feedUrl) return this.set({ status: "up-to-date", message: "Update đang tắt cho đến khi có feed đã ký." });
    if (!this.options.publicKey) return this.set({ status: "error", message: "Thiếu public key xác minh manifest update." });
    const feed = new URL(config.feedUrl);
    if (feed.protocol !== "https:") return this.set({ status: "error", message: "Update feed bắt buộc dùng HTTPS." });
    this.set({ status: "checking", message: "Đang kiểm tra manifest đã ký…" });
    try {
      const response = await fetch(feed, { signal: AbortSignal.timeout(15_000), redirect: "error", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Update feed HTTP ${response.status}`);
      const text = await response.text();
      if (Buffer.byteLength(text) > 1_000_000) throw new Error("Update manifest is too large");
      const manifest = JSON.parse(text) as unknown;
      if (!isManifest(manifest)) throw new Error("Update manifest schema is invalid");
      const artifact = new URL(manifest.url, feed);
      if (artifact.protocol !== "https:" || artifact.origin !== feed.origin) throw new Error("Update artifact must use the feed HTTPS origin");
      const { signature, releaseNotes: _releaseNotes, ...signed } = manifest;
      const valid = verify(null, Buffer.from(canonicalManifest(signed)), createPublicKey(this.options.publicKey), Buffer.from(signature, "base64"));
      if (!valid) throw new Error("Update manifest signature is invalid");
      this.#manifest = { ...manifest, url: artifact.toString() };
      if (compareVersions(manifest.version, app.getVersion()) <= 0) {
        return this.set({ status: "up-to-date", message: "Bạn đang dùng phiên bản mới nhất.", signatureVerified: true });
      }
      return this.set({ status: "available", availableVersion: manifest.version, message: manifest.releaseNotes ?? "Có bản cập nhật mới.", signatureVerified: true });
    } catch (error) {
      this.options.logger.error("update.check_failed", error);
      return this.set({ status: "error", message: error instanceof Error ? error.message : "Không thể kiểm tra update." });
    }
  }

  async installOrPrepare(): Promise<UpdateSnapshot> {
    if (this.#snapshot.status === "ready" && this.#installerPath) {
      if (!app.isPackaged) return this.set({ status: "error", message: "Không chạy installer update trong development." });
      const valid = await this.verifyAuthenticode(this.#installerPath);
      if (!valid) return this.set({ status: "error", message: "Chữ ký Authenticode của installer không hợp lệ." });
      const child = spawn(this.#installerPath, ["/S"], { detached: true, stdio: "ignore", windowsHide: true });
      child.unref();
      this.options.logger.info("update.installer_started", { version: this.#manifest?.version });
      setImmediate(() => app.quit());
      return this.snapshot;
    }
    if (!this.#manifest || this.#snapshot.status !== "available") throw new Error("Chưa có update đã xác minh để tải.");
    try {
      this.set({ status: "downloading", progress: 0, availableVersion: this.#manifest.version, signatureVerified: true });
      const directory = path.join(this.options.dataDirectory, "updates", this.#manifest.version);
      await fs.mkdir(directory, { recursive: true });
      const partial = path.join(directory, "OrbitStage-update.exe.partial");
      const installer = path.join(directory, "OrbitStage-update.exe");
      const response = await fetch(this.#manifest.url, { signal: AbortSignal.timeout(120_000), redirect: "error" });
      if (!response.ok) throw new Error(`Update artifact HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length !== this.#manifest.size) throw new Error("Update size does not match manifest");
      const hash = createHash("sha256").update(buffer).digest("hex");
      if (hash.toLowerCase() !== this.#manifest.sha256.toLowerCase()) throw new Error("Update SHA-256 does not match manifest");
      await fs.writeFile(partial, buffer, { mode: 0o600 });
      await fs.rename(partial, installer);
      if (app.isPackaged && !await this.verifyAuthenticode(installer)) throw new Error("Installer Authenticode signature is invalid");
      this.#backupPath = await this.createBackup();
      this.#installerPath = installer;
      return this.set({
        status: "ready",
        progress: 100,
        availableVersion: this.#manifest.version,
        signatureVerified: true,
        backupReady: Boolean(this.#backupPath),
        message: "Đã xác minh hash/chữ ký và tạo backup. Nhấn cài đặt lần nữa để khởi động installer."
      });
    } catch (error) {
      this.options.logger.error("update.prepare_failed", error);
      return this.set({ status: "error", message: error instanceof Error ? error.message : "Chuẩn bị update thất bại." });
    }
  }

  async rollback(): Promise<void> {
    const backup = this.#backupPath ?? await this.findLatestBackup();
    if (!backup) throw new Error("Không có backup đã xác minh để rollback.");
    if (!app.isPackaged) throw new Error("Rollback binary chỉ khả dụng trong bản đã cài đặt.");
    const installDirectory = path.dirname(process.execPath);
    this.assertSafeInstallPath(installDirectory);
    const source = path.join(backup, "application");
    const backupManifest = JSON.parse(await fs.readFile(path.join(backup, "backup.json"), "utf8")) as { version?: unknown };
    if (typeof backupManifest.version !== "string" || !(await fs.stat(source)).isDirectory()) throw new Error("Backup manifest không hợp lệ.");
    const helperPath = path.join(this.options.dataDirectory, "updates", "rollback-helper.ps1");
    const helper = [
      "param([int]$ProcessId,[string]$Source,[string]$Target,[string]$Relaunch)",
      "$ErrorActionPreference = 'Stop'",
      "Wait-Process -Id $ProcessId -Timeout 60 -ErrorAction SilentlyContinue",
      "Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $Target -Recurse -Force",
      "Start-Process -FilePath $Relaunch -WindowStyle Hidden"
    ].join("\r\n");
    await fs.writeFile(helperPath, helper, { encoding: "utf8", mode: 0o600 });
    const child = spawn("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "RemoteSigned", "-File", helperPath,
      String(process.pid), source, installDirectory, process.execPath
    ], { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
    this.options.logger.info("update.rollback_started", { backupVersion: backupManifest.version });
    setImmediate(() => app.quit());
  }

  private set(patch: Omit<Partial<UpdateSnapshot>, "currentVersion">): UpdateSnapshot {
    this.#snapshot = { currentVersion: app.getVersion(), ...patch } as UpdateSnapshot;
    this.options.onStatus(this.snapshot);
    return this.snapshot;
  }

  private async verifyAuthenticode(filePath: string): Promise<boolean> {
    if (process.platform !== "win32") return false;
    const command = "$s = Get-AuthenticodeSignature -LiteralPath $args[0]; Write-Output $s.Status";
    try {
      const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command, filePath], {
        windowsHide: true,
        timeout: 20_000
      });
      return stdout.trim() === "Valid";
    } catch {
      return false;
    }
  }

  private async createBackup(): Promise<string | undefined> {
    if (!app.isPackaged) return undefined;
    const source = path.dirname(process.execPath);
    this.assertSafeInstallPath(source);
    const backup = path.join(this.options.dataDirectory, "update-backups", `${app.getVersion()}-${Date.now()}`);
    const target = path.join(backup, "application");
    await fs.mkdir(backup, { recursive: true });
    await fs.cp(source, target, { recursive: true, errorOnExist: true, force: false });
    await fs.writeFile(path.join(backup, "backup.json"), `${JSON.stringify({ version: app.getVersion(), source, createdAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
    return backup;
  }

  private assertSafeInstallPath(value: string): void {
    const resolved = path.resolve(value);
    const root = path.parse(resolved).root;
    if (resolved === root || resolved.length <= root.length + 3 || !path.isAbsolute(resolved)) throw new Error("Unsafe installation path");
  }

  private async findLatestBackup(): Promise<string | undefined> {
    const root = path.join(this.options.dataDirectory, "update-backups");
    const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
    return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(root, entry.name)).sort().at(-1);
  }
}

export const updateInternals = { isManifest, canonicalManifest, compareVersions };

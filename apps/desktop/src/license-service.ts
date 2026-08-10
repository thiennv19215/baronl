import { createPublicKey, randomUUID, verify } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppConfig } from "./app-config";
import type { StructuredLogger } from "./logger";
import type { SecretStore } from "./secret-store";

interface LicenseResponse {
  active: boolean;
  deviceId: string;
  expiresAt: string;
  offlineUntil: string;
  entitlement: string;
  signature: string;
}

interface LicenseServiceOptions {
  dataDirectory: string;
  getConfig: () => AppConfig;
  secrets: SecretStore;
  logger: StructuredLogger;
  appVersion: () => string;
  publicKey?: string;
}

function canonicalLicense(value: Omit<LicenseResponse, "signature">): string {
  return [value.active ? "1" : "0", value.deviceId, value.expiresAt, value.offlineUntil, value.entitlement].join("\n");
}

function isLicenseResponse(value: unknown): value is LicenseResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.active === "boolean" && ["deviceId", "expiresAt", "offlineUntil", "entitlement", "signature"]
    .every((key) => typeof record[key] === "string");
}

export class LicenseService {
  #deviceId?: string;

  constructor(private readonly options: LicenseServiceOptions) {}

  async status(): Promise<{ mode: "free" | "licensed" | "expired" | "invalid"; active: boolean; message: string }> {
    if (!this.options.getConfig().license.enabled) {
      return { mode: "free", active: true, message: "Module license đang tắt; ứng dụng chạy miễn phí." };
    }
    const token = await this.options.secrets.get("licenseToken");
    if (!token) return { mode: "invalid", active: false, message: "Chưa kích hoạt license." };
    try {
      const value = JSON.parse(token) as unknown;
      const verified = await this.verify(value);
      if (!verified) return { mode: "invalid", active: false, message: "Chữ ký license không hợp lệ." };
      if (Date.parse(verified.expiresAt) < Date.now()) {
        return { mode: "expired", active: false, message: "License đã hết hạn." };
      }
      if (Date.parse(verified.offlineUntil) < Date.now()) {
        return { mode: "expired", active: false, message: "Thời hạn sử dụng offline đã hết." };
      }
      return { mode: "licensed", active: true, message: `License ${verified.entitlement} còn hiệu lực.` };
    } catch {
      return { mode: "invalid", active: false, message: "Dữ liệu license không hợp lệ." };
    }
  }

  async activate(key: string): Promise<{ active: boolean; message: string }> {
    const config = this.options.getConfig().license;
    if (!config.enabled) return { active: true, message: "Module license đang tắt; OrbitStage chạy miễn phí." };
    if (!config.serverUrl) return { active: false, message: "Chưa cấu hình license server HTTPS." };
    let serverUrl: URL;
    try {
      serverUrl = new URL(config.serverUrl);
    } catch {
      return { active: false, message: "License server URL không hợp lệ." };
    }
    if (serverUrl.protocol !== "https:") return { active: false, message: "License server bắt buộc dùng HTTPS." };
    if (!this.options.publicKey) return { active: false, message: "Chưa cấu hình public key xác minh license." };
    if (!key.trim() || key.length > 512) return { active: false, message: "License key không hợp lệ." };
    const deviceId = await this.deviceId();
    const response = await fetch(`${serverUrl.toString().replace(/\/+$/, "")}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: key.trim(), deviceId, appVersion: this.options.appVersion() }),
      signal: AbortSignal.timeout(15_000),
      redirect: "error"
    });
    if (!response.ok) return { active: false, message: `License server trả về HTTP ${response.status}.` };
    const value = await response.json() as unknown;
    const verified = await this.verify(value);
    if (!verified || !verified.active) return { active: false, message: "Phản hồi license không hợp lệ hoặc không được cấp quyền." };
    if (Date.parse(verified.offlineUntil) > Date.now() + config.offlineGraceDays * 86_400_000 || Date.parse(verified.offlineUntil) > Date.parse(verified.expiresAt)) {
      return { active: false, message: "Offline policy trong phản hồi license vượt quá cấu hình dự án." };
    }
    await this.options.secrets.set("licenseToken", JSON.stringify(verified));
    this.options.logger.info("license.activated", { entitlement: verified.entitlement, expiresAt: verified.expiresAt });
    return { active: true, message: `Đã kích hoạt ${verified.entitlement}.` };
  }

  private async verify(value: unknown): Promise<LicenseResponse | undefined> {
    if (!isLicenseResponse(value) || value.deviceId !== await this.deviceId() || !this.options.publicKey) return undefined;
    const { signature, ...signed } = value;
    const valid = verify(null, Buffer.from(canonicalLicense(signed)), createPublicKey(this.options.publicKey), Buffer.from(signature, "base64"));
    if (!valid || !Number.isFinite(Date.parse(value.expiresAt)) || !Number.isFinite(Date.parse(value.offlineUntil))) return undefined;
    return value;
  }

  private async deviceId(): Promise<string> {
    if (this.#deviceId) return this.#deviceId;
    const filePath = path.join(this.options.dataDirectory, "device-id");
    try {
      const existing = (await fs.readFile(filePath, "utf8")).trim();
      if (/^[0-9a-f-]{36}$/i.test(existing)) return this.#deviceId = existing;
    } catch {
      // Create a privacy-preserving, app-scoped identity.
    }
    const created = randomUUID();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, created, { encoding: "utf8", mode: 0o600 });
    return this.#deviceId = created;
  }
}

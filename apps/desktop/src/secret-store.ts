import { promises as fs } from "node:fs";
import path from "node:path";
import { safeStorage } from "electron";
import type { SecretName } from "./app-config";

type SecretDocument = Partial<Record<SecretName, string>>;

export class SecretStore {
  readonly filePath: string;
  private readonly e2eSecrets = new Map<SecretName, string>();
  private readonly useEphemeralE2EStore = process.env.ORBITSTAGE_E2E === "1";

  constructor(dataDirectory: string) {
    this.filePath = path.join(dataDirectory, "secrets.enc.json");
  }

  async set(name: SecretName, value: string): Promise<void> {
    if (this.useEphemeralE2EStore) {
      if (value.length === 0) this.e2eSecrets.delete(name);
      else this.e2eSecrets.set(name, value);
      return;
    }
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Secure OS credential encryption is unavailable; the secret was not saved.");
    }
    const current = await this.readDocument();
    if (value.length === 0) {
      delete current[name];
    } else {
      current[name] = safeStorage.encryptString(value).toString("base64");
    }
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(current, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporary, this.filePath);
  }

  async get(name: SecretName): Promise<string | undefined> {
    if (this.useEphemeralE2EStore) return this.e2eSecrets.get(name);
    const encoded = (await this.readDocument())[name];
    if (!encoded || !safeStorage.isEncryptionAvailable()) return undefined;
    try {
      return safeStorage.decryptString(Buffer.from(encoded, "base64"));
    } catch {
      return undefined;
    }
  }

  async has(name: SecretName): Promise<boolean> {
    if (this.useEphemeralE2EStore) return this.e2eSecrets.has(name);
    return Boolean((await this.readDocument())[name]);
  }

  async status(): Promise<Record<SecretName, boolean>> {
    if (this.useEphemeralE2EStore) {
      return {
        aiApiKey: this.e2eSecrets.has("aiApiKey")
      };
    }
    const document = await this.readDocument();
    return {
      aiApiKey: Boolean(document.aiApiKey)
    };
  }

  private async readDocument(): Promise<SecretDocument> {
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, "utf8")) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return parsed as SecretDocument;
    } catch {
      return {};
    }
  }
}

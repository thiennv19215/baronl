import { promises as fs } from "node:fs";
import path from "node:path";
import { appConfigSchema, DEFAULT_CONFIG, mergeConfig, type AppConfig } from "./app-config";

export class ConfigStore {
  readonly configPath: string;
  readonly backupPath: string;
  #config: AppConfig = structuredClone(DEFAULT_CONFIG);

  constructor(readonly dataDirectory: string) {
    this.configPath = path.join(dataDirectory, "config.v1.json");
    this.backupPath = path.join(dataDirectory, "backups", "config.v1.previous.json");
  }

  get value(): AppConfig {
    return structuredClone(this.#config);
  }

  async load(): Promise<AppConfig> {
    await fs.mkdir(this.dataDirectory, { recursive: true });
    try {
      const raw = await fs.readFile(this.configPath, "utf8");
      this.#config = appConfigSchema.parse(JSON.parse(raw));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        await this.quarantineInvalidFile().catch(() => undefined);
      }
      this.#config = structuredClone(DEFAULT_CONFIG);
      await this.persist(this.#config, false);
    }
    return this.value;
  }

  async update(patch: unknown): Promise<AppConfig> {
    const next = mergeConfig(this.#config, patch);
    await this.persist(next, true);
    this.#config = next;
    return this.value;
  }

  async replace(value: unknown): Promise<AppConfig> {
    const next = appConfigSchema.parse(value);
    await this.persist(next, true);
    this.#config = next;
    return this.value;
  }

  async restoreBackup(): Promise<AppConfig> {
    const raw = await fs.readFile(this.backupPath, "utf8");
    return this.replace(JSON.parse(raw));
  }

  private async persist(value: AppConfig, createBackup: boolean): Promise<void> {
    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    const temporaryPath = `${this.configPath}.${process.pid}.tmp`;
    if (createBackup) {
      await fs.mkdir(path.dirname(this.backupPath), { recursive: true });
      await fs.copyFile(this.configPath, this.backupPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
    await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporaryPath, this.configPath);
  }

  private async quarantineInvalidFile(): Promise<void> {
    const quarantine = `${this.configPath}.invalid-${Date.now()}`;
    await fs.rename(this.configPath, quarantine);
  }
}

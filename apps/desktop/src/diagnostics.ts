import { app } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import type { AppConfig } from "./app-config";
import type { StructuredLogger } from "./logger";
import { redact } from "./logger";

interface DiagnosticContext {
  config: AppConfig;
  health: unknown;
  logger: StructuredLogger;
  outputDirectory: string;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function createDiagnosticBundle(context: DiagnosticContext): Promise<string> {
  const zip = new AdmZip();
  const createdAt = new Date();
  const metadata = redact({
    createdAt: createdAt.toISOString(),
    app: { name: app.getName(), version: app.getVersion(), packaged: app.isPackaged },
    runtime: {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
      architecture: process.arch,
      locale: app.getLocale()
    },
    health: context.health
  });
  const safeConfig = redact(context.config);
  const safeLog = (await context.logger.tail()).split("\n").map((line) => {
    if (!line.trim()) return "";
    try { return JSON.stringify(redact(JSON.parse(line))); } catch { return String(redact(line)); }
  }).join("\n");

  zip.addFile("metadata.json", Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`, "utf8"));
  zip.addFile("config-redacted.json", Buffer.from(`${JSON.stringify(safeConfig, null, 2)}\n`, "utf8"));
  zip.addFile("logs/orbitstage-redacted.jsonl", Buffer.from(safeLog, "utf8"));
  zip.addFile("README.txt", Buffer.from(
    "OrbitStage diagnostic bundle. Secret values are excluded or redacted. Review before sharing.\n",
    "utf8"
  ));

  await fs.mkdir(context.outputDirectory, { recursive: true });
  const name = sanitizeFileName(`diagnostics-${createdAt.toISOString().replaceAll(":", "-")}.zip`);
  const outputPath = path.join(context.outputDirectory, name);
  await new Promise<void>((resolve, reject) => {
    zip.writeZip(outputPath, (error) => error ? reject(error) : resolve());
  });
  return outputPath;
}

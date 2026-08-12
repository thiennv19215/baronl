import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG } from "@orbitstage/runtime";
import { createDiagnosticBundle } from "./diagnostics";
import type { StructuredLogger } from "./logger";

vi.mock("electron", () => ({
  app: {
    getName: () => "OrbitStage Live",
    getVersion: () => "1.0.0-test",
    getLocale: () => "vi",
    isPackaged: false
  }
}));

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("diagnostic bundle", () => {
  it("redacts a canary secret from config, health and JSONL logs", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "orbitstage-diagnostics-"));
    temporaryDirectories.push(directory);
    const canary = ["ORBITSTAGE", "CANARY", "SECRET", "e2e_value"].join("_");
    const logger = {
      tail: vi.fn().mockResolvedValue(JSON.stringify({ event: "test", apiKey: canary, nested: { token: canary } }))
    } as unknown as StructuredLogger;

    const bundle = await createDiagnosticBundle({
      config: {
        ...DEFAULT_CONFIG,
        ai: { ...DEFAULT_CONFIG.ai, endpoint: "https://api.example.test/v1" }
      },
      health: { canary, authorization: `Bearer ${canary}` },
      logger,
      outputDirectory: directory
    });

    expect((await readFile(bundle)).length).toBeGreaterThan(0);
    const zip = new AdmZip(bundle);
    const contents = zip.getEntries().map((entry) => entry.getData().toString("utf8")).join("\n");
    expect(contents).not.toContain(canary);
    expect(contents).toContain("[REDACTED]");
  });
});

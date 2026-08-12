import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_CONFIG } from "./app-config.js";
import { CULTIVATION_TITLES, LiveRuntime, normalizeViewerCommand, titleForLevel } from "./live-runtime.js";

describe("viewer command compatibility", () => {
  it.each([
    ["HEY", "hey"], ["QUAY", "quay"], ["CAM", "cam"], ["CHÚC mọi người", "chuc"],
    ["NHẢY", "nhay"], ["PARTY", "party"], ["TIM", "tim"], ["HELLO", "hello"]
  ])("normalizes the original command %s", (input, expected) => {
    expect(normalizeViewerCommand(input)).toBe(expected);
  });

  it.each([["MÁY", "cam"], ["VUI", "party"], ["CHÀO", "hello"], ["!LEVEL", "level"]])("keeps OrbitStage aliases for %s", (input, expected) => {
    expect(normalizeViewerCommand(input)).toBe(expected);
  });
});

describe("cultivation progression", () => {
  it("provides all 30 ordered titles from Phàm Nhân to Đạo Tổ", () => {
    expect(CULTIVATION_TITLES).toHaveLength(30);
    expect(titleForLevel(1)).toBe("Phàm Nhân");
    expect(titleForLevel(99)).toBe("Đạo Tổ");
    expect(new Set(CULTIVATION_TITLES).size).toBe(30);
  });

  it("restores viewer progress after a new runtime starts", async () => {
    const dataDirectory = await mkdtemp(path.join(tmpdir(), "orbitstage-progress-"));
    const makeRuntime = () => new LiveRuntime({ config: DEFAULT_CONFIG, dataDirectory, logger: { info: () => undefined, warn: () => undefined, error: () => undefined }, stageUrl: () => "http://127.0.0.1/stage", onEvent: () => undefined, onConfigPatch: async () => DEFAULT_CONFIG });
    try {
      const first = makeRuntime();
      await first.initialize();
      first.fake({ type: "gift", viewer: { id: "persistent-fan", name: "Fan Bền Vững" }, giftName: "Galaxy", giftCount: 2, diamonds: 50 });
      await new Promise((resolve) => setImmediate(resolve));
      await first.flushProgress();
      const second = makeRuntime();
      await second.initialize();
      expect((second.stageSnapshot() as { viewers: Record<string, { gifts: number; points: number }> }).viewers["persistent-fan"]).toMatchObject({ gifts: 100 });
      await second.flushProgress();
    } finally {
      await rm(dataDirectory, { recursive: true, force: true });
    }
  });
});

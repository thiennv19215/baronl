import { describe, expect, it } from "vitest";
import { appConfigSchema, DEFAULT_CONFIG, mergeConfig } from "./app-config.js";

describe("desktop app config", () => {
  it("starts in free mode with loopback-only services", () => {
    expect(DEFAULT_CONFIG.live.localPort).toBe(17_321);
    expect(DEFAULT_CONFIG.live.tikfinityUrl).toBe("ws://127.0.0.1:21213/");
  });

  it("deep-merges a validated section without resetting music", () => {
    const updated = mergeConfig(DEFAULT_CONFIG, { led: { text: "HELLO ORBIT" } });
    expect(updated.led.text).toBe("HELLO ORBIT");
    expect(updated.music.volume).toBe(DEFAULT_CONFIG.music.volume);
  });

  it("rejects a non-loopback TikFinity endpoint", () => {
    expect(() => mergeConfig(DEFAULT_CONFIG, { live: { tikfinityUrl: "ws://192.168.1.10:21213" } })).toThrow();
  });

  it("accepts a blank provider endpoint so provider defaults remain usable", () => {
    expect(appConfigSchema.parse({ ...DEFAULT_CONFIG, ai: { ...DEFAULT_CONFIG.ai, endpoint: "" } }).ai.endpoint).toBe("");
  });
});

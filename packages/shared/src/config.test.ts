import { describe, expect, it } from 'vitest';
import { AppConfigSchema, DEFAULT_APP_CONFIG, mergeAppConfig, sanitizeConfigForExport } from './config.js';

describe('app config', () => {
  it('deep-merges a patch and validates the result', () => {
    const updated = mergeAppConfig(DEFAULT_APP_CONFIG, {
      music: { volume: 0.25 },
      led: { text: 'Xin chào' },
    });

    expect(updated.music.volume).toBe(0.25);
    expect(updated.music.repeat).toBe('all');
    expect(updated.led.text).toBe('Xin chào');
  });

  it('never exports secret identifiers', () => {
    const withSecret = mergeAppConfig(DEFAULT_APP_CONFIG, {
      ai: { apiKeySecretId: 'safe-storage://ai' },
      tts: { apiKeySecretId: 'safe-storage://tts' },
    });
    const exported = sanitizeConfigForExport(withSecret) as unknown as Record<string, unknown>;

    expect(JSON.stringify(exported)).not.toContain('safe-storage');
  });

  it('pins TikFinity to loopback and rejects credentials embedded in provider URLs', () => {
    expect(() => mergeAppConfig(DEFAULT_APP_CONFIG, { tikfinity: { url: 'ws://192.168.1.20:21213/' } })).toThrow();
    expect(() => mergeAppConfig(DEFAULT_APP_CONFIG, { ai: { endpoint: 'https://api.example.test/v1?api_key=secret' } })).toThrow();
    expect(AppConfigSchema.parse(DEFAULT_APP_CONFIG).server.port).toBe(17_321);
  });
});

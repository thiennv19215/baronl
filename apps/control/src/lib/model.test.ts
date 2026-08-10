import { describe, expect, it } from 'vitest';
import { defaultConfig, formatUptime, mergeConfig, redactSecret } from './model';

describe('control model', () => {
  it('merges one config section without changing its siblings', () => {
    const next = mergeConfig(defaultConfig, { led: { text: 'HELLO' } });
    expect(next.led.text).toBe('HELLO');
    expect(next.led.speed).toBe(defaultConfig.led.speed);
    expect(next.live.localPort).toBe(defaultConfig.live.localPort);
  });

  it('redacts secret values', () => {
    expect(redactSecret('sk-1234567890')).toBe('sk-••••890');
    expect(redactSecret('tiny')).toBe('••••••••');
  });

  it('formats uptime safely', () => {
    expect(formatUptime(3660)).toBe('01:01');
    expect(formatUptime(-1)).toBe('00:00');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiService } from './ai-service';
import { DEFAULT_CONFIG, type AppConfig } from './app-config';
import { AutoHypeEngine } from './auto-hype';
import type { LiveEvent } from './live-runtime';
import type { StructuredLogger } from './logger';
import type { SpeechService } from './speech-service';

afterEach(() => vi.useRealTimers());

function harness(overrides: Partial<AppConfig['ai']> = {}) {
  const config: AppConfig = { ...DEFAULT_CONFIG, ai: { ...DEFAULT_CONFIG.ai, enabled: true, autoHype: false, liveTime: false, joinBatchSeconds: 2, ...overrides } };
  const generate = vi.fn<(prompt: string) => Promise<{ text: string; latencyMs: number }>>(async () => ({ text: 'Xin chào cả nhà!', latencyMs: 3 }));
  const enqueue = vi.fn<(text: string, source: 'mc' | 'dj' | 'test') => Promise<void>>(async () => undefined);
  const onCaption = vi.fn<(text: string, source: 'AI MC' | 'AI DJ') => void>();
  const engine = new AutoHypeEngine({
    getConfig: () => config,
    ai: { generate } as unknown as AiService,
    speech: { enqueue } as unknown as SpeechService,
    logger: { warn: vi.fn() } as unknown as StructuredLogger,
    onCaption,
  });
  return { engine, generate, enqueue, onCaption };
}

function event(type: LiveEvent['type'], name: string, extra: Partial<LiveEvent> = {}): LiveEvent {
  return { id: `${type}-${name}`, type, timestamp: new Date().toISOString(), source: 'fake', viewer: { id: name, name, level: 1, title: 'Phàm Nhân' }, ...extra };
}

describe('interactive MC/DJ orchestration', () => {
  it('batches joins into one MC greeting', async () => {
    vi.useFakeTimers();
    const { engine, generate, enqueue, onCaption } = harness();
    engine.handleEvent(event('join', 'An'));
    engine.handleEvent(event('join', 'Bình'));
    await vi.advanceTimersByTimeAsync(2_100);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate.mock.calls[0]?.[0]).toContain('An, Bình');
    expect(enqueue).toHaveBeenCalledWith('Xin chào cả nhà!', 'mc');
    expect(onCaption).toHaveBeenCalledWith('Xin chào cả nhà!', 'AI MC');
    engine.stop();
  });

  it('uses the MC gift-thanks intent for a super gift', async () => {
    const { engine, generate } = harness();
    engine.handleEvent(event('gift', 'LunaFan', { gift: { name: 'Galaxy', count: 2, diamonds: 800, super: true } }));
    await vi.waitFor(() => expect(generate).toHaveBeenCalledOnce());
    expect(generate.mock.calls[0]?.[0]).toContain('1600 kim cương');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { OpenAiTtsProvider, SpeechQueue, type SynthesizedSpeech, type TtsProvider } from './tts.js';

describe('TTS', () => {
  it('calls /v1/audio/speech with the documented defaults and 4096-character limit', async () => {
    let url = '';
    let body: Record<string, unknown> = {};
    const provider = new OpenAiTtsProvider({
      secretId: 'safe-storage://tts',
      secrets: { resolve: async () => 'test-secret' },
      fetch: (async (input: string | URL | Request, init?: RequestInit) => {
        url = String(input);
        body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      }) as typeof fetch,
    });
    const speech = await provider.synthesize('Xin chào');

    expect(url).toBe('https://api.openai.com/v1/audio/speech');
    expect(body).toMatchObject({ model: 'gpt-4o-mini-tts', voice: 'alloy', response_format: 'mp3', input: 'Xin chào' });
    expect(speech.mimeType).toBe('audio/mpeg');
    await expect(provider.synthesize('x'.repeat(4_097))).rejects.toMatchObject({ code: 'invalid-input' });
  });

  it('serializes the shared MC/DJ speech queue without overlapping playback', async () => {
    const generated: string[] = [];
    const played: string[] = [];
    let releaseFirst!: () => void;
    const firstPlayback = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const provider: TtsProvider = {
      id: 'edge',
      synthesize: vi.fn(async (text): Promise<SynthesizedSpeech> => {
        generated.push(text);
        return { audio: new Uint8Array([1]), mimeType: 'audio/mpeg', provider: 'edge', voice: 'vi-VN-HoaiMyNeural' };
      }),
    };
    const queue = new SpeechQueue({
      provider,
      player: async (_speech, request) => {
        played.push(request.id);
        if (request.id === 'mc-1') await firstPlayback;
      },
    });
    const one = queue.enqueue({ id: 'mc-1', text: 'MC speaks first', source: 'mc' });
    const two = queue.enqueue({ id: 'dj-1', text: 'DJ speaks second', source: 'dj' });
    await vi.waitFor(() => expect(played).toEqual(['mc-1']));
    expect(generated).toEqual(['MC speaks first']);
    releaseFirst();
    await Promise.all([one, two]);
    expect(played).toEqual(['mc-1', 'dj-1']);
    expect(queue.state.speaking).toBe(false);
  });
});

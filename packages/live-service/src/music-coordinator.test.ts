import { describe, expect, it } from 'vitest';
import { MusicCoordinator } from './music-coordinator.js';

describe('MusicCoordinator', () => {
  it('enforces one audio owner and preserves music across stage reloads', () => {
    const music = new MusicCoordinator();
    music.setPlaylist([
      { id: 'one', title: 'One', source: 'asset://one.mp3', durationSeconds: 120 },
      { id: 'two', title: 'Two', source: 'asset://two.mp3' },
    ]);
    expect(music.claimAudioOwner('stage-window')).toBe(true);
    expect(music.claimAudioOwner('control-window')).toBe(false);
    music.dispatch({ type: 'play' });
    music.reportPosition('stage-window', 42);
    music.releaseAudioOwner('stage-window');

    expect(music.claimAudioOwner('stage-window')).toBe(true);
    expect(music.state).toMatchObject({ status: 'playing', currentTrackId: 'one', positionSeconds: 42 });
    music.dispatch({ type: 'next' });
    expect(music.state).toMatchObject({ currentTrackId: 'two', positionSeconds: 0 });
  });
});

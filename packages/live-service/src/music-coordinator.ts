export interface MusicTrack {
  id: string;
  title: string;
  source: string;
  artist?: string;
  durationSeconds?: number;
}

export type RepeatMode = 'off' | 'one' | 'all';
export type PlaybackStatus = 'stopped' | 'playing' | 'paused';

export interface MusicState {
  playlist: readonly MusicTrack[];
  currentTrackId: string | null;
  currentIndex: number;
  positionSeconds: number;
  status: PlaybackStatus;
  volume: number;
  repeat: RepeatMode;
  shuffle: boolean;
  audioOwnerId: string | null;
  revision: number;
}

export type MusicCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'seek'; positionSeconds: number }
  | { type: 'volume'; volume: number }
  | { type: 'repeat'; repeat: RepeatMode }
  | { type: 'shuffle'; shuffle: boolean };

export interface MusicCoordinatorOptions {
  volume?: number;
  repeat?: RepeatMode;
  shuffle?: boolean;
  random?: () => number;
  onListenerError?: (error: unknown) => void;
}

export class MusicCoordinator {
  private readonly listeners = new Set<(state: MusicState) => void>();
  private readonly random: () => number;
  private readonly onListenerError?: (error: unknown) => void;
  private stateValue: MusicState;

  public constructor(options: MusicCoordinatorOptions = {}) {
    const volume = options.volume ?? 0.65;
    if (volume < 0 || volume > 1) throw new RangeError('volume must be between 0 and 1');
    this.random = options.random ?? Math.random;
    this.onListenerError = options.onListenerError;
    this.stateValue = {
      playlist: [],
      currentTrackId: null,
      currentIndex: -1,
      positionSeconds: 0,
      status: 'stopped',
      volume,
      repeat: options.repeat ?? 'all',
      shuffle: options.shuffle ?? false,
      audioOwnerId: null,
      revision: 0,
    };
  }

  public get state(): MusicState {
    return structuredClone(this.stateValue);
  }

  /** Only one renderer/output may own audio. Reclaiming with the same id preserves playback position. */
  public claimAudioOwner(ownerId: string, force = false): boolean {
    if (!ownerId.trim()) throw new TypeError('ownerId is required');
    const current = this.stateValue.audioOwnerId;
    if (current && current !== ownerId && !force) return false;
    if (current !== ownerId) this.patch({ audioOwnerId: ownerId });
    return true;
  }

  public releaseAudioOwner(ownerId: string): boolean {
    if (this.stateValue.audioOwnerId !== ownerId) return false;
    this.patch({ audioOwnerId: null });
    return true;
  }

  public setPlaylist(tracks: readonly MusicTrack[]): MusicState {
    const seen = new Set<string>();
    const playlist = tracks.map((track) => {
      if (!track.id.trim() || !track.title.trim() || !track.source.trim()) throw new TypeError('Invalid music track');
      if (seen.has(track.id)) throw new TypeError(`Duplicate music track id: ${track.id}`);
      if (track.durationSeconds !== undefined && track.durationSeconds < 0) throw new RangeError('Track duration cannot be negative');
      seen.add(track.id);
      return structuredClone(track);
    });
    const previousId = this.stateValue.currentTrackId;
    const preservedIndex = previousId ? playlist.findIndex((track) => track.id === previousId) : -1;
    const currentIndex = preservedIndex >= 0 ? preservedIndex : playlist.length > 0 ? 0 : -1;
    this.patch({
      playlist,
      currentIndex,
      currentTrackId: currentIndex >= 0 ? playlist[currentIndex]?.id ?? null : null,
      positionSeconds: preservedIndex >= 0 ? this.stateValue.positionSeconds : 0,
      status: playlist.length === 0 ? 'stopped' : this.stateValue.status,
    });
    return this.state;
  }

  public dispatch(command: MusicCommand): MusicState {
    switch (command.type) {
      case 'play':
        if (this.stateValue.playlist.length > 0) this.patch({ status: 'playing' });
        break;
      case 'pause':
        if (this.stateValue.status === 'playing') this.patch({ status: 'paused' });
        break;
      case 'stop':
        this.patch({ status: 'stopped', positionSeconds: 0 });
        break;
      case 'seek':
        if (!Number.isFinite(command.positionSeconds) || command.positionSeconds < 0) throw new RangeError('Invalid seek position');
        this.patch({ positionSeconds: this.clampPosition(command.positionSeconds) });
        break;
      case 'volume':
        if (!Number.isFinite(command.volume) || command.volume < 0 || command.volume > 1) throw new RangeError('Invalid volume');
        this.patch({ volume: command.volume });
        break;
      case 'repeat':
        this.patch({ repeat: command.repeat });
        break;
      case 'shuffle':
        this.patch({ shuffle: command.shuffle });
        break;
      case 'next':
        this.move(1, false);
        break;
      case 'previous':
        if (this.stateValue.positionSeconds > 3) this.patch({ positionSeconds: 0 });
        else this.move(-1, false);
        break;
    }
    return this.state;
  }

  /** Called by the audio owner; does not emit unless the displayed second changed. */
  public reportPosition(ownerId: string, positionSeconds: number): boolean {
    if (this.stateValue.audioOwnerId !== ownerId || !Number.isFinite(positionSeconds) || positionSeconds < 0) return false;
    const next = this.clampPosition(positionSeconds);
    if (Math.floor(next) !== Math.floor(this.stateValue.positionSeconds)) this.patch({ positionSeconds: next });
    else this.stateValue = { ...this.stateValue, positionSeconds: next };
    return true;
  }

  public reportEnded(ownerId: string): boolean {
    if (this.stateValue.audioOwnerId !== ownerId) return false;
    if (this.stateValue.repeat === 'one') this.patch({ positionSeconds: 0, status: 'playing' });
    else this.move(1, true);
    return true;
  }

  public subscribe(listener: (state: MusicState) => void, emitCurrent = true): () => void {
    this.listeners.add(listener);
    if (emitCurrent) listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private move(delta: 1 | -1, fromEnded: boolean): void {
    const { playlist, currentIndex, shuffle, repeat } = this.stateValue;
    if (playlist.length === 0) return;
    let nextIndex: number;
    if (shuffle && playlist.length > 1) {
      do nextIndex = Math.floor(this.random() * playlist.length);
      while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + delta;
      if (nextIndex >= playlist.length || nextIndex < 0) {
        if (repeat === 'all' || !fromEnded) nextIndex = (nextIndex + playlist.length) % playlist.length;
        else {
          this.patch({ status: 'stopped', positionSeconds: 0 });
          return;
        }
      }
    }
    this.patch({
      currentIndex: nextIndex,
      currentTrackId: playlist[nextIndex]?.id ?? null,
      positionSeconds: 0,
    });
  }

  private clampPosition(position: number): number {
    const duration = this.stateValue.playlist[this.stateValue.currentIndex]?.durationSeconds;
    return duration === undefined ? position : Math.min(position, duration);
  }

  private patch(patch: Partial<MusicState>): void {
    this.stateValue = { ...this.stateValue, ...patch, revision: this.stateValue.revision + 1 };
    const snapshot = this.state;
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (error) {
        this.onListenerError?.(error);
      }
    }
  }
}

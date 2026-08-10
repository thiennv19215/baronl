import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getWebSocketUrl, initials, initialStageState, normalizeEnvelope, stageReducer } from './stageState';
import { ThreeStage } from './ThreeStage';
import { Live2DHost } from './Live2DHost';
import type { GiftEffect, StageAction, StageConnection, StageEventEnvelope, StageState, StageViewer } from './types';

const params = new URLSearchParams(window.location.search);
const demoMode = params.get('demo') === '1';
const forceTransparent = params.get('transparent') === '1';
const requestedQuality = params.get('quality');

function useStageTransport(dispatch: React.Dispatch<StageAction>, onEvent: (event: StageEventEnvelope) => void) {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const eventHandlerRef = useRef(onEvent);
  eventHandlerRef.current = onEvent;

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | undefined;
    let retryTimer: number | undefined;
    let attempt = 0;
    const wsUrl = getWebSocketUrl(window.location);
    const facade = window.orbitStage;
    const useFacadeTransport = Boolean(facade) && params.get('transport') !== 'ws';

    const handleMessage = (raw: unknown) => {
      if (Array.isArray(raw)) {
        raw.forEach((event) => { eventHandlerRef.current(event as StageEventEnvelope); dispatchRef.current({ type: 'event', event: event as StageEventEnvelope }); });
        return;
      }
      if (raw && typeof raw === 'object' && Array.isArray((raw as { events?: unknown[] }).events)) {
        (raw as { events: StageEventEnvelope[] }).events.forEach((event) => { eventHandlerRef.current(event); dispatchRef.current({ type: 'event', event }); });
        return;
      }
      eventHandlerRef.current(raw as StageEventEnvelope);
      dispatchRef.current({ type: 'event', event: raw as StageEventEnvelope });
    };

    const scheduleReconnect = () => {
      if (disposed || params.get('reconnect') === '0') return;
      const delay = Math.min(12_000, 700 * 2 ** Math.min(attempt, 5)) + Math.round(Math.random() * 280);
      attempt += 1;
      dispatchRef.current({ type: 'connection', connection: 'reconnecting' });
      retryTimer = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;
      dispatchRef.current({ type: 'connection', connection: attempt ? 'reconnecting' : 'connecting' });
      try {
        socket = new WebSocket(wsUrl);
        socket.addEventListener('open', () => {
          attempt = 0;
          dispatchRef.current({ type: 'connection', connection: 'connected' });
          socket?.send(JSON.stringify({ type: 'stage:hello', payload: { version: 1, client: 'obs-stage' } }));
        });
        socket.addEventListener('message', (message) => {
          try { handleMessage(JSON.parse(String(message.data))); }
          catch { /* Ignore malformed or non-JSON frames. */ }
        });
        socket.addEventListener('close', scheduleReconnect);
        socket.addEventListener('error', () => {
          dispatchRef.current({ type: 'connection', connection: 'error' });
          socket?.close();
        });
      } catch {
        scheduleReconnect();
      }
    };

    if (!useFacadeTransport && params.get('transport') !== 'ipc') connect();
    if (useFacadeTransport) dispatchRef.current({ type: 'connection', connection: 'connected' });

    const snapshotPromise = useFacadeTransport
      ? (facade?.getStageSnapshot?.() ?? facade?.invoke?.('stage:get-snapshot'))
      : undefined;
    if (snapshotPromise) {
      void snapshotPromise.then((snapshot) => {
        if (!disposed && snapshot && typeof snapshot === 'object') {
          const { connection: _tikfinityConnection, ...stageSnapshot } = snapshot as Partial<StageState>;
          dispatchRef.current({ type: 'hydrate', state: stageSnapshot });
        }
      }).catch(() => undefined);
    }
    const disposeFacade = useFacadeTransport
      ? (facade?.subscribe?.(handleMessage) ?? facade?.on?.('stage:event', handleMessage) ?? (() => undefined))
      : (() => undefined);

    return () => {
      disposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.removeEventListener('close', scheduleReconnect);
      socket?.close();
      disposeFacade();
    };
  }, []);
}

function useSpeechAudio(ownerFromState: boolean | undefined) {
  const ownerRef = useRef(params.get('audio') === '1' || ownerFromState === true);
  const queueRef = useRef<{ source: string; volume: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement>();
  const pumpRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    ownerRef.current = params.get('audio') === '1' || ownerFromState === true;
    if (!ownerRef.current && audioRef.current) {
      queueRef.current = [];
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
  }, [ownerFromState]);
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    const pump = () => {
      if (!ownerRef.current || !audio.paused || audio.src) return;
      const next = queueRef.current.shift();
      if (!next) return;
      audio.volume = next.volume;
      audio.src = next.source;
      void audio.play().catch(() => { audio.removeAttribute('src'); audio.load(); pump(); });
    };
    const release = () => { audio.removeAttribute('src'); audio.load(); pump(); };
    pumpRef.current = pump;
    audio.addEventListener('ended', release);
    audio.addEventListener('error', release);
    return () => {
      queueRef.current = [];
      audio.pause();
      audio.removeEventListener('ended', release);
      audio.removeEventListener('error', release);
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = undefined;
    };
  }, []);

  return useCallback((event: StageEventEnvelope) => {
    const normalized = normalizeEnvelope(event);
    if (normalized.type === 'audio_owner') {
      ownerRef.current = params.get('audio') === '1' || normalized.payload.owner === true || normalized.payload.owner === 'stage' || normalized.payload.stage === true;
      if (ownerRef.current) pumpRef.current();
      else if (audioRef.current) { queueRef.current = []; audioRef.current.pause(); audioRef.current.removeAttribute('src'); audioRef.current.load(); }
      return;
    }
    if (normalized.type !== 'tts_audio' || !ownerRef.current) return;
    const source = String(normalized.payload.dataUrl ?? normalized.payload.url ?? '');
    if (!/^(data:audio\/|blob:|https?:\/\/|file:)/i.test(source)) return;
    const rawVolume = Number(normalized.payload.volume ?? 1);
    const volume = rawVolume > 1 ? rawVolume / 100 : rawVolume;
    queueRef.current.push({ source, volume: Math.max(0, Math.min(1, volume)) });
    pumpRef.current();
  }, []);
}

function useDemoEvents(dispatch: React.Dispatch<StageAction>) {
  useEffect(() => {
    if (!demoMode) return;
    const now = Date.now();
    dispatch({ type: 'hydrate', state: { live: true, viewerCount: 2847, connection: 'connected', music: { title: 'Cosmic Bloom', artist: 'OrbitStage library', playing: true, volume: 68 } } });
    const seed: StageEventEnvelope[] = [
      { type: 'gift', timestamp: now - 2500, payload: { userId: 'luna', nickname: 'Luna Phạm', level: 28, giftName: 'Galaxy Bloom', count: 3, diamonds: 1497, message: 'Chúc sân khấu bùng nổ tối nay! ✨', badge: 'Tinh tú' } },
      { type: 'chat', timestamp: now - 1700, payload: { userId: 'minhanh', nickname: 'Minh Anh', level: 16, comment: 'Nhạc hay quá OrbitStage ơi!' } },
      { type: 'follow', timestamp: now - 900, payload: { userId: 'sky', nickname: 'Sky Nguyễn', level: 9 } },
      { type: 'gift', timestamp: now - 300, payload: { userId: 'kai', nickname: 'Kai Trần', level: 21, giftName: 'Sao Băng', count: 8, diamonds: 792 } },
    ];
    seed.forEach((event) => dispatch({ type: 'event', event }));

    const demoEvents: StageEventEnvelope[] = [
      { type: 'join', payload: { userId: 'mie', nickname: 'Mie vừa tới', level: 7 } },
      { type: 'chat', payload: { userId: 'minhanh', nickname: 'Minh Anh', level: 16, comment: 'Cho mình xin bài tiếp theo nhé 🎵' } },
      { type: 'like', payload: { userId: 'sky', nickname: 'Sky Nguyễn', count: 120 } },
      { type: 'gift', payload: { userId: 'luna', nickname: 'Luna Phạm', level: 28, giftName: 'Nebula Heart', count: 1, diamonds: 1999, message: 'Gửi cả vũ trụ tới mọi người!' } },
      { type: 'speech_start', payload: { host: 'a', text: 'Cảm ơn món quà tuyệt vời!', durationMs: 5000 } },
    ];
    let index = 0;
    const interval = window.setInterval(() => {
      dispatch({ type: 'event', event: { ...demoEvents[index % demoEvents.length], timestamp: Date.now() } });
      index += 1;
    }, 5200);
    return () => window.clearInterval(interval);
  }, [dispatch]);
}

function safeMediaSource(source: string): string | undefined {
  if (!source) return undefined;
  if (/^[a-z]:[\\/]/i.test(source)) return `file:///${source.replaceAll('\\', '/')}`;
  return /^(https?:|file:|blob:|data:|\/|\.\/)/i.test(source) ? source : undefined;
}

function App() {
  const [audioEnergy, setAudioEnergy] = useState(0);
  const [hostsSwapped, setHostsSwapped] = useState(false);
  const [state, dispatch] = useReducer(stageReducer, initialStageState, (initial) => {
    const quality = requestedQuality === 'low' || requestedQuality === 'high' || requestedQuality === 'balanced' ? requestedQuality : initial.appearance.effectQuality;
    return { ...initial, appearance: { ...initial.appearance, transparent: forceTransparent || initial.appearance.transparent, effectQuality: quality } };
  });
  const handleAudioEvent = useSpeechAudio(state.audioOwner);
  useStageTransport(dispatch, handleAudioEvent);
  useDemoEvents(dispatch);

  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'expire', now: Date.now() }), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    setHostsSwapped(false);
    if (!state.characters.shuffle) return;
    const timer = window.setInterval(() => setHostsSwapped((current) => !current), 600_000);
    return () => window.clearInterval(timer);
  }, [state.characters.shuffle]);

  const leaders = useMemo(() => state.leaderboard.map((id) => state.viewers[id]).filter(Boolean), [state.leaderboard, state.viewers]);
  const currentGift = state.gifts[state.gifts.length - 1];
  const latestChat = state.chats[state.chats.length - 1];
  const backgroundSource = safeMediaSource(state.appearance.backgroundSource);
  const backgroundStyle = state.appearance.backgroundType === 'image' && backgroundSource ? { backgroundImage: `url("${backgroundSource.replaceAll('"', '%22')}")` } : undefined;
  const quality = state.appearance.effectQuality;
  const activeCommand = state.stageCommand?.until && state.stageCommand.until > Date.now() ? state.stageCommand.name : undefined;
  const commandViewerId = activeCommand ? state.stageCommand?.viewerId : undefined;
  const commandFocusX = commandViewerId ? ((stableHash(commandViewerId) % 1000) / 999 - .5) * 8 : 0;
  const dismissWish = useCallback((id: string) => {
    dispatch({ type: 'event', event: { type: 'wish:remove', payload: { id } } });
    const facade = window.orbitStage;
    const request = facade?.removeWish
      ? facade.removeWish(id)
      : facade?.invoke?.('wish:remove', { id });
    void request?.catch(() => undefined);
  }, []);

  return <main className={`stage-viewport quality-${quality} ${state.appearance.transparent ? 'transparent' : ''}`}>
    <section className={`stage theme-${state.appearance.theme} ${state.appearance.threeDEnabled ? 'dance-floor-mode' : ''}`} style={backgroundStyle} aria-label="Sân khấu OrbitStage LIVE">
      {state.appearance.backgroundType === 'video' && backgroundSource && <video className="stage-video" src={backgroundSource} autoPlay muted loop playsInline/>}
      {state.appearance.threeDEnabled && <ThreeStage quality={quality} live={state.live} musicPlaying={state.music.playing} audioEnergy={audioEnergy} speaking={Boolean(state.speech)} theme={state.appearance.theme} command={activeCommand} focusX={commandFocusX} leaderCount={Math.min(3, leaders.length)} giftActive={Boolean(currentGift && Date.now() - currentGift.createdAt < 7000)} settings={{ cameraMode: state.appearance.cameraMode, floorBright: state.appearance.floorBright, lasers: state.appearance.lasers, ledScreens: state.appearance.ledScreens, topPodiums: state.appearance.topPodiums }}/>}
      {state.appearance.threeDEnabled && <DanceFloorActors viewers={Object.values(state.viewers)} command={activeCommand} spotlightViewerId={state.eventFx?.viewerId} settings={state.appearance}/>}
      {state.appearance.commandBoardEnabled && <ViewerCommandBoard toggles={state.appearance.commandToggles} active={activeCommand}/>}
      {state.eventFx && <StageEventFx effect={state.eventFx}/>}
      <div className="stage-vignette"/>
      <div className="nebula-cloud cloud-a"/><div className="nebula-cloud cloud-b"/>
      {quality !== 'low' && <StarField quality={quality}/>} 
      <OrbitRings/>

      <header className="stage-header">
        <div className="stage-brand"><div className="stage-logo"><i/><i/><b/></div><div><strong>ORBITSTAGE</strong><span>LIVE EXPERIENCE</span></div></div>
        <div className="live-status"><i className={state.live ? 'active' : ''}/><span>{state.live ? 'LIVE' : 'STANDBY'}</span><b>{state.viewerCount.toLocaleString('vi-VN')}</b><small>người xem</small></div>
      </header>

      {state.led.enabled && <div className={`stage-led ${state.led.style}`} style={{ '--led-color': state.led.color, '--led-glow': state.led.glowColor, '--led-duration': `${Math.max(7, 66 - state.led.speed)}s` } as React.CSSProperties}><div className="led-pixels"/><div className="stage-led-track"><span>{state.led.text}</span><i>✦</i><span>{state.led.text}</span><i>✦</i></div></div>}

      <div className="stage-content">
        {state.appearance.showLeaderboard && <Leaderboard viewers={leaders}/>} 
        <div className="like-counter"><span>♥</span><b>{compactNumber(state.sessionLikes)}</b></div>

      {currentGift && <GiftCelebration gift={currentGift} showWish={state.appearance.showWishes} onDismissWish={dismissWish}/>}
      {state.levelUp && <LevelUpCelebration levelUp={state.levelUp}/>}

        {state.characters.enabled && <div className={`hosts ${state.characters.dualHost ? 'dual' : 'single'} ${hostsSwapped ? 'swapped' : ''}`}>
          <Character name={state.characters.hostA} role="MC" variant="nova" speaking={state.characters.lipSync && state.speech?.host === 'a'} blink={state.characters.blink} action={state.characterAction?.name}/>
          {state.characters.dualHost && <Character name={state.characters.hostB} role="DJ" variant="echo" speaking={state.characters.lipSync && state.speech?.host === 'b'} blink={state.characters.blink} action={state.characterAction?.name}/>} 
        </div>}

        {state.appearance.showChat && <ChatStack items={state.chats} avatarStyle={state.appearance.avatarStyle}/>} 
        {latestChat?.kind === 'join' && <div key={latestChat.id} className="join-ribbon"><Avatar viewer={latestChat.viewer} style={state.appearance.avatarStyle}/><span><b>{latestChat.viewer.name}</b> đã tham gia quỹ đạo</span></div>}
      </div>

      <footer className="stage-footer">
        <div className={`music-now ${state.music.playing ? 'playing' : ''}`}><div className="music-disc"><i/><span>♫</span></div><p><small>NOW PLAYING</small><strong>{state.music.title}</strong><span>{state.music.artist}</span></p><div className="equalizer">{Array.from({ length: 8 }, (_, index) => <i key={index}/>)}</div></div>
        <div className="powered">POWERED BY <b>ORBITSTAGE</b></div>
      </footer>

      {state.aiCaption && <div className="ai-caption"><span>✦</span><p><small>{state.aiCaption.source || 'AI MC'}</small><strong>{state.aiCaption.text}</strong></p></div>}

      <MusicAudio music={state.music} owner={params.get('audio') === '1' || state.audioOwner === true} onEnergy={setAudioEnergy}/>

      {state.connection !== 'connected' && <ConnectionNotice state={state.connection}/>} 
    </section>
  </main>;
}

function MusicAudio({ music, owner, onEnergy }: { music: StageState['music']; owner: boolean; onEnergy: (energy: number) => void }) {
  const deckARef = useRef<HTMLAudioElement>(null);
  const deckBRef = useRef<HTMLAudioElement>(null);
  const graphRef = useRef<{ context: AudioContext; analyser: AnalyserNode; master: GainNode; gains: [GainNode, GainNode] } | null>(null);
  const activeDeckRef = useRef(0);
  const deckSourcesRef = useRef<[string, string]>(['', '']);
  const pauseTimerRef = useRef<number>();
  const beatSensitivityRef = useRef(music.beatSensitivity ?? 1.4);
  beatSensitivityRef.current = music.beatSensitivity ?? 1.4;
  useEffect(() => {
    const deckA = deckARef.current;
    const deckB = deckBRef.current;
    if (!deckA || !deckB || !owner) { onEnergy(0); return; }
    const decks: [HTMLAudioElement, HTMLAudioElement] = [deckA, deckB];
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = .82;
    const master = context.createGain();
    const gains = [context.createGain(), context.createGain()] as [GainNode, GainNode];
    decks.forEach((deck, index) => context.createMediaElementSource(deck).connect(gains[index]));
    gains.forEach((gain) => gain.connect(analyser));
    analyser.connect(master);
    master.connect(context.destination);
    gains[0].gain.value = 1;
    gains[1].gain.value = 0;
    graphRef.current = { context, analyser, master, gains };
    const bins = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    let lastUpdate = 0;
    const sample = (now: number) => {
      analyser.getByteFrequencyData(bins);
      if (now - lastUpdate > 80) {
        let total = 0;
        const audibleBins = Math.ceil(bins.length * .58);
        for (let index = 0; index < audibleBins; index += 1) total += bins[index] ?? 0;
        onEnergy(Math.min(1, (total / audibleBins / 255) * 2.15 * beatSensitivityRef.current));
        lastUpdate = now;
      }
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    return () => {
      cancelAnimationFrame(frame);
      analyser.disconnect();
      gains.forEach((gain) => gain.disconnect());
      master.disconnect();
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
      graphRef.current = null;
      void context.close();
      onEnergy(0);
    };
  }, [onEnergy, owner]);
  useEffect(() => {
    const deckA = deckARef.current;
    const deckB = deckBRef.current;
    const graph = graphRef.current;
    if (!deckA || !deckB || !graph) return;
    const decks: [HTMLAudioElement, HTMLAudioElement] = [deckA, deckB];
    const now = graph.context.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.setTargetAtTime(Math.max(0, Math.min(1, music.volume / 100)), now, .04);
    const source = safeMediaSource(music.source ?? '') ?? '';
    if (!owner || !music.playing || !source) {
      decks.forEach((deck) => deck.pause());
      return;
    }
    void graph.context.resume();
    const active = activeDeckRef.current;
    if (deckSourcesRef.current[active] === source) {
      void decks[active].play().catch(() => undefined);
      return;
    }
    const next = deckSourcesRef.current[active] ? 1 - active : active;
    const nextDeck = decks[next];
    const previousDeck = decks[active];
    deckSourcesRef.current[next] = source;
    nextDeck.src = source;
    nextDeck.currentTime = 0;
    nextDeck.load();
    const seconds = Math.max(0, Math.min(8, music.crossfadeSeconds ?? 1.5));
    graph.gains[next].gain.cancelScheduledValues(now);
    graph.gains[active].gain.cancelScheduledValues(now);
    graph.gains[next].gain.setValueAtTime(seconds > 0 ? 0 : 1, now);
    graph.gains[next].gain.linearRampToValueAtTime(1, now + seconds);
    if (next !== active) {
      graph.gains[active].gain.setValueAtTime(graph.gains[active].gain.value, now);
      graph.gains[active].gain.linearRampToValueAtTime(0, now + seconds);
    }
    activeDeckRef.current = next;
    void nextDeck.play().catch(() => undefined);
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    if (next !== active) pauseTimerRef.current = window.setTimeout(() => previousDeck.pause(), seconds * 1_000 + 120);
  }, [music.crossfadeSeconds, music.playing, music.source, music.volume, owner]);
  const handleEnded = (index: number) => {
    if (index !== activeDeckRef.current || !owner) return;
    if ((music.playlist?.length ?? 0) > 1) void window.orbitStage?.invoke?.('music:ended');
    else {
      const deck = index === 0 ? deckARef.current : deckBRef.current;
      if (deck) { deck.currentTime = 0; void deck.play().catch(() => undefined); }
    }
  };
  return <div className="music-audio-decks" data-audio-owner={owner ? 'stage' : 'main'}><audio ref={deckARef} preload="auto" onEnded={() => handleEnded(0)}/><audio ref={deckBRef} preload="auto" onEnded={() => handleEnded(1)}/></div>;
}

function StarField({ quality }: { quality: 'balanced' | 'high' }) {
  const count = quality === 'high' ? 54 : 30;
  const stars = useMemo(() => Array.from({ length: count }, (_, index) => ({
    left: (index * 37 + 11) % 100,
    top: (index * 61 + 7) % 91,
    size: 1 + (index % 4) * .55,
    delay: (index % 9) * -.43,
    duration: 2.3 + (index % 7) * .37,
  })), [count]);
  return <div className="star-field">{stars.map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, width: `${star.size}px`, height: `${star.size}px`, animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` }}/>)}</div>;
}

function OrbitRings() { return <div className="orbit-rings"><i/><i/><i/><span/></div>; }

const danceSprites = [34, 17, 8, 20, 17, 17, 6, 10, 17, 17, 17, 17, 17, 17] as const;
const cultivationBadgeFiles = [
  'lv01-pham-nhan', 'lv02-luyen-the', 'lv03-tu-khi', 'lv04-luyen-khi', 'lv05-truc-co', 'lv06-khai-quang', 'lv07-dung-hop', 'lv08-tam-dong', 'lv09-linh-tich', 'lv10-kim-dan',
  'lv11-nguyen-anh', 'lv12-xuat-khieu', 'lv13-phan-than', 'lv14-hoa-than', 'lv15-luyen-hu', 'lv16-hop-the', 'lv17-dai-thua', 'lv18-do-kiep', 'lv19-phi-thang', 'lv20-nhan-tien',
  'lv21-dia-tien', 'lv22-thien-tien', 'lv23-huyen-tien', 'lv24-kim-tien', 'lv25-thai-at-kim-tien', 'lv26-dai-la-kim-tien', 'lv27-tien-vuong', 'lv28-tien-ton', 'lv29-tien-de', 'lv30-dao-to',
] as const;
const projectAssetRoot = window.location.port === '5174' ? '' : '/project-assets';

function cultivationBadgeSource(level: number): string {
  const index = Math.min(cultivationBadgeFiles.length - 1, Math.floor((Math.max(1, level) - 1) * cultivationBadgeFiles.length / 99));
  return `${projectAssetRoot}/cultivation-titles/${cultivationBadgeFiles[index]}.png`;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function DanceFloorActors({ viewers, command, spotlightViewerId, settings }: { viewers: StageViewer[]; command?: string; spotlightViewerId?: string; settings: StageState['appearance'] }) {
  const actors = useMemo(() => {
    const maxActors = Math.max(8, Math.min(80, settings.maxFloorActors));
    const ranked = [...viewers].sort((a, b) => b.gifts - a.gifts || b.points - a.points || b.likes - a.likes);
    const preferred = [...ranked.slice(0, Math.min(10, maxActors)), ...[...viewers].reverse()];
    const selectedIds = new Set(preferred.slice(0, maxActors).map((viewer) => viewer.id));
    const selected = viewers.filter((viewer) => selectedIds.has(viewer.id));
    const count = selected.length;
    const columns = settings.autoFitCrowd ? Math.max(3, Math.min(8, Math.ceil(Math.sqrt(Math.max(1, count) * 1.35)))) : 5;
    const rows = Math.max(1, Math.ceil(count / columns));
    const density = settings.autoFitCrowd ? count <= 10 ? 1.1 : count <= 24 ? .92 : count <= 40 ? .76 : .64 : 1;
    const vipRanks = new Map(ranked.filter((viewer) => viewer.gifts > 0 || viewer.points > 0 || viewer.likes > 0).slice(0, 3).map((viewer, index) => [viewer.id, index + 1]));
    return selected.map((viewer, index) => {
    const hash = stableHash(viewer.id);
    const spriteIndex = hash % danceSprites.length;
    const row = Math.floor(index / columns);
    const column = index % columns;
    const rowCount = row === rows - 1 ? count - row * columns : columns;
    const centeredColumn = column + (columns - rowCount) / 2;
    const jitterX = settings.autoFitCrowd ? (((hash >>> 8) % 7) - 3) * Math.max(.35, 1 - count / 80) : ((hash >>> 8) % 13) - 6;
    const jitterY = settings.autoFitCrowd ? (((hash >>> 16) % 5) - 2) * .6 : ((hash >>> 16) % 7) - 3;
    const left = columns === 1 ? 50 : 10 + centeredColumn * (80 / Math.max(1, columns - 1)) + jitterX;
    const top = rows === 1 ? 48 : 18 + row * (64 / Math.max(1, rows - 1)) + jitterY;
    const vipRank = vipRanks.get(viewer.id);
    const horizontalInset = vipRank ? 13 : 9;
    return { viewer, frames: danceSprites[spriteIndex] ?? 17, sprite: spriteIndex + 1, vipRank, left: Math.max(horizontalInset, Math.min(100 - horizontalInset, left)), top: Math.max(14, Math.min(84, top)), delay: -((hash % 1400) / 1000), density, wanderX: ((((hash >>> 3) % 9) - 4) * .42 * density), wanderY: ((((hash >>> 12) % 5) + 1) * .24 * density), wanderDuration: 4.8 + (hash % 32) / 10 };
    });
  }, [settings.autoFitCrowd, settings.maxFloorActors, viewers]);
  const edge = (100 - settings.floorWidth) / 2;
  return <div className={`dance-floor-actors ${command === 'dance' || command === 'party' ? 'party' : ''}`} style={{ left: `${edge}%`, right: `${edge}%` }}>
    {actors.map(({ viewer, frames, sprite, vipRank, left, top, delay, density, wanderX, wanderY, wanderDuration }) => {
      const style = { left: `${left}%`, top: `${top}%`, zIndex: Math.round(top), '--actor-scale': (.66 + (top / 100) * .58) * density, '--actor-delay': `${delay}s`, '--wander-x': `${wanderX}cqw`, '--wander-y': `${wanderY}cqw`, '--wander-duration': `${wanderDuration}s` } as React.CSSProperties;
      const spriteFile = `char-${String(sprite).padStart(2, '0')}-sheet.png`;
      const spriteStyle = { backgroundImage: `url("${projectAssetRoot}/avatars/dance/${spriteFile}")`, backgroundSize: 'auto 100%', animationTimingFunction: `steps(${frames})`, '--sprite-travel': `${frames * 14}cqw` } as React.CSSProperties;
      const wingFile = vipRank ? `top${vipRank}.png` : viewer.level >= 25 ? 'canh3.png' : undefined;
      const wingStyle = wingFile ? { backgroundImage: `url("${projectAssetRoot}/fx/dance/${wingFile}")` } : undefined;
      const motion = viewer.motionUntil && viewer.motionUntil > Date.now() ? viewer.motion : undefined;
      return <div className={`floor-actor ${vipRank ? `vip vip-${vipRank}` : ''} ${spotlightViewerId === viewer.id ? 'spotlighted' : ''} ${motion ? `motion-${motion}` : ''}`} style={style} key={viewer.id}>{wingStyle && <i className="floor-actor-wings" style={wingStyle}/>}<i className="floor-actor-spotlight"/><span className="floor-actor-name">{vipRank && <em>TOP {vipRank}</em>}<img src={cultivationBadgeSource(viewer.level)} alt=""/><b>{viewer.name}</b><small>LV.{viewer.level}</small></span><i className="floor-actor-emote">{motion === 'gift' ? '◆' : motion === 'heart' ? '♥' : motion === 'cheer' ? '★' : motion === 'wave' ? '👋' : motion === 'enter' ? '✦' : ''}</i><i className="floor-actor-shadow"/><span className="floor-actor-sprite" style={spriteStyle}/></div>;
    })}
  </div>;
}

const commandLabels = ['HEY', 'QUAY', 'CAM', 'CHUC', 'NHAY', 'PARTY', 'TIM', 'HELLO'] as const;
const commandActions: Record<string, string> = { hey: 'HEY', quay: 'QUAY', camera: 'CAM', wish: 'CHUC', dance: 'NHAY', party: 'PARTY', heart: 'TIM', hello: 'HELLO' };

function ViewerCommandBoard({ toggles, active }: { toggles: StageState['appearance']['commandToggles']; active?: string }) {
  return <aside className="viewer-command-board"><strong>LỆNH SÀN NHẢY</strong><div>{commandLabels.map((command) => <span key={command} className={`${toggles[command] === false ? 'disabled' : ''} ${commandActions[active ?? ''] === command ? 'active' : ''}`}>{command}</span>)}</div></aside>;
}

function StageEventFx({ effect }: { effect: NonNullable<StageState['eventFx']> }) {
  const count = effect.type === 'fireworks' ? 28 : effect.type === 'hearts' ? 24 : 8;
  return <div className={`stage-event-fx fx-${effect.type}`}>{Array.from({ length: count }, (_, index) => <i key={index} style={{ '--fx-x': `${(index * 47 + 13) % 100}%`, '--fx-delay': `${-(index % 9) * .18}s`, '--fx-size': `${(1.1 + (index % 4) * .45) * effect.intensity}cqw`, '--fx-duration': `${1.1 + (index % 5) * .32}s` } as React.CSSProperties}>{effect.type === 'hearts' ? '♥' : effect.type === 'fireworks' ? '✦' : ''}</i>)}</div>;
}

function Avatar({ viewer, style }: { viewer: StageViewer; style: StageState['appearance']['avatarStyle'] }) {
  const source = safeMediaSource(viewer.avatar ?? '');
  return <span className={`viewer-avatar avatar-${style}`}>{source && <img src={source} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }}/>}<b>{initials(viewer.name)}</b></span>;
}

function Leaderboard({ viewers }: { viewers: StageViewer[] }) {
  return <aside className="leaderboard"><div className="board-title"><span>✦</span><p><b>TOP ORBITERS</b><small>BXH QUÀ TẶNG</small></p></div><div className="leader-list">{viewers.length ? viewers.slice(0, 3).map((viewer, index) => <div className={`leader rank-${index + 1}`} key={viewer.id}><b className="rank">{index + 1}</b><Avatar viewer={viewer} style="neon"/><p><strong>{viewer.name}</strong><span>✦ {compactNumber(viewer.points)} điểm</span></p>{index === 0 && <i>♛</i>}</div>) : <div className="empty-board"><span>◇</span><p>Đang chờ người tặng quà</p></div>}</div></aside>;
}

function ChatStack({ items, avatarStyle }: { items: StageState['chats']; avatarStyle: StageState['appearance']['avatarStyle'] }) {
  return <div className="chat-stack">{items.slice(-3).map((item) => <article key={item.id} className={`chat-bubble chat-${item.kind}`}><Avatar viewer={item.viewer} style={avatarStyle}/><div><header><strong>{item.viewer.name}</strong><span className="level-chip">LV.{item.viewer.level}</span>{item.viewer.badge && <em>{item.viewer.badge}</em>}</header><p>{item.kind === 'follow' ? '✦ ' : item.kind === 'gift' ? '◆ ' : ''}{item.message}</p></div></article>)}</div>;
}

function GiftCelebration({ gift, showWish, onDismissWish }: { gift: GiftEffect; showWish: boolean; onDismissWish: (id: string) => void }) {
  return <div className={`gift-celebration ${gift.superGift ? 'super' : ''}`} key={gift.id}>
    <div className="gift-rays">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--ray': index } as React.CSSProperties}/>)}</div>
    <div className="gift-core"><div className="gift-gem"><i/><i/><i/><b>✦</b></div><span className="gift-count">×{gift.count}</span></div>
    <div className="gift-caption"><small>{gift.superGift ? 'SUPER GIFT' : 'QUÀ TẶNG'}</small><h2>{gift.giftName}</h2><p><b>{gift.viewer.name}</b> gửi {gift.diamonds ? `${compactNumber(gift.diamonds)} kim cương` : 'một món quà'}</p></div>
    {showWish && gift.wish && <div className="gift-wish"><span>“</span><p>{gift.wish}</p><button type="button" aria-label="Xóa lời chúc này" onClick={() => onDismissWish(gift.id)}>×</button></div>}
    {gift.superGift && <div className="super-ring"><i/><i/><i/></div>}
  </div>;
}

function LevelUpCelebration({ levelUp }: { levelUp: NonNullable<StageState['levelUp']> }) {
  return <div className="level-up-celebration"><div className="level-up-rays">{Array.from({ length: 10 }, (_, index) => <i key={index}/>)}</div><img src={cultivationBadgeSource(levelUp.viewer.level)} alt=""/><p><small>ĐỘT PHÁ CẢNH GIỚI</small><strong>{levelUp.viewer.name}</strong><b>LV.{levelUp.previousLevel} → LV.{levelUp.viewer.level}</b><span>{levelUp.viewer.badge}</span></p></div>;
}

function Character({ name, role, variant, speaking, blink, action }: { name: string; role: string; variant: 'nova' | 'echo'; speaking: boolean; blink: boolean; action?: 'greet' }) {
  const host = variant === 'nova' ? 'luna' : 'ryan';
  const state = speaking ? 'open' : 'closed';
  return <div className={`stage-character art-host ${variant} ${speaking ? 'speaking' : ''} ${blink ? 'blink-enabled' : ''} ${action ? `action-${action}` : ''}`}>
    <div className="character-aura"><i/><i/></div>{variant === 'nova' ? <Live2DHost assetRoot={projectAssetRoot} speaking={speaking} blink={blink} fallbackSource={`${projectAssetRoot}/dual-host/luna/${state}.png`}/> : <><img className="host-art base-art" src={`${projectAssetRoot}/dual-host/${host}/${state}.png`} alt=""/>{blink && <img className="host-art blink-art" src={`${projectAssetRoot}/dual-host/${host}/blink.png`} alt=""/>}</>}<div className="host-name"><small>{role}</small><strong>{name}</strong><i/></div>
  </div>;
}

function ConnectionNotice({ state }: { state: StageConnection }) {
  const labels: Record<StageConnection, [string, string]> = { connecting:['Đang kết nối','Mở kênh sự kiện sân khấu…'],reconnecting:['Đang kết nối lại','Stage vẫn giữ giao diện và âm nhạc hiện tại.'],offline:['Ngoại tuyến','Chờ local server khởi động.'],error:['Mất kết nối','OrbitStage sẽ tự thử lại.'],connected:['Đã kết nối',''] };
  return <div className="connection-notice"><div className="reconnect-orbit"><i/><i/><span/></div><p><strong>{labels[state][0]}</strong><small>{labels[state][1]}</small></p></div>;
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', { notation: value >= 1_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

export default App;

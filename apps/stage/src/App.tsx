import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { getWebSocketUrl, initials, initialStageState, normalizeEnvelope, stageReducer } from './stageState';
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

  const leaders = useMemo(() => state.leaderboard.map((id) => state.viewers[id]).filter(Boolean), [state.leaderboard, state.viewers]);
  const currentGift = state.gifts[state.gifts.length - 1];
  const latestChat = state.chats[state.chats.length - 1];
  const backgroundSource = safeMediaSource(state.appearance.backgroundSource);
  const backgroundStyle = state.appearance.backgroundType === 'image' && backgroundSource ? { backgroundImage: `url("${backgroundSource.replaceAll('"', '%22')}")` } : undefined;
  const quality = state.appearance.effectQuality;
  const dismissWish = useCallback((id: string) => {
    dispatch({ type: 'event', event: { type: 'wish:remove', payload: { id } } });
    const facade = window.orbitStage;
    const request = facade?.removeWish
      ? facade.removeWish(id)
      : facade?.invoke?.('wish:remove', { id });
    void request?.catch(() => undefined);
  }, []);

  return <main className={`stage-viewport quality-${quality} ${state.appearance.transparent ? 'transparent' : ''}`}>
    <section className={`stage theme-${state.appearance.theme}`} style={backgroundStyle} aria-label="Sân khấu OrbitStage LIVE">
      {state.appearance.backgroundType === 'video' && backgroundSource && <video className="stage-video" src={backgroundSource} autoPlay muted loop playsInline/>}
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

        {state.characters.enabled && <div className={`hosts ${state.characters.dualHost ? 'dual' : 'single'}`}>
          <Character name={state.characters.hostA} role="MC" variant="nova" speaking={state.speech?.host === 'a'} blink={state.characters.blink}/>
          {state.characters.dualHost && <Character name={state.characters.hostB} role="DJ" variant="echo" speaking={state.speech?.host === 'b'} blink={state.characters.blink}/>} 
        </div>}

        {state.appearance.showChat && <ChatStack items={state.chats} avatarStyle={state.appearance.avatarStyle}/>} 
        {latestChat?.kind === 'join' && <div key={latestChat.id} className="join-ribbon"><Avatar viewer={latestChat.viewer} style={state.appearance.avatarStyle}/><span><b>{latestChat.viewer.name}</b> đã tham gia quỹ đạo</span></div>}
      </div>

      <footer className="stage-footer">
        <div className={`music-now ${state.music.playing ? 'playing' : ''}`}><div className="music-disc"><i/><span>♫</span></div><p><small>NOW PLAYING</small><strong>{state.music.title}</strong><span>{state.music.artist}</span></p><div className="equalizer">{Array.from({ length: 8 }, (_, index) => <i key={index}/>)}</div></div>
        <div className="powered">POWERED BY <b>ORBITSTAGE</b></div>
      </footer>

      {state.aiCaption && <div className="ai-caption"><span>✦</span><p><small>{state.aiCaption.source || 'AI MC'}</small><strong>{state.aiCaption.text}</strong></p></div>}

      <MusicAudio music={state.music} owner={params.get('audio') === '1' || state.audioOwner === true}/>

      {state.connection !== 'connected' && <ConnectionNotice state={state.connection}/>} 
    </section>
  </main>;
}

function MusicAudio({ music, owner }: { music: StageState['music']; owner: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, music.volume / 100));
    if (owner && music.playing && music.source) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [music.playing, music.source, music.volume, owner]);
  return <audio ref={ref} src={safeMediaSource(music.source ?? '')} loop preload="auto" data-audio-owner={owner ? 'stage' : 'main'}/>;
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

function Character({ name, role, variant, speaking, blink }: { name: string; role: string; variant: 'nova' | 'echo'; speaking: boolean; blink: boolean }) {
  return <div className={`stage-character ${variant} ${speaking ? 'speaking' : ''} ${blink ? 'blink' : ''}`}>
    <div className="character-aura"><i/><i/></div><div className="character-hair back"/><div className="character-neck"/><div className="character-body"><i/><i/><b/></div><div className="character-face"><i className="ear left"/><i className="ear right"/><span className="eye left"><b/></span><span className="eye right"><b/></span><span className="nose"/><span className="mouth"/></div><div className="character-hair front"><i/><i/><i/></div><div className="headset"><i/><span/></div><div className="host-name"><small>{role}</small><strong>{name}</strong><i/></div>
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

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { bridge } from './bridge';
import { defaultConfig, defaultSnapshot, formatUptime, mergeConfig } from './lib/model';
import type {
  AppConfig,
  ConfigPatch,
  FakeLiveEvent,
  GiftWishRecord,
  LiveEventType,
  RuntimeSnapshot,
  ScreenId,
} from './types';

type IconName =
  | ScreenId
  | 'stage'
  | 'copy'
  | 'play'
  | 'pause'
  | 'next'
  | 'music'
  | 'sparkles'
  | 'settings'
  | 'shield'
  | 'pulse'
  | 'close'
  | 'check'
  | 'alert'
  | 'folder'
  | 'download'
  | 'refresh';

const iconPaths: Record<IconName, ReactNode> = {
  live: <><circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.2 4.2a11 11 0 0 0 0 15.6M19.8 4.2a11 11 0 0 1 0 15.6"/></>,
  led: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h2m3 0h2m3 0h1M7 13h10M7 16h6"/></>,
  customize: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1A1.7 1.7 0 0 0 4.3 7l-.1-.1L7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  characters: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 4.6"/></>,
  ai: <><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/></>,
  test: <><path d="m9 3 1 3-5 9a4 4 0 0 0 3.5 6h7a4 4 0 0 0 3.5-6l-5-9 1-3"/><path d="M8 3h8M8 15h8"/></>,
  stage: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m8 16 3-3 2 2 3-4 3 5"/></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
  pause: <><path d="M8 5v14M16 5v14"/></>,
  next: <><path d="m6 5 9 7-9 7ZM18 5v14"/></>,
  music: <><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2"/></>,
  shield: <><path d="M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  alert: <><path d="M12 3 2 21h20Z"/><path d="M12 9v5m0 3h.01"/></>,
  folder: <><path d="M3 6h7l2 2h9v11H3Z"/></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 20h16"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M18 11a7 7 0 0 0-12-4L4 9m2 4a7 7 0 0 0 12 4l2-2"/></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

const navItems: { id: ScreenId; label: string; eyebrow: string }[] = [
  { id: 'live', label: 'Điều khiển LIVE', eyebrow: 'Trung tâm' },
  { id: 'led', label: 'LED sân khấu', eyebrow: 'Hiển thị' },
  { id: 'customize', label: 'Tùy chỉnh', eyebrow: 'Giao diện' },
  { id: 'characters', label: 'Nhân vật', eyebrow: 'Host ảo' },
  { id: 'ai', label: 'AI MC / DJ', eyebrow: 'Tự động' },
  { id: 'test', label: 'Test LIVE', eyebrow: 'Mô phỏng' },
];

const screenCopy: Record<ScreenId, { title: string; subtitle: string }> = {
  live: { title: 'Điều khiển LIVE', subtitle: 'Kết nối TikFinity, điều phối sân khấu và âm nhạc.' },
  led: { title: 'LED sân khấu', subtitle: 'Thiết kế thông điệp chuyển động cho livestream.' },
  customize: { title: 'Tùy chỉnh sân khấu', subtitle: 'Bố cục, nền, hiệu ứng và hệ thống người xem.' },
  characters: { title: 'Nhân vật', subtitle: 'Thiết lập MC, DJ và sân khấu hai host.' },
  ai: { title: 'AI MC / DJ', subtitle: 'Provider, persona, auto-hype và hàng đợi giọng nói.' },
  test: { title: 'Test LIVE', subtitle: 'Phát sự kiện giả lập vào cùng pipeline production.' },
};

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function CardTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return <div className="card-title"><div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>{action}</div>;
}

function Field({ label, hint, children, span = false }: { label: string; hint?: string; children: ReactNode; span?: boolean }) {
  return <label className={`field ${span ? 'field-span' : ''}`}><span className="field-label">{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Toggle({ checked, onChange, label, description, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return <div className={`toggle-row ${disabled ? 'disabled' : ''}`}><div><strong>{label}</strong>{description && <span>{description}</span>}</div><button type="button" role="switch" aria-checked={checked} disabled={disabled} className={`switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}><span /></button></div>;
}

function StatusDot({ state }: { state: RuntimeSnapshot['connection'] | 'ok' | 'warn' | 'error' }) {
  const status = state === 'connected' || state === 'ok' ? 'ok' : state === 'connecting' || state === 'reconnecting' || state === 'warn' ? 'warn' : 'off';
  return <span className={`status-dot ${status}`} />;
}

interface ConfirmDialog {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  action: () => Promise<void> | void;
}

function App() {
  const [screen, setScreen] = useState<ScreenId>('live');
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [runtime, setRuntime] = useState<RuntimeSnapshot>(defaultSnapshot);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>();
  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'warn' | 'error' }>();
  const [dialog, setDialog] = useState<ConfirmDialog>();

  const notify = useCallback((message: string, tone: 'ok' | 'warn' | 'error' = 'ok') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(undefined), 3200);
  }, []);

  const load = useCallback(async () => {
    try {
      const [nextConfig, nextSnapshot] = await Promise.all([bridge.config(), bridge.snapshot()]);
      setConfig(mergeConfig(defaultConfig, nextConfig));
      setRuntime({ ...defaultSnapshot, ...nextSnapshot });
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể đọc trạng thái ứng dụng.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
    const dispose = bridge.subscribe((event) => {
      if ((event.type === 'runtime:snapshot' || event.type === 'snapshot') && event.payload) setRuntime((current) => ({ ...current, ...(event.payload as Partial<RuntimeSnapshot>) }));
      if (event.type === 'runtime:connection' || event.type === 'connection') setRuntime((current) => ({ ...current, connection: event.payload as RuntimeSnapshot['connection'] }));
      if (event.type === 'config' && event.payload) setConfig((current) => mergeConfig(current, event.payload as ConfigPatch));
      if (event.type === 'music') void bridge.snapshot().then(setRuntime).catch(() => undefined);
      if (event.type === 'notification' && typeof event.payload === 'string') notify(event.payload);
    });
    const poll = window.setInterval(() => void bridge.snapshot().then(setRuntime).catch(() => undefined), 5000);
    return () => { dispose(); window.clearInterval(poll); };
  }, [load, notify]);

  const patchConfig = useCallback(async <K extends keyof AppConfig>(section: K, patch: Partial<AppConfig[K]>, success?: string) => {
    const configPatch = { [section]: patch } as ConfigPatch;
    setConfig((current) => mergeConfig(current, configPatch));
    try {
      await bridge.saveConfig(configPatch);
      if (success) notify(success);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể lưu cấu hình.', 'error');
      void load();
    }
  }, [load, notify]);

  const startStop = () => {
    const stopping = runtime.live;
    setDialog({
      title: stopping ? 'Dừng phiên LIVE?' : 'Bắt đầu phiên LIVE?',
      description: stopping
        ? 'TikFinity sẽ ngắt kết nối. Stage vẫn mở và nhạc sẽ dừng theo audio coordinator.'
        : 'OrbitStage sẽ kết nối TikFinity và chuyển event vào stage đang mở.',
      confirmLabel: stopping ? 'Dừng LIVE' : 'Bắt đầu LIVE',
      tone: stopping ? 'danger' : 'primary',
      action: async () => {
        setBusy('live');
        try {
          if (stopping) await bridge.stopLive(); else await bridge.startLive();
          setRuntime((current) => ({ ...current, live: !stopping, connection: stopping ? 'offline' : 'connecting' }));
          notify(stopping ? 'Đã dừng phiên LIVE.' : 'Đang kết nối TikFinity…');
        } catch (error) {
          notify(error instanceof Error ? error.message : 'Thao tác LIVE thất bại.', 'error');
        } finally { setBusy(undefined); }
      },
    });
  };

  const activeCopy = screenCopy[screen];
  const connectionLabel: Record<RuntimeSnapshot['connection'], string> = {
    offline: 'Ngoại tuyến', connecting: 'Đang kết nối', connected: 'Đã kết nối', reconnecting: 'Đang kết nối lại', error: 'Có lỗi',
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><span /><span /><span /></div>
        <div><strong>OrbitStage</strong><small>LIVE CONTROL</small></div>
      </div>

      <nav aria-label="Điều hướng chính">
        <p className="nav-caption">KHÔNG GIAN LÀM VIỆC</p>
        {navItems.map((item) => <button key={item.id} className={`nav-item ${screen === item.id ? 'active' : ''}`} onClick={() => setScreen(item.id)}>
          <span className="nav-icon"><Icon name={item.id} size={19}/></span>
          <span><strong>{item.label}</strong><small>{item.eyebrow}</small></span>
          {item.id === 'live' && <i className={runtime.live ? 'live-pip on' : 'live-pip'} />}
        </button>)}
      </nav>

      <div className="sidebar-footer">
        <div className="connection-card">
          <div><StatusDot state={runtime.connection}/><span>TikFinity</span></div>
          <strong>{connectionLabel[runtime.connection]}</strong>
          <small>{runtime.tikfinityUrl.replace('ws://', '')}</small>
        </div>
        <div className="version-row"><span>OrbitStage Live</span><span className="free-pill">FULL</span></div>
      </div>
    </aside>

    <main className="main-shell">
      <header className="topbar">
        <div><span className="breadcrumb">OrbitStage / {activeCopy.title}</span><h1>{activeCopy.title}</h1><p>{activeCopy.subtitle}</p></div>
        <div className="top-actions">
          <span className={`bridge-pill ${bridge.available() ? 'ready' : ''}`}><StatusDot state={bridge.available() ? 'ok' : 'warn'}/>{bridge.available() ? 'Desktop bridge' : 'UI preview'}</span>
          <button className="button subtle" onClick={() => void bridge.openStage()}><Icon name="stage" size={17}/>Mở Stage</button>
          <button className={`button ${runtime.live ? 'danger' : 'primary'}`} disabled={busy === 'live'} onClick={startStop}>{busy === 'live' ? <span className="spinner"/> : <span className="button-live-dot"/>}{runtime.live ? 'Dừng LIVE' : 'Chạy LIVE'}</button>
        </div>
      </header>

      <div className={`content ${loading ? 'is-loading' : ''}`}>
        {loading ? <LoadingState/> : <>
          {screen === 'live' && <LiveScreen config={config} runtime={runtime} patch={patchConfig} notify={notify}/>} 
          {screen === 'led' && <LedScreen config={config} patch={patchConfig}/>} 
          {screen === 'customize' && <CustomizeScreen config={config} patch={patchConfig} notify={notify}/>} 
          {screen === 'characters' && <CharactersScreen config={config} patch={patchConfig} notify={notify}/>} 
          {screen === 'ai' && <AiScreen config={config} patch={patchConfig} notify={notify}/>} 
          {screen === 'test' && <TestScreen notify={notify}/>} 
        </>}
      </div>
    </main>

    {toast && <div className={`toast ${toast.tone}`} role="status"><Icon name={toast.tone === 'ok' ? 'check' : 'alert'} size={18}/><span>{toast.message}</span><button onClick={() => setToast(undefined)} aria-label="Đóng"><Icon name="close" size={16}/></button></div>}
    {dialog && <div className="dialog-backdrop" role="presentation" onMouseDown={() => setDialog(undefined)}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className={`dialog-symbol ${dialog.tone === 'danger' ? 'danger' : ''}`}><Icon name={dialog.tone === 'danger' ? 'alert' : 'live'} size={24}/></div>
      <h2 id="dialog-title">{dialog.title}</h2><p>{dialog.description}</p>
      <div className="dialog-actions"><button className="button subtle" onClick={() => setDialog(undefined)}>Hủy</button><button className={`button ${dialog.tone === 'danger' ? 'danger' : 'primary'}`} onClick={() => { const action = dialog.action; setDialog(undefined); void action(); }}>{dialog.confirmLabel}</button></div>
    </div></div>}
  </div>;
}

function LoadingState() {
  return <div className="loading-state"><div className="orbit-loader"><span/><span/><span/></div><strong>Đang đồng bộ không gian LIVE</strong><small>Đọc cấu hình an toàn từ Main process…</small></div>;
}

interface ScreenProps {
  config: AppConfig;
  patch: <K extends keyof AppConfig>(section: K, patch: Partial<AppConfig[K]>, success?: string) => Promise<void>;
}

function LiveScreen({ config, runtime, patch, notify }: ScreenProps & { runtime: RuntimeSnapshot; notify: (message: string, tone?: 'ok' | 'warn' | 'error') => void }) {
  const [draft, setDraft] = useState(config.live);
  useEffect(() => setDraft(config.live), [config.live]);
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(runtime.stageUrl); notify('Đã sao chép URL cho OBS.'); }
    catch { notify('Không thể truy cập clipboard.', 'warn'); }
  };
  const addMusic = async () => {
    const source = await bridge.selectAsset('audio');
    if (!source) return notify('Chưa chọn tệp nhạc.', 'warn');
    const fileName = source.split(/[\\/]/).pop() || 'Bản nhạc mới';
    const title = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    const track = { id: crypto.randomUUID(), title, path: source, rights: 'placeholder' as const };
    await patch('music', { playlist: [...config.music.playlist, track], currentTrackId: config.music.currentTrackId ?? track.id }, 'Đã thêm nhạc vào danh mục.');
  };
  const selectTrack = async (trackId: string) => {
    await patch('music', { currentTrackId: trackId });
    await bridge.music('play');
  };
  const updateTrackRights = async (trackId: string, rights: AppConfig['music']['playlist'][number]['rights']) => {
    await patch('music', { playlist: config.music.playlist.map((track) => track.id === trackId ? { ...track, rights } : track) }, 'Đã cập nhật tình trạng quyền sử dụng.');
  };
  return <div className="screen-grid live-grid">
    <Card className="live-hero span-2">
      <div className="live-hero-copy"><div className={`signal-orb ${runtime.live ? 'active' : ''}`}><span/><i/></div><div><div className="eyebrow"><StatusDot state={runtime.connection}/>{runtime.live ? 'PHIÊN LIVE ĐANG HOẠT ĐỘNG' : 'SẴN SÀNG KẾT NỐI'}</div><h2>{runtime.live ? `Đang nhận sự kiện từ @${config.live.tiktokAccount || 'TikTok'}` : 'Khởi động sân khấu của bạn'}</h2><p>{runtime.live ? 'Event được lọc, xếp hàng và đồng bộ tới mọi cửa sổ stage.' : 'Kiểm tra TikFinity rồi nhấn Chạy LIVE ở góc phải.'}</p></div></div>
      <div className="runtime-clock"><span>Thời lượng</span><strong>{formatUptime(runtime.uptimeSeconds)}</strong></div>
    </Card>

    <div className="metric-row span-2">
      <Metric label="Người xem" value={runtime.viewerCount.toLocaleString('vi-VN')} detail="đang hiển thị" color="violet"/>
      <Metric label="Event đang đợi" value={String(runtime.queueDepth)} detail="pipeline LIVE" color="cyan"/>
      <Metric label="Giọng nói" value={String(runtime.speechQueueDepth)} detail="trong hàng đợi" color="lime"/>
      <Metric label="Local server" value={runtime.health?.localServer === 'ok' ? 'Ổn định' : 'Kiểm tra'} detail={`127.0.0.1:${runtime.localPort}`} color="pink"/>
    </div>

    <Card>
      <CardTitle title="Kết nối TikFinity" hint="WebSocket chỉ kết nối qua local bridge." action={<span className={`badge ${runtime.connection === 'connected' ? 'success' : 'neutral'}`}><StatusDot state={runtime.connection}/>{runtime.connection === 'connected' ? 'Online' : 'Offline'}</span>}/>
      <div className="form-grid">
        <Field label="Tài khoản TikTok" span><div className="input-prefix"><span>@</span><input value={draft.tiktokAccount} placeholder="tenkenhcuaban" onChange={(e) => setDraft({ ...draft, tiktokAccount: e.target.value.replace(/^@/, '') })}/></div></Field>
        <Field label="TikFinity WebSocket" span hint="Mặc định của TikFinity Desktop là localhost."><input value={draft.tikfinityUrl} onChange={(e) => setDraft({ ...draft, tikfinityUrl: e.target.value })}/></Field>
        <Field label="Cổng server"><input type="number" min="1024" max="65535" value={draft.localPort} onChange={(e) => setDraft({ ...draft, localPort: Number(e.target.value) })}/></Field>
        <Field label="Giới hạn event/người"><input type="number" min="1" max="100" value={draft.maxEventsPerViewer} onChange={(e) => setDraft({ ...draft, maxEventsPerViewer: Number(e.target.value) })}/></Field>
      </div>
      <Toggle checked={draft.reconnect} onChange={(reconnect) => setDraft({ ...draft, reconnect })} label="Tự động kết nối lại" description="Backoff tăng dần khi TikFinity mất kết nối."/>
      <div className="card-actions"><button className="button ghost" onClick={() => setDraft(config.live)}>Hoàn tác</button><button className="button primary" onClick={() => void patch('live', draft, 'Đã lưu cấu hình TikFinity.')}>Lưu kết nối</button></div>
    </Card>

    <div className="stack">
      <Card>
        <CardTitle title="OBS Browser Source" hint="Stage trong suốt, tỷ lệ dọc 9:16." action={<button className="icon-button" onClick={copyUrl} aria-label="Sao chép URL"><Icon name="copy" size={17}/></button>}/>
        <div className="url-box"><code>{runtime.stageUrl}</code></div>
        <div className="obs-spec"><span><b>1080</b> rộng</span><i/><span><b>1920</b> cao</span><i/><span><b>60</b> FPS</span></div>
        <button className="button secondary full" onClick={() => void bridge.openStage()}><Icon name="stage" size={17}/>Mở cửa sổ Stage</button>
      </Card>
      <Card className="music-card">
        <CardTitle title="Audio coordinator" hint="Một nguồn phát duy nhất trên mọi stage." action={<button className="mini-action" onClick={() => void addMusic()}><span>＋</span>Thêm nhạc</button>}/>
        <div className="track"><div className={`album-art ${runtime.music?.playing ? 'playing' : ''}`}><Icon name="music" size={24}/></div><div><strong>{runtime.music?.title ?? 'Chưa chọn bản nhạc'}</strong><span>{runtime.music?.artist ?? 'Thư viện OrbitStage'}</span></div></div>
        <div className="player-controls"><button className="icon-button" onClick={() => void bridge.music('previous')}><Icon name="next" size={18}/></button><button className="play-button" onClick={() => void bridge.music(runtime.music?.playing ? 'pause' : 'play')}><Icon name={runtime.music?.playing ? 'pause' : 'play'} size={20}/></button><button className="icon-button" onClick={() => void bridge.music('next')}><Icon name="next" size={18}/></button><input aria-label="Âm lượng" type="range" min="0" max="100" value={runtime.music?.volume ?? 70} onChange={(e) => void bridge.music('volume', Number(e.target.value))}/><span>{runtime.music?.volume ?? 70}%</span></div>
        <div className="form-grid"><Field label={`Crossfade · ${config.music.crossfadeSeconds}s`}><input type="range" min="0" max="8" step="0.5" value={config.music.crossfadeSeconds} onChange={(event) => void patch('music', { crossfadeSeconds: Number(event.target.value) })}/></Field><Field label={`Độ nhạy beat · ${config.music.beatSensitivity.toFixed(1)}×`}><input type="range" min="0.5" max="3" step="0.1" value={config.music.beatSensitivity} onChange={(event) => void patch('music', { beatSensitivity: Number(event.target.value) })}/></Field></div>
        <div className="music-catalog"><div className="catalog-label"><span>DANH MỤC NHẠC</span><b>{config.music.playlist.length} TRACK</b></div>{config.music.playlist.length ? config.music.playlist.slice(0, 4).map((track, index) => <div key={track.id} className={`catalog-track ${config.music.currentTrackId === track.id ? 'selected' : ''}`}><button onClick={() => void selectTrack(track.id)}><i>{String(index + 1).padStart(2, '0')}</i><p><strong>{track.title}</strong><small>{track.path}</small></p>{config.music.currentTrackId === track.id && <span>ĐANG CHỌN</span>}</button><select aria-label={`Quyền sử dụng ${track.title}`} value={track.rights} onChange={(event) => void updateTrackRights(track.id, event.target.value as typeof track.rights)}><option value="placeholder">Chưa xác nhận quyền</option><option value="owned">Dự án sở hữu</option><option value="licensed">Đã cấp phép</option><option value="cc0">CC0 / public domain</option></select></div>) : <button className="empty-track" onClick={() => void addMusic()}><i>＋</i><p><strong>Danh mục đang trống</strong><small>Thêm MP3, WAV, OGG hoặc M4A hợp lệ</small></p></button>}</div>
      </Card>
    </div>
  </div>;
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return <Card className={`metric ${color}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small><i/></Card>;
}

function LedScreen({ config, patch }: ScreenProps) {
  const [draft, setDraft] = useState(config.led);
  useEffect(() => setDraft(config.led), [config.led]);
  return <div className="screen-grid led-grid">
    <Card className="led-preview span-2"><div className="preview-label"><span>LIVE PREVIEW</span><small>STAGE LED · 1080 × 164</small></div><div className={`led-board ${draft.style}`} style={{ '--led-color': draft.color, '--led-glow': draft.glowColor, '--led-speed': `${Math.max(5, 62 - draft.speed)}s` } as React.CSSProperties}><div className="led-dots"/><div className="led-track"><span>{draft.text || 'ORBITSTAGE'}</span><i>✦</i><span>{draft.text || 'ORBITSTAGE'}</span></div></div></Card>
    <Card>
      <CardTitle title="Nội dung LED" hint="Thay đổi hiển thị ngay trên preview."/>
      <Field label="Thông điệp" span hint={`${draft.text.length}/80 ký tự`}><textarea rows={3} maxLength={80} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value.toUpperCase() })}/></Field>
      <Field label="Kiểu chuyển động"><select value={draft.style} onChange={(e) => setDraft({ ...draft, style: e.target.value as typeof draft.style })}><option value="marquee">Chạy ngang</option><option value="pulse">Nhịp sáng</option><option value="static">Đứng yên</option></select></Field>
      <Field label={`Tốc độ · ${draft.speed}`}><input type="range" min="5" max="60" value={draft.speed} onChange={(e) => setDraft({ ...draft, speed: Number(e.target.value) })}/></Field>
      <Toggle checked={draft.enabled} onChange={(enabled) => setDraft({ ...draft, enabled })} label="Hiển thị LED" description="Ẩn LED không làm thay đổi bố cục stage."/>
    </Card>
    <Card>
      <CardTitle title="Màu & ánh sáng" hint="Tự tạo bằng CSS, không dùng asset bên thứ ba."/>
      <div className="color-fields"><Field label="Màu chữ"><div className="color-input"><input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })}/><code>{draft.color}</code></div></Field><Field label="Màu hào quang"><div className="color-input"><input type="color" value={draft.glowColor} onChange={(e) => setDraft({ ...draft, glowColor: e.target.value })}/><code>{draft.glowColor}</code></div></Field></div>
      <div className="swatch-row">{['#8b5cf6','#22d3ee','#f472b6','#a3e635','#fb923c'].map((color) => <button key={color} style={{ background: color }} aria-label={`Chọn ${color}`} onClick={() => setDraft({ ...draft, glowColor: color })}/>)}</div>
      <div className="card-actions"><button className="button ghost" onClick={() => setDraft(config.led)}>Hoàn tác</button><button className="button primary" onClick={() => void patch('led', draft, 'Đã áp dụng LED lên stage.')}>Áp dụng lên Stage</button></div>
    </Card>
  </div>;
}

function CustomizeScreen({ config, patch, notify }: ScreenProps & { notify: (message: string, tone?: 'ok' | 'warn' | 'error') => void }) {
  const stage = config.stage;
  const [wishes, setWishes] = useState<GiftWishRecord[]>([]);
  const [wishBusy, setWishBusy] = useState<string>();
  useEffect(() => {
    let active = true;
    void bridge.listWishes().then((items) => { if (active) setWishes(items); }).catch(() => undefined);
    const dispose = bridge.subscribe((event) => {
      if (event.type !== 'wishes' || !event.payload || typeof event.payload !== 'object') return;
      const items = (event.payload as { items?: unknown }).items;
      if (Array.isArray(items)) setWishes(items as GiftWishRecord[]);
    });
    return () => { active = false; dispose(); };
  }, []);
  const setWishVisible = async (wish: GiftWishRecord) => {
    setWishBusy(wish.id);
    try {
      setWishes(await bridge.setWishVisible(wish.id, !wish.visible));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể đổi trạng thái lời chúc.', 'error');
    } finally {
      setWishBusy(undefined);
    }
  };
  const removeWish = async (wish: GiftWishRecord) => {
    setWishBusy(wish.id);
    try {
      setWishes(await bridge.removeWish(wish.id));
      notify('Đã xóa lời chúc khỏi sân khấu.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể xóa lời chúc.', 'error');
    } finally {
      setWishBusy(undefined);
    }
  };
  const selectBackground = async () => {
    const source = await bridge.selectAsset(stage.backgroundType === 'video' ? 'video' : 'image');
    if (source) void patch('stage', { backgroundSource: source }, 'Đã chọn asset nền.');
    else notify('Chưa chọn asset.', 'warn');
  };
  return <div className="screen-grid customize-grid">
    <Card className="stage-preview-card">
      <CardTitle title="Bản xem trước 9:16" hint="Bố cục co giãn giống OBS Browser Source." action={<span className="badge success"><span className="status-dot ok"/>SYNC</span>}/>
      <div className={`mini-stage theme-${stage.theme}`}>
        <div className="mini-stars"/><div className="mini-led">ORBITSTAGE · LIVE NOW</div><div className="mini-leaderboard"><span>🏆 TOP GIFTERS</span><b>1 · Luna</b><b>2 · Minh Anh</b><b>3 · Sky</b></div><div className="mini-character a"><i/><b>NOVA</b></div><div className="mini-character b"><i/><b>ECHO</b></div><div className="mini-chat"><span>MA</span><p><b>Minh Anh</b> Sân khấu đẹp quá! ✨</p></div><div className="mini-deck">◀  Now playing  ·  Cosmic Bloom  ▶</div>
      </div>
    </Card>
    <div className="stack">
      <Card>
        <CardTitle title="Chủ đề sân khấu" hint="Ba theme nguyên bản của OrbitStage."/>
        <div className="theme-options">{(['cosmos','aurora','midnight'] as const).map((theme) => <button key={theme} className={`theme-option ${stage.theme === theme ? 'selected' : ''}`} onClick={() => void patch('stage', { theme })}><span className={theme}/><strong>{theme === 'cosmos' ? 'Cosmos' : theme === 'aurora' ? 'Aurora' : 'Midnight'}</strong>{stage.theme === theme && <Icon name="check" size={15}/>}</button>)}</div>
      </Card>
      <Card>
        <CardTitle title="Nền & video" hint="Chỉ chọn asset bạn có quyền sử dụng."/>
        <div className="segment">{(['gradient','image','video'] as const).map((type) => <button key={type} className={stage.backgroundType === type ? 'active' : ''} onClick={() => void patch('stage', { backgroundType: type })}>{type === 'gradient' ? 'Gradient' : type === 'image' ? 'Hình ảnh' : 'Video'}</button>)}</div>
        {stage.backgroundType !== 'gradient' && <button className="asset-drop" onClick={() => void selectBackground()}><Icon name="folder" size={22}/><span><strong>{stage.backgroundSource ? 'Đổi asset nền' : 'Chọn asset nền'}</strong><small>{stage.backgroundSource || 'PNG, JPG, WEBP, MP4, WEBM'}</small></span></button>}
      </Card>
      <Card>
        <CardTitle title="Hiệu năng"/>
        <Field label="Chất lượng hiệu ứng"><select value={stage.effectQuality} onChange={(e) => void patch('stage', { effectQuality: e.target.value as typeof stage.effectQuality })}><option value="low">Thấp · GPU yếu</option><option value="balanced">Cân bằng</option><option value="high">Cao · GPU rời</option></select></Field>
        <Field label="Kiểu avatar"><select value={stage.avatarStyle} onChange={(e) => void patch('stage', { avatarStyle: e.target.value as typeof stage.avatarStyle })}><option value="round">Tròn</option><option value="hex">Lục giác</option><option value="neon">Neon</option></select></Field>
      </Card>
      <Card>
        <CardTitle title="Sân khấu 3D" hint="Đèn, camera và booth được đồng bộ với LIVE."/>
        <Field label="Chuyển động camera"><select value={stage.cameraMode} onChange={(e) => void patch('stage', { cameraMode: e.target.value as typeof stage.cameraMode })}><option value="ambient">Ambient · lia nhẹ</option><option value="cinematic">Cinematic · lia rộng</option><option value="locked">Locked · cố định</option></select></Field>
        <Toggle checked={stage.threeDEnabled} onChange={(threeDEnabled) => void patch('stage', { threeDEnabled })} label="Bật Three.js" description="Tắt để chỉ dùng overlay 2D."/>
        <Toggle checked={stage.floorBright} onChange={(floorBright) => void patch('stage', { floorBright })} label="Sàn nhảy phản ứng nhạc"/>
        <Toggle checked={stage.lasers} onChange={(lasers) => void patch('stage', { lasers })} label="Laser & spotlight"/>
        <Toggle checked={stage.ledScreens} onChange={(ledScreens) => void patch('stage', { ledScreens })} label="Màn LED 3D"/>
        <Toggle checked={stage.topPodiums} onChange={(topPodiums) => void patch('stage', { topPodiums })} label="Bục TOP 1 / 2 / 3"/>
        <Toggle checked={stage.autoFitCrowd} onChange={(autoFitCrowd) => void patch('stage', { autoFitCrowd })} label="Tự giãn khi đông" description="Tự thêm hàng, thu nhỏ nhân vật và giữ người mới/TOP trên sàn."/>
        <div className="form-grid">
          <Field label={`Số nhân vật tối đa · ${stage.maxFloorActors}`}><input type="range" min="8" max="80" step="1" value={stage.maxFloorActors} onChange={(event) => void patch('stage', { maxFloorActors: Number(event.target.value) })}/></Field>
          <Field label={`Độ rộng sàn · ${stage.floorWidth}%`}><input type="range" min="80" max="110" step="1" value={stage.floorWidth} onChange={(event) => void patch('stage', { floorWidth: Number(event.target.value) })}/></Field>
        </div>
      </Card>
      <Card>
        <CardTitle title="Lệnh người xem" hint="Tương thích bộ lệnh của Quán Bar Online."/>
        <Toggle checked={stage.commandBoardEnabled} onChange={(commandBoardEnabled) => void patch('stage', { commandBoardEnabled })} label="Hiện bảng lệnh trên Stage"/>
        <div className="toggle-grid command-toggle-grid">{(['HEY','QUAY','CAM','CHUC','NHAY','PARTY','TIM','HELLO'] as const).map((command) => <Toggle key={command} checked={stage.commandToggles[command]} onChange={(enabled) => void patch('stage', { commandToggles: { ...stage.commandToggles, [command]: enabled } })} label={command}/>)}</div>
      </Card>
    </div>
    <Card className="span-2">
      <CardTitle title="Lớp hiển thị" hint="Tắt một lớp không xóa dữ liệu người xem."/>
      <div className="toggle-grid">
        <Toggle checked={stage.showChat} onChange={(showChat) => void patch('stage', { showChat })} label="Bong bóng chat" description="Tên, avatar và nội dung đã lọc."/>
        <Toggle checked={stage.showLeaderboard} onChange={(showLeaderboard) => void patch('stage', { showLeaderboard })} label="Leaderboard" description="Xếp hạng quà theo phiên LIVE."/>
        <Toggle checked={stage.showLevel} onChange={(showLevel) => void patch('stage', { showLevel })} label="Level & danh hiệu" description="Cấp người xem và badge ưu tiên."/>
        <Toggle checked={stage.showWishes} onChange={(showWishes) => void patch('stage', { showWishes })} label="Lời chúc quà tặng" description="Có thể ẩn hoặc xóa riêng từng lời chúc."/>
      </div>
    </Card>
    <Card className="span-2 wish-manager">
      <CardTitle title="Lời chúc quà tặng" hint="Ẩn tạm hoặc xóa riêng từng lời chúc; thao tác đồng bộ ngay với Stage." action={<span className="badge">{wishes.length} LỜI CHÚC</span>}/>
      <div className="wish-list">
        {wishes.length === 0 && <div className="wish-empty">Chưa có lời chúc. Gửi fake gift kèm lời nhắn để kiểm thử.</div>}
        {wishes.map((wish) => <article className={`wish-row ${wish.visible ? '' : 'hidden'}`} key={wish.id}>
          <div className="wish-avatar" aria-hidden="true">{wish.viewerName.trim().charAt(0).toUpperCase() || '?'}</div>
          <p><strong>{wish.viewerName}</strong><span>{wish.message}</span><small>{new Date(wish.createdAt).toLocaleString('vi-VN')}</small></p>
          <div className="wish-actions">
            <button type="button" className="mini-action" disabled={wishBusy === wish.id} aria-label={`${wish.visible ? 'Ẩn' : 'Hiện'} lời chúc của ${wish.viewerName}`} onClick={() => void setWishVisible(wish)}>{wish.visible ? 'Ẩn' : 'Hiện'}</button>
            <button type="button" className="mini-action danger-outline" disabled={wishBusy === wish.id} aria-label={`Xóa lời chúc của ${wish.viewerName}`} onClick={() => void removeWish(wish)}>Xóa</button>
          </div>
        </article>)}
      </div>
    </Card>
  </div>;
}

function CharactersScreen({ config, patch, notify }: ScreenProps & { notify: (message: string, tone?: 'ok' | 'warn' | 'error') => void }) {
  const characters = config.characters;
  const selectModel = async () => {
    const source = await bridge.selectAsset('model');
    notify(source ? `Đã thêm model: ${source.split(/[\\/]/).pop()}` : 'Chưa chọn model.', source ? 'ok' : 'warn');
  };
  return <div className="screen-grid character-grid">
    <Card className="character-showcase span-2">
      <div className="showcase-copy"><span className="eyebrow">DUAL HOST STUDIO</span><h2>Hai cá tính, một sân khấu.</h2><p>Fallback SVG/CSS luôn sẵn sàng khi model Live2D hoặc GPU không khả dụng.</p><div className="host-status"><span><StatusDot state="ok"/>{characters.hostA}</span><span><StatusDot state={characters.dualHost ? 'ok' : 'warn'}/>{characters.hostB}</span></div></div>
      <div className="character-art"><div className="host-figure nova"><div className="host-hair"/><div className="host-face"><i/><i/><b/></div><div className="host-body"/><span>{characters.hostA || 'Nova'} · MC</span></div><div className={`host-figure echo ${characters.dualHost ? '' : 'muted'}`}><div className="host-hair"/><div className="host-face"><i/><i/><b/></div><div className="host-body"/><span>{characters.hostB || 'Echo'} · DJ</span></div></div>
    </Card>
    <Card>
      <CardTitle title="Đội hình" hint="Tên hiển thị không phụ thuộc tên file model."/>
      <div className="form-grid"><Field label="Host A"><input value={characters.hostA} onChange={(e) => void patch('characters', { hostA: e.target.value })}/></Field><Field label="Host B"><input value={characters.hostB} disabled={!characters.dualHost} onChange={(e) => void patch('characters', { hostB: e.target.value })}/></Field></div>
      <Toggle checked={characters.enabled} onChange={(enabled) => void patch('characters', { enabled })} label="Hiển thị nhân vật" description="Ẩn host, giữ UI stage và audio."/>
      <Toggle checked={characters.dualHost} onChange={(dualHost) => void patch('characters', { dualHost })} label="Chế độ hai host" description="MC và DJ đứng hai bên sân khấu."/>
      <button className="asset-drop compact" onClick={() => void selectModel()}><Icon name="folder" size={20}/><span><strong>Thêm model đã cấp quyền</strong><small>Live2D JSON/MOC3 hoặc GLB</small></span></button>
    </Card>
    <Card>
      <CardTitle title="Chuyển động" hint="Tự giảm chất lượng khi GPU yếu."/>
      <Toggle checked={characters.lipSync} onChange={(lipSync) => void patch('characters', { lipSync })} label="Lip sync" description="Theo amplitude của TTS/music input."/>
      <Toggle checked={characters.blink} onChange={(blink) => void patch('characters', { blink })} label="Chớp mắt tự nhiên" description="Chu kỳ ngẫu nhiên, giảm cảm giác lặp."/>
      <Toggle checked={characters.shuffle} onChange={(shuffle) => void patch('characters', { shuffle })} label="Đổi vị trí theo lượt" description="Hoán đổi MC/DJ sau mỗi 10 phút."/>
      <div className="motion-row"><button className="button secondary" onClick={() => notify('Đã phát motion chào khán giả.')}><Icon name="sparkles" size={17}/>Test chào</button><button className="button subtle" onClick={() => notify('Đã đặt lại pose trung tâm.')}>Đặt lại pose</button></div>
    </Card>
  </div>;
}

function AiScreen({ config, patch, notify }: ScreenProps & { notify: (message: string, tone?: 'ok' | 'warn' | 'error') => void }) {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('Chào một khán giả vừa tặng quà trong một câu ngắn.');
  const [result, setResult] = useState<{ text: string; latencyMs?: number }>();
  const [testing, setTesting] = useState(false);
  const ai = config.ai;
  const test = async () => {
    setTesting(true); setResult(undefined);
    try { setResult(await bridge.testAi(prompt)); }
    catch (error) { notify(error instanceof Error ? error.message : 'AI test thất bại.', 'error'); }
    finally { setTesting(false); }
  };
  const saveKey = async () => {
    if (!apiKey.trim()) return notify('Nhập API key trước khi lưu.', 'warn');
    await bridge.saveSecret('aiApiKey', apiKey.trim()); setApiKey(''); notify('API key đã được gửi tới kho secret mã hóa.');
  };
  return <div className="screen-grid ai-grid">
    <Card className="ai-banner span-2"><div className="ai-glyph"><Icon name="sparkles" size={31}/><span/><span/></div><div><span className="eyebrow">ORBIT INTELLIGENCE</span><h2>MC đúng lúc. DJ không nói chồng.</h2><p>Mọi tác vụ AI và TTS dùng chung rate limit, content filter và speech queue.</p></div><Toggle checked={ai.enabled} onChange={(enabled) => void patch('ai', { enabled }, enabled ? 'Đã bật AI MC/DJ.' : 'Đã tắt AI MC/DJ.')} label={ai.enabled ? 'Đang bật' : 'Đang tắt'}/></Card>
    <Card>
      <CardTitle title="AI provider" hint="Key không bao giờ được trả lại renderer sau khi lưu." action={<span className="badge neutral"><Icon name="shield" size={13}/>SAFE STORAGE</span>}/>
      <div className="form-grid">
        <Field label="Nhà cung cấp"><select value={ai.provider} onChange={(e) => void patch('ai', { provider: e.target.value as typeof ai.provider })}><option value="openai">OpenAI</option><option value="groq">Groq</option><option value="deepseek">DeepSeek</option><option value="qwen">Qwen</option><option value="glm">GLM</option><option value="grok">Grok</option><option value="compatible">OpenAI-compatible</option></select></Field>
        <Field label="Model"><input value={ai.model} onChange={(e) => void patch('ai', { model: e.target.value })}/></Field>
        <Field label="Endpoint" span hint="Để trống khi dùng endpoint mặc định của provider."><input value={ai.endpoint} placeholder="https://api.example.com/v1" onChange={(e) => void patch('ai', { endpoint: e.target.value })}/></Field>
        <Field label="API key" span hint="Chỉ Main process nhận và mã hóa giá trị này."><div className="secret-input"><input type="password" autoComplete="off" value={apiKey} placeholder="••••••••••••••••" onChange={(e) => setApiKey(e.target.value)}/><button className="button secondary" onClick={() => void saveKey()}>Lưu key</button></div></Field>
      </div>
    </Card>
    <Card>
      <CardTitle title="Persona & an toàn" hint="Chỉ dẫn được áp dụng cho MC, DJ và auto-hype."/>
      <Field label="Persona"><textarea rows={5} value={ai.persona} onChange={(e) => void patch('ai', { persona: e.target.value })}/></Field>
      <div className="form-grid"><Field label="Giới hạn/phút"><input type="number" min="1" max="60" value={ai.rateLimitPerMinute} onChange={(e) => void patch('ai', { rateLimitPerMinute: Number(e.target.value) })}/></Field><Field label="Chu kỳ hype (giây)"><input type="number" min="30" max="900" value={ai.hypeIntervalSeconds} onChange={(e) => void patch('ai', { hypeIntervalSeconds: Number(e.target.value) })}/></Field></div>
      <Toggle checked={ai.contentFilter} onChange={(contentFilter) => void patch('ai', { contentFilter })} label="Lọc nội dung" description="Chặn nội dung nhạy cảm và prompt injection cơ bản."/>
      <Toggle checked={ai.autoHype} onChange={(autoHype) => void patch('ai', { autoHype })} label="Auto-hype" description="Chỉ nói khi speech queue trống và LIVE có hoạt động."/>
      <div className="form-grid"><Field label="Gom lời chào (giây)"><input type="number" min="2" max="30" value={ai.joinBatchSeconds} onChange={(e) => void patch('ai', { joinBatchSeconds: Number(e.target.value) })}/></Field><Field label="Báo giờ LIVE (phút)"><input type="number" min="5" max="120" value={ai.liveTimeMinutes} onChange={(e) => void patch('ai', { liveTimeMinutes: Number(e.target.value) })}/></Field></div>
    </Card>
    <Card>
      <CardTitle title="Tự động tương tác" hint="MC và DJ dùng chung hàng đợi, không nói chồng."/>
      <Toggle checked={ai.mcEnabled} onChange={(mcEnabled) => void patch('ai', { mcEnabled })} label="MC Luna" description="Chào thành viên, trả lời và cảm ơn quà."/>
      <Toggle checked={ai.djEnabled} onChange={(djEnabled) => void patch('ai', { djEnabled })} label="DJ Ryan" description="Hype nhạc, party và chuyển bài."/>
      <Toggle checked={ai.greetJoins} onChange={(greetJoins) => void patch('ai', { greetJoins })} label="Chào người mới theo nhóm"/>
      <Toggle checked={ai.commentReplies} onChange={(commentReplies) => void patch('ai', { commentReplies })} label="Trả lời câu hỏi/bình luận"/>
      <Toggle checked={ai.giftThanks} onChange={(giftThanks) => void patch('ai', { giftThanks })} label="Cảm ơn quà theo giá trị"/>
      <Toggle checked={ai.praiseTease} onChange={(praiseTease) => void patch('ai', { praiseTease })} label="Khen và trêu vui an toàn"/>
      <Toggle checked={ai.liveTime} onChange={(liveTime) => void patch('ai', { liveTime })} label="Thông báo thời lượng LIVE"/>
    </Card>
    <Card>
      <CardTitle title="TTS & hàng đợi giọng nói" hint="MC và DJ không bao giờ phát chồng tiếng."/>
      <div className="form-grid"><Field label="TTS provider"><select value={ai.ttsProvider} onChange={(e) => void patch('ai', { ttsProvider: e.target.value as typeof ai.ttsProvider })}><option value="edge">Edge TTS</option><option value="openai">OpenAI TTS</option></select></Field><Field label="Giọng"><input value={ai.ttsVoice} onChange={(e) => void patch('ai', { ttsVoice: e.target.value })}/></Field></div>
      <Field label={`Âm lượng · ${ai.ttsVolume}%`}><input type="range" min="0" max="100" value={ai.ttsVolume} onChange={(e) => void patch('ai', { ttsVolume: Number(e.target.value) })}/></Field>
      <button className="button secondary full" onClick={() => void bridge.testTts('Xin chào, đây là giọng nói thử của OrbitStage.').then(() => notify('Đã thêm câu thử vào hàng đợi TTS.'))}><Icon name="music" size={17}/>Nghe giọng thử</button>
    </Card>
    <Card>
      <CardTitle title="AI playground" hint="Prompt test không được phát ra stage."/>
      <Field label="Prompt"><textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}/></Field>
      <button className="button primary" disabled={testing || !prompt.trim()} onClick={() => void test()}>{testing ? <span className="spinner"/> : <Icon name="sparkles" size={17}/>}Chạy thử</button>
      <div className={`ai-result ${result ? 'has-result' : ''}`}>{result ? <><span>PHẢN HỒI {result.latencyMs ? `· ${result.latencyMs} ms` : ''}</span><p>{result.text}</p></> : <p>Kết quả an toàn sẽ hiển thị ở đây.</p>}</div>
    </Card>
  </div>;
}

function TestScreen({ notify }: { notify: (message: string, tone?: 'ok' | 'warn' | 'error') => void }) {
  const [type, setType] = useState<LiveEventType>('gift');
  const [name, setName] = useState('Minh Anh');
  const [message, setMessage] = useState('Chúc kênh ngày càng đông vui!');
  const [giftName, setGiftName] = useState('Galaxy Bloom');
  const [count, setCount] = useState(1);
  const [level, setLevel] = useState(12);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<{ type: LiveEventType; name: string; time: string }[]>([]);
  const eventTypes: { type: LiveEventType; label: string; symbol: string }[] = [{ type:'join',label:'Tham gia',symbol:'↗'},{type:'chat',label:'Bình luận',symbol:'◌'},{type:'follow',label:'Theo dõi',symbol:'+'},{type:'like',label:'Thả tim',symbol:'♥'},{type:'gift',label:'Tặng quà',symbol:'✦'}];
  const send = async () => {
    setSending(true);
    const event: FakeLiveEvent = { type, viewer: { name: name || 'Khách thử nghiệm', level }, message: type === 'chat' || type === 'gift' ? message : undefined, giftName: type === 'gift' ? giftName : undefined, giftCount: type === 'gift' ? count : undefined, diamonds: type === 'gift' ? count * 99 : undefined, likeCount: type === 'like' ? count * 10 : undefined };
    try { await bridge.fakeEvent(event); setHistory((items) => [{ type, name: event.viewer.name, time: new Date().toLocaleTimeString('vi-VN') }, ...items].slice(0, 6)); notify(`Đã gửi event ${type} vào pipeline.`); }
    catch (error) { notify(error instanceof Error ? error.message : 'Không thể gửi event.', 'error'); }
    finally { setSending(false); }
  };
  return <div className="screen-grid test-grid">
    <Card className="span-2 test-notice"><div><Icon name="test" size={24}/></div><p><strong>Sandbox an toàn</strong><span>Fake event đi qua cùng router, lọc spam và queue như TikFinity nhưng không gửi ngược ra TikTok.</span></p><span className="badge success">LOCAL ONLY</span></Card>
    <Card>
      <CardTitle title="Loại sự kiện" hint="Chọn event cần mô phỏng."/>
      <div className="event-types">{eventTypes.map((item) => <button key={item.type} className={type === item.type ? 'selected' : ''} onClick={() => setType(item.type)}><i>{item.symbol}</i><span>{item.label}</span></button>)}</div>
      <div className="form-grid">
        <Field label="Tên người xem"><input value={name} onChange={(e) => setName(e.target.value)}/></Field>
        <Field label="Level"><input type="number" min="1" max="99" value={level} onChange={(e) => setLevel(Number(e.target.value))}/></Field>
        {type === 'gift' && <Field label="Tên quà"><input value={giftName} onChange={(e) => setGiftName(e.target.value)}/></Field>}
        {(type === 'gift' || type === 'like') && <Field label={type === 'gift' ? 'Số lượng' : 'Cụm tim'}><input type="number" min="1" max="999" value={count} onChange={(e) => setCount(Number(e.target.value))}/></Field>}
        {(type === 'chat' || type === 'gift') && <Field label={type === 'gift' ? 'Lời chúc' : 'Nội dung chat'} span><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)}/></Field>}
      </div>
      <button className="button primary full large" disabled={sending} onClick={() => void send()}>{sending ? <span className="spinner"/> : <Icon name="play" size={18}/>}Phát event lên Stage</button>
    </Card>
    <div className="stack">
      <Card className="event-payload">
        <CardTitle title="Payload xem trước" action={<span className="badge neutral">VALIDATED</span>}/>
        <pre>{JSON.stringify({ type, viewer: { name, level }, ...(type === 'gift' ? { giftName, count, message } : {}), ...(type === 'chat' ? { message } : {}) }, null, 2)}</pre>
      </Card>
      <Card>
        <CardTitle title="Lịch sử phiên test" hint="Tối đa 6 event gần nhất."/>
        <div className="test-history">{history.length ? history.map((item, index) => <div key={`${item.time}-${index}`}><span className={`event-symbol ${item.type}`}>{eventTypes.find((entry) => entry.type === item.type)?.symbol}</span><p><strong>{item.name}</strong><small>{item.type}</small></p><time>{item.time}</time></div>) : <div className="empty-row">Chưa có event nào được gửi.</div>}</div>
      </Card>
    </div>
  </div>;
}


export default App;

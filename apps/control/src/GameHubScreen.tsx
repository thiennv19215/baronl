import { useEffect, useRef, useState, type ReactNode } from 'react';
import { bridge } from './bridge';
import type { AppConfig } from './types';
import './game-hub.css';

type GameId = 'dance-floor' | 'bamboo-battle';
type BambooTeam = 'green' | 'orange';

type Patch = <K extends keyof AppConfig>(section: K, patch: Partial<AppConfig[K]>, success?: string) => Promise<void>;

interface GameHubScreenProps {
  config: AppConfig;
  patch: Patch;
  notify: (message: string, tone?: 'ok' | 'warn' | 'error') => void;
}

const games = [
  {
    id: 'dance-floor' as const,
    order: 'GAME 01',
    title: 'Sàn nhảy tương tác',
    description: 'Dancer, âm nhạc, quà tặng và hiệu ứng LIVE trên sân khấu 3D.',
    tag: 'DANCE FLOOR',
  },
  {
    id: 'bamboo-battle' as const,
    order: 'GAME 02',
    title: 'Bamboo Battle',
    description: 'Hai phe đối đầu trực quan; like và gift tạo lực, skill và knockout.',
    tag: 'BATTLE 3D',
  },
];

const battleBotNames = [
  'An Nhiên', 'Bảo Long', 'Cá Mập Con', 'Diệu Linh', 'Gia Huy', 'Hải Yến', 'Khánh Vy', 'Linh Miu', 'Minh Anh',
  'Nam Phong', 'Ngọc Bích', 'Panda Mập', 'Quỳnh Chi', 'Ryan Fan', 'Sky Nguyễn', 'Thanh Tâm', 'Trúc Xinh', 'Tuấn Kiệt',
  'Uyên Nhi', 'Vân Mây', 'Xuân Mai', 'Yến Nhi', 'Zin Cool', 'Bé Bông', 'Cún Nhỏ', 'Đậu Đỏ', 'Gấu Trúc', 'Hana',
  'Ken Live', 'Mèo Mun', 'Nắng Hạ', 'Phúc An', 'Sao Khuya', 'Tí Nâu', 'Vũ Minh', 'Yumi',
] as const;

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card game-manager-card ${className}`}>{children}</section>;
}

function PanelTitle({ title, hint }: { title: string; hint?: string }) {
  return <div className="card-title"><div><h3>{title}</h3>{hint && <p>{hint}</p>}</div></div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string }) {
  return <div className="toggle-row"><div><strong>{label}</strong>{description && <span>{description}</span>}</div><button type="button" role="switch" aria-checked={checked} className={`switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}><span/></button></div>;
}

function GameCover({ id, compact = false }: { id: GameId; compact?: boolean }) {
  return <div className={`game-hub-cover ${id} ${compact ? 'compact' : ''}`} aria-hidden="true">
    {id === 'dance-floor' ? <>
      <span className="beam a"/><span className="beam b"/><span className="beam c"/>
      <b>ORBIT LIVE</b><i className="dancer one"/><i className="dancer two"/><i className="dancer three"/>
    </> : <>
      <span className="battle-meter"><i/></span><b>VS</b><i className="fighter green"/><i className="fighter orange"/><em className="impact">✦</em>
    </>}
  </div>;
}

export function GameHubScreen({ config, patch, notify }: GameHubScreenProps) {
  const stage = config.stage;
  const [managedGame, setManagedGame] = useState<GameId>();
  const [testing, setTesting] = useState<BambooTeam>();
  const [botRunning, setBotRunning] = useState(false);
  const [botCount, setBotCount] = useState(24);
  const [botEvents, setBotEvents] = useState(0);
  const botTimer = useRef<number>();

  const stopBotBattle = () => {
    if (botTimer.current) window.clearInterval(botTimer.current);
    botTimer.current = undefined;
    setBotRunning(false);
  };

  useEffect(() => () => {
    if (botTimer.current) window.clearInterval(botTimer.current);
  }, []);

  const activateGame = async (gameId: GameId) => {
    await patch('stage', { gameMode: gameId }, gameId === 'dance-floor' ? 'Đã kích hoạt Game 01 · Sàn nhảy.' : 'Đã kích hoạt Game 02 · Bamboo Battle.');
  };

  const startBotBattle = async () => {
    stopBotBattle();
    const roster = battleBotNames.slice(0, botCount).map((name, index) => ({
      id: `battle-bot-${index + 1}`,
      name,
      level: 5 + index % 35,
      team: index % 2 === 0 ? 'green' as const : 'orange' as const,
    }));
    try {
      await activateGame('bamboo-battle');
      await bridge.openStage();
      await bridge.gameAction('restart');
      await Promise.all(roster.map((bot) => bridge.fakeEvent({ type: 'chat', viewer: bot, message: bot.team === 'green' ? '1' : '2' })));
      setBotEvents(roster.length);
      setBotRunning(true);
      botTimer.current = window.setInterval(() => {
        const bot = roster[Math.floor(Math.random() * roster.length)];
        if (!bot) return;
        void (async () => {
          if (Math.random() < 0.2) {
            const diamonds = [1, 5, 10, 20][Math.floor(Math.random() * 4)] ?? 1;
            await bridge.fakeEvent({ type: 'gift', viewer: bot, giftName: diamonds >= 10 ? 'Tim pha lê' : 'Hoa hồng', giftCount: 1 + Math.floor(Math.random() * 3), diamonds });
          } else {
            await bridge.fakeEvent({ type: 'like', viewer: bot, likeCount: 10 + Math.floor(Math.random() * 111) });
          }
          setBotEvents((count) => count + 1);
        })().catch(() => stopBotBattle());
      }, 650);
      notify(`Đã thêm ${roster.length} người chơi giả vào Bamboo Battle.`);
    } catch (error) {
      stopBotBattle();
      notify(error instanceof Error ? error.message : 'Không thể bật người chơi giả.', 'error');
    }
  };

  const testBattle = async (team: BambooTeam) => {
    setTesting(team);
    const viewer = { id: `battle-test-${team}`, name: team === 'green' ? 'Chiến Binh Xanh' : 'Chiến Binh Cam', level: 12 };
    try {
      await activateGame('bamboo-battle');
      await bridge.openStage();
      await bridge.fakeEvent({ type: 'chat', viewer, message: team === 'green' ? '1' : '2' });
      await bridge.fakeEvent({ type: 'like', viewer, likeCount: 120 });
      await bridge.fakeEvent({ type: 'gift', viewer, giftName: 'Hoa hồng thử nghiệm', giftCount: 3, diamonds: 10 });
      notify(`Đã thử đòn đánh cho phe ${team === 'green' ? 'Xanh' : 'Cam'}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể chạy thử Bamboo Battle.', 'error');
    } finally {
      setTesting(undefined);
    }
  };

  if (!managedGame) {
    return <div className="screen-grid games-grid game-hub-screen">
      <Panel className="game-store-hero span-2">
        <div className="game-store-copy"><span className="eyebrow">GAME STORE</span><h2>Chọn game để quản lý</h2><p>Mỗi game có cấu hình riêng. Mở thẻ để chỉnh; game đang chạy được đánh dấu riêng và không bị đổi chỉ vì bạn xem cài đặt.</p></div>
        <div className="game-store-count"><strong>{games.length}</strong><span>GAME ĐÃ CÀI</span></div>
      </Panel>

      <div className="game-store-grid span-2">
        {games.map((game) => {
          const active = stage.gameMode === game.id;
          return <button type="button" className={`game-store-card ${active ? 'active' : ''}`} key={game.id} onClick={() => setManagedGame(game.id)}>
            <GameCover id={game.id}/>
            <div className="game-store-card-copy">
              <div className="game-store-meta"><span>{game.order}</span><em>{game.tag}</em></div>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <div className="game-store-footer"><span className={active ? 'running' : 'ready'}><i/>{active ? 'ĐANG CHẠY' : 'SẴN SÀNG'}</span><b>Mở quản lý →</b></div>
            </div>
          </button>;
        })}
      </div>
    </div>;
  }

  const game = games.find((item) => item.id === managedGame)!;
  const active = stage.gameMode === managedGame;

  return <div className="screen-grid games-grid game-manager-screen">
    <Panel className="game-manager-hero span-2">
      <button type="button" className="game-back-button" onClick={() => setManagedGame(undefined)}>← <span>Kho game</span></button>
      <GameCover id={managedGame} compact/>
      <div className="game-manager-copy"><div><span>{game.order}</span><em>{game.tag}</em></div><h2>{game.title}</h2><p>{game.description}</p></div>
      <div className="game-manager-actions">
        <span className={`game-runtime-pill ${active ? 'active' : ''}`}><i/>{active ? 'ĐANG CHẠY TRÊN STAGE' : 'CHƯA KÍCH HOẠT'}</span>
        <div><button type="button" className="button subtle" onClick={() => void bridge.openStage()}>Mở Stage</button><button type="button" className="button primary" disabled={active} onClick={() => void activateGame(managedGame)}>{active ? 'Đang sử dụng' : 'Kích hoạt game này'}</button></div>
      </div>
    </Panel>

    {managedGame === 'dance-floor' ? <>
      <Panel>
        <PanelTitle title="Giao diện Game 01" hint="Chọn phong cách riêng cho sàn nhảy."/>
        <div className="game-style-list">
          {([['orbit', 'Orbit', 'Neon nguyên bản'], ['club', 'Club', 'Quán bar 3D · sàn gỗ'], ['prism', 'Arena', 'Sàn lưới · TOP 3 · đông dancer']] as const).map(([value, title, hint]) => <button key={value} type="button" className={stage.danceFloorStyle === value ? 'selected' : ''} onClick={() => void patch('stage', { danceFloorStyle: value })}><i/><span><strong>{title}</strong><small>{hint}</small></span>{stage.danceFloorStyle === value && <b>✓</b>}</button>)}
        </div>
      </Panel>
      <Panel>
        <PanelTitle title="Cấu hình Sàn nhảy" hint="Chỉnh thoải mái kể cả khi Game 02 đang chạy."/>
        <Field label="Chuyển động camera"><select value={stage.cameraMode} onChange={(event) => void patch('stage', { cameraMode: event.target.value as typeof stage.cameraMode })}><option value="ambient">Ambient · lia nhẹ</option><option value="cinematic">Cinematic · lia rộng</option><option value="locked">Locked · cố định</option></select></Field>
        <Toggle checked={stage.threeDEnabled} onChange={(threeDEnabled) => void patch('stage', { threeDEnabled })} label="Bật Three.js" description="Tắt để chỉ dùng overlay 2D."/>
        <Toggle checked={stage.floorBright} onChange={(floorBright) => void patch('stage', { floorBright })} label="Sàn phản ứng nhạc"/>
        <Toggle checked={stage.lasers} onChange={(lasers) => void patch('stage', { lasers })} label="Laser & spotlight"/>
        <Toggle checked={stage.ledScreens} onChange={(ledScreens) => void patch('stage', { ledScreens })} label="Màn LED 3D"/>
        <Toggle checked={stage.topPodiums} onChange={(topPodiums) => void patch('stage', { topPodiums })} label="Bục TOP 1 / 2 / 3"/>
        <Toggle checked={stage.autoFitCrowd} onChange={(autoFitCrowd) => void patch('stage', { autoFitCrowd })} label="Tự giãn khi đông" description="Tự thêm hàng và giữ người mới/TOP trên sàn."/>
        <div className="form-grid"><Field label={`Số nhân vật · ${stage.maxFloorActors}`}><input type="range" min="8" max="80" step="1" value={stage.maxFloorActors} onChange={(event) => void patch('stage', { maxFloorActors: Number(event.target.value) })}/></Field><Field label={`Độ rộng sàn · ${stage.floorWidth}%`}><input type="range" min="80" max="110" step="1" value={stage.floorWidth} onChange={(event) => void patch('stage', { floorWidth: Number(event.target.value) })}/></Field></div>
      </Panel>
    </> : <>
      <Panel>
        <PanelTitle title="Luật & kiểm thử Bamboo Battle" hint="Các nút test sẽ tự kích hoạt Game 02 để Stage hiển thị đúng."/>
        <div className="battle-rules game-hub-rules"><div><b>1</b><span><strong>Vào phe Xanh</strong><small>Bình luận số 1</small></span></div><div><b>2</b><span><strong>Vào phe Cam</strong><small>Bình luận số 2</small></span></div><div><b>♥</b><span><strong>Like tạo lực</strong><small>Tích lũy sau khi chọn phe</small></span></div><div><b>🎁</b><span><strong>Gift tạo skill</strong><small>Jab · Combo · Heavy · Ultimate</small></span></div></div>
        <div className={`battle-bots ${botRunning ? 'running' : ''}`}><div className="battle-bot-status"><i/><span><strong>Người chơi giả tự động</strong><small>{botRunning ? `${botCount} người · ${botEvents} event` : 'Mô phỏng hai phe thả tim và gửi quà'}</small></span></div><label><span>Số người · {botCount}</span><input type="range" min="6" max="36" step="2" value={botCount} disabled={botRunning} onChange={(event) => setBotCount(Number(event.target.value))}/></label><button type="button" className={`button ${botRunning ? 'danger' : 'primary'}`} onClick={() => botRunning ? stopBotBattle() : void startBotBattle()}>{botRunning ? 'Dừng mô phỏng' : 'Bắt đầu mô phỏng'}</button></div>
        <div className="battle-test-actions"><button className="button secondary" disabled={Boolean(testing)} onClick={() => void testBattle('green')}>{testing === 'green' ? 'Đang thử…' : 'Thử phe Xanh'}</button><button className="button secondary orange" disabled={Boolean(testing)} onClick={() => void testBattle('orange')}>{testing === 'orange' ? 'Đang thử…' : 'Thử phe Cam'}</button><button className="button subtle" onClick={() => void bridge.gameAction('restart')}>Ván mới</button></div>
      </Panel>
      <Panel>
        <PanelTitle title="Cấu hình Bamboo Battle" hint="Cài đặt chỉ thuộc Game 02."/>
        <div className="form-grid"><Field label="Nhân vật phe Xanh"><select value={stage.bambooGreenCharacter} onChange={(event) => void patch('stage', { bambooGreenCharacter: event.target.value as typeof stage.bambooGreenCharacter })}><option value="bear">🐻 Gấu con</option><option value="dog">🐶 Chó con</option></select></Field><Field label="Nhân vật phe Cam"><select value={stage.bambooOrangeCharacter} onChange={(event) => void patch('stage', { bambooOrangeCharacter: event.target.value as typeof stage.bambooOrangeCharacter })}><option value="bear">🐻 Gấu con</option><option value="dog">🐶 Chó con</option></select></Field></div>
        <Field label={`Thời gian mỗi ván · ${stage.bambooRoundSeconds} giây`}><input type="range" min="30" max="300" step="10" value={stage.bambooRoundSeconds} onChange={(event) => void patch('stage', { bambooRoundSeconds: Number(event.target.value) })}/></Field>
        <Field label={`Sức mạnh Like · ${stage.bambooLikePower.toFixed(2)}`} hint="Mỗi lượt thích nhân với hệ số này."><input type="range" min="0.01" max="0.5" step="0.01" value={stage.bambooLikePower} onChange={(event) => void patch('stage', { bambooLikePower: Number(event.target.value) })}/></Field>
        <Field label={`Sức mạnh quà · ${stage.bambooGiftPower.toFixed(1)}`} hint="Kim cương × combo × hệ số."><input type="range" min="0.1" max="3" step="0.1" value={stage.bambooGiftPower} onChange={(event) => void patch('stage', { bambooGiftPower: Number(event.target.value) })}/></Field>
        <Toggle checked={stage.bambooAutoRestart} onChange={(bambooAutoRestart) => void patch('stage', { bambooAutoRestart })} label="Tự mở ván mới" description="Chờ 8 giây sau khi công bố kết quả."/>
      </Panel>
    </>}
  </div>;
}

import { bridge } from '../../../bridge';
import { GameField, GamePanel, GamePanelTitle, GameToggle } from '../components/GameUi';
import { GamePageHeader } from '../components/GamePageHeader';
import type { GameScreenProps } from '../types';
import { useBattleTester } from './useBattleTester';

export function BambooBattleManager({ config, patch, notify, active, onBack, onActivate }: GameScreenProps) {
  const stage = config.stage;
  const {
    testing,
    botRunning,
    botCount,
    botEvents,
    setBotCount,
    stopBotBattle,
    startBotBattle,
    testBattle,
  } = useBattleTester(patch, notify);

  return <section className="game-page bamboo-battle-page">
    <GamePageHeader gameId="bamboo-battle" active={active} onBack={onBack} onActivate={onActivate}/>

    <div className="game-page-content">
      <GamePanel>
        <GamePanelTitle title="Luật & kiểm thử Bamboo Battle" hint="Chỉ áp dụng cho Game 02."/>
        <div className="battle-rules game-hub-rules">
          <div><b>1</b><span><strong>Vào phe Xanh</strong><small>Bình luận số 1</small></span></div>
          <div><b>2</b><span><strong>Vào phe Cam</strong><small>Bình luận số 2</small></span></div>
          <div><b>♥</b><span><strong>Like tạo lực</strong><small>Tích lũy sau khi chọn phe</small></span></div>
          <div><b>🎁</b><span><strong>Gift tạo skill</strong><small>Jab · Combo · Heavy · Ultimate</small></span></div>
        </div>

        <div className={`battle-bots ${botRunning ? 'running' : ''}`}>
          <div className="battle-bot-status"><i/><span><strong>Người chơi giả tự động</strong><small>{botRunning ? `${botCount} người · ${botEvents} event` : 'Mô phỏng hai phe thả tim và gửi quà'}</small></span></div>
          <label><span>Số người · {botCount}</span><input type="range" min="6" max="36" step="2" value={botCount} disabled={botRunning} onChange={(event) => setBotCount(Number(event.target.value))}/></label>
          <button type="button" className={`button ${botRunning ? 'danger' : 'primary'}`} onClick={() => botRunning ? stopBotBattle() : void startBotBattle()}>
            {botRunning ? 'Dừng mô phỏng' : 'Bắt đầu mô phỏng'}
          </button>
        </div>

        <div className="battle-test-actions">
          <button className="button secondary" disabled={Boolean(testing)} onClick={() => void testBattle('green')}>{testing === 'green' ? 'Đang thử…' : 'Thử phe Xanh'}</button>
          <button className="button secondary orange" disabled={Boolean(testing)} onClick={() => void testBattle('orange')}>{testing === 'orange' ? 'Đang thử…' : 'Thử phe Cam'}</button>
          <button className="button subtle" onClick={() => void bridge.gameAction('restart')}>Ván mới</button>
        </div>
      </GamePanel>

      <GamePanel>
        <GamePanelTitle title="Thiết lập Bamboo Battle" hint="Toàn bộ tùy chọn bên dưới chỉ thuộc Game 02."/>
        <div className="form-grid">
          <GameField label="Nhân vật phe Xanh">
            <select value={stage.bambooGreenCharacter} onChange={(event) => void patch('stage', { bambooGreenCharacter: event.target.value as typeof stage.bambooGreenCharacter })}>
              <option value="bear">🐻 Gấu con</option>
              <option value="dog">🐶 Chó con</option>
            </select>
          </GameField>
          <GameField label="Nhân vật phe Cam">
            <select value={stage.bambooOrangeCharacter} onChange={(event) => void patch('stage', { bambooOrangeCharacter: event.target.value as typeof stage.bambooOrangeCharacter })}>
              <option value="bear">🐻 Gấu con</option>
              <option value="dog">🐶 Chó con</option>
            </select>
          </GameField>
        </div>
        <GameField label={`Thời gian mỗi ván · ${stage.bambooRoundSeconds} giây`}>
          <input type="range" min="30" max="300" step="10" value={stage.bambooRoundSeconds} onChange={(event) => void patch('stage', { bambooRoundSeconds: Number(event.target.value) })}/>
        </GameField>
        <GameField label={`Sức mạnh Like · ${stage.bambooLikePower.toFixed(2)}`} hint="Mỗi lượt thích nhân với hệ số này.">
          <input type="range" min="0.01" max="0.5" step="0.01" value={stage.bambooLikePower} onChange={(event) => void patch('stage', { bambooLikePower: Number(event.target.value) })}/>
        </GameField>
        <GameField label={`Sức mạnh quà · ${stage.bambooGiftPower.toFixed(1)}`} hint="Kim cương × combo × hệ số.">
          <input type="range" min="0.1" max="3" step="0.1" value={stage.bambooGiftPower} onChange={(event) => void patch('stage', { bambooGiftPower: Number(event.target.value) })}/>
        </GameField>
        <GameToggle checked={stage.bambooAutoRestart} onChange={(bambooAutoRestart) => void patch('stage', { bambooAutoRestart })} label="Tự mở ván mới" description="Chờ 8 giây sau khi công bố kết quả."/>
      </GamePanel>
    </div>
  </section>;
}

import { useState } from 'react';
import { bridge } from '../../bridge';
import { BambooBattleManager } from './bamboo-battle/BambooBattleManager';
import { GameCover } from './components/GameCover';
import { GamePanel } from './components/GameUi';
import { DanceFloorManager } from './dance-floor/DanceFloorManager';
import { gameCatalog, getGameDefinition } from './gameCatalog';
import type { GameId, GameManagerProps } from './types';
import '../../game-hub.css';

export function GameHubScreen({ config, patch, notify }: GameManagerProps) {
  const stage = config.stage;
  const [managedGame, setManagedGame] = useState<GameId>();

  const activateGame = async (gameId: GameId) => {
    await patch(
      'stage',
      { gameMode: gameId },
      gameId === 'dance-floor'
        ? 'Đã kích hoạt Game 01 · Sàn nhảy.'
        : 'Đã kích hoạt Game 02 · Bamboo Battle.',
    );
  };

  if (!managedGame) {
    return <div className="screen-grid games-grid game-hub-screen">
      <GamePanel className="game-store-hero span-2">
        <div className="game-store-copy">
          <span className="eyebrow">GAME STORE</span>
          <h2>Chọn game để quản lý</h2>
          <p>Mỗi game có cấu hình riêng. Mở thẻ để chỉnh; game đang chạy được đánh dấu riêng và không bị đổi chỉ vì bạn xem cài đặt.</p>
        </div>
        <div className="game-store-count"><strong>{gameCatalog.length}</strong><span>GAME ĐÃ CÀI</span></div>
      </GamePanel>

      <div className="game-store-grid span-2">
        {gameCatalog.map((game) => {
          const active = stage.gameMode === game.id;
          return <button
            type="button"
            className={`game-store-card ${active ? 'active' : ''}`}
            key={game.id}
            onClick={() => setManagedGame(game.id)}
          >
            <GameCover id={game.id}/>
            <div className="game-store-card-copy">
              <div className="game-store-meta"><span>{game.order}</span><em>{game.tag}</em></div>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <div className="game-store-footer">
                <span className={active ? 'running' : 'ready'}><i/>{active ? 'ĐANG CHẠY' : 'SẴN SÀNG'}</span>
                <b>Mở quản lý →</b>
              </div>
            </div>
          </button>;
        })}
      </div>
    </div>;
  }

  const game = getGameDefinition(managedGame);
  const active = stage.gameMode === managedGame;

  return <div className="screen-grid games-grid game-manager-screen">
    <GamePanel className="game-manager-hero span-2">
      <button type="button" className="game-back-button" onClick={() => setManagedGame(undefined)}>← <span>Kho game</span></button>
      <GameCover id={managedGame} compact/>
      <div className="game-manager-copy">
        <div><span>{game.order}</span><em>{game.tag}</em></div>
        <h2>{game.title}</h2>
        <p>{game.description}</p>
      </div>
      <div className="game-manager-actions">
        <span className={`game-runtime-pill ${active ? 'active' : ''}`}><i/>{active ? 'ĐANG CHẠY TRÊN STAGE' : 'CHƯA KÍCH HOẠT'}</span>
        <div>
          <button type="button" className="button subtle" onClick={() => void bridge.openStage()}>Mở Stage</button>
          <button type="button" className="button primary" disabled={active} onClick={() => void activateGame(managedGame)}>{active ? 'Đang sử dụng' : 'Kích hoạt game này'}</button>
        </div>
      </div>
    </GamePanel>

    {managedGame === 'dance-floor'
      ? <DanceFloorManager config={config} patch={patch} notify={notify}/>
      : <BambooBattleManager config={config} patch={patch} notify={notify}/>
    }
  </div>;
}

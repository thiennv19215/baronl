import { useState } from 'react';
import { BambooBattleManager } from './bamboo-battle/BambooBattleManager';
import { GameCover } from './components/GameCover';
import { DanceFloorManager } from './dance-floor/DanceFloorManager';
import { gameCatalog } from './gameCatalog';
import type { GameId, GameManagerProps } from './types';
import './styles/game-hub.css';

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
    return <section className="game-hub-feature" aria-label="OrbitStage Game Store">
      <div className="game-store-only" aria-label="Kho game đã cài">
        <div className="game-store-grid">
          {gameCatalog.map((game) => {
            const active = stage.gameMode === game.id;
            return <button
              type="button"
              className={`game-store-card ${game.id} ${active ? 'active' : ''}`}
              key={game.id}
              onClick={() => setManagedGame(game.id)}
            >
              <GameCover id={game.id}/>
              <div className="game-store-card-copy">
                <div className="game-store-meta"><span>{game.order}</span><em>{game.tag}</em></div>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <div className="game-store-footer">
                  <span className={active ? 'running' : 'ready'}><i/>{active ? 'ĐANG CHẠY' : 'SẴN SÀNG'}</span>
                  <b>Mở game →</b>
                </div>
              </div>
            </button>;
          })}
        </div>
      </div>
    </section>;
  }

  if (managedGame === 'dance-floor') {
    return <section className="game-hub-feature" aria-label="OrbitStage Game Store">
      <DanceFloorManager
        config={config}
        patch={patch}
        notify={notify}
        active={stage.gameMode === 'dance-floor'}
        onBack={() => setManagedGame(undefined)}
        onActivate={() => activateGame('dance-floor')}
      />
    </section>;
  }

  return <section className="game-hub-feature" aria-label="OrbitStage Game Store">
    <BambooBattleManager
      config={config}
      patch={patch}
      notify={notify}
      active={stage.gameMode === 'bamboo-battle'}
      onBack={() => setManagedGame(undefined)}
      onActivate={() => activateGame('bamboo-battle')}
    />
  </section>;
}

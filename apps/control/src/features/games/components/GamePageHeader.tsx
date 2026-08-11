import { bridge } from '../../../bridge';
import { getGameDefinition } from '../gameCatalog';
import type { GameId } from '../types';
import { GameCover } from './GameCover';

interface GamePageHeaderProps {
  gameId: GameId;
  active: boolean;
  onBack: () => void;
  onActivate: () => Promise<void> | void;
}

export function GamePageHeader({ gameId, active, onBack, onActivate }: GamePageHeaderProps) {
  const game = getGameDefinition(gameId);

  return <header className={`game-page-header ${gameId}`}>
    <button type="button" className="game-page-back" onClick={onBack}>← Kho game</button>
    <GameCover id={gameId} compact/>
    <div className="game-page-title">
      <div><span>{game.order}</span><em>{game.tag}</em></div>
      <h1>{game.title}</h1>
      <p>{game.description}</p>
    </div>
    <div className="game-page-actions">
      <span className={`game-runtime-pill ${active ? 'active' : ''}`}><i/>{active ? 'ĐANG CHẠY' : 'CHƯA KÍCH HOẠT'}</span>
      <div>
        <button type="button" className="button subtle" onClick={() => void bridge.openStage()}>Mở Stage</button>
        <button type="button" className="button primary" disabled={active} onClick={() => void onActivate()}>{active ? 'Đang sử dụng' : 'Kích hoạt game này'}</button>
      </div>
    </div>
  </header>;
}

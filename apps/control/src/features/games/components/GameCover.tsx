import type { GameId } from '../types';

export function GameCover({ id, compact = false }: { id: GameId; compact?: boolean }) {
  return <div className={`game-hub-cover ${id} ${compact ? 'compact' : ''}`} aria-hidden="true">
    {id === 'dance-floor' ? <>
      <span className="beam a"/>
      <span className="beam b"/>
      <span className="beam c"/>
      <b>ORBIT LIVE</b>
      <i className="dancer one"/>
      <i className="dancer two"/>
      <i className="dancer three"/>
    </> : <>
      <span className="battle-meter"><i/></span>
      <b>VS</b>
      <i className="fighter green"/>
      <i className="fighter orange"/>
      <em className="impact">✦</em>
    </>}
  </div>;
}

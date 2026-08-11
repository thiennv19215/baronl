import type { CSSProperties } from 'react';
import { bambooTeamPlayers, type BambooBattleState, type BambooPlayer, type BambooTeam } from './bambooBattle';
import type { StageConnection } from './types';

interface BambooBattleProps {
  state: BambooBattleState;
  connection: StageConnection;
  viewerCount: number;
}

const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });
const teamName = (team: BambooTeam): string => team === 'green' ? 'PHE XANH' : 'PHE CAM';

function PandaPlayer({ player, index }: { player: BambooPlayer; index: number }) {
  const style = { '--panda-index': index } as CSSProperties;
  return <div className="bamboo-player" style={style} title={`${player.name} · ${Math.round(player.contribution)} lực`}>
    <span className="bamboo-player-name"><b>{player.name}</b><small>⚡{Math.round(player.contribution)}</small></span>
    <i className="bamboo-panda">{player.avatar && <img src={player.avatar} alt=""/>}<b/><em/><span/></i>
    <i className="bamboo-shadow"/>
  </div>;
}

function TeamRaft({ team, players, power }: { team: BambooTeam; players: BambooPlayer[]; power: number }) {
  const visible = players.slice(0, 12);
  return <div className={`bamboo-team bamboo-team-${team}`}>
    <div className="bamboo-team-label"><span>{team === 'green' ? '1' : '2'}</span><p><strong>{teamName(team)}</strong><small>{players.length} chiến binh · {compact.format(Math.round(power))} lực</small></p></div>
    <div className="bamboo-raft"><i/><i/><i/><i/><i/><i/><i/><i/></div>
    <div className="bamboo-players">
      {visible.map((player, index) => <PandaPlayer key={player.id} player={player} index={index}/>)}
      {visible.length === 0 && <div className="bamboo-empty-team"><b>GÕ {team === 'green' ? '1' : '2'}</b><span>để chiếm vị trí đầu tiên</span></div>}
      {players.length > visible.length && <span className="bamboo-more">+{players.length - visible.length}</span>}
    </div>
  </div>;
}

export function BambooBattle({ state, connection, viewerCount }: BambooBattleProps) {
  const green = bambooTeamPlayers(state, 'green');
  const orange = bambooTeamPlayers(state, 'orange');
  const leaders = [...green, ...orange].sort((a, b) => b.contribution - a.contribution).slice(0, 3);
  const seconds = Math.ceil(state.remainingMs / 1_000);
  const minutes = Math.floor(seconds / 60);
  const greenPercent = Math.max(4, Math.min(96, 50 + state.position));
  const style = { '--battle-shift': `${state.position * 0.18}cqw`, '--green-percent': `${greenPercent}%` } as CSSProperties;
  const result = state.winner === 'draw' ? 'HAI PHE HÒA NHAU' : state.winner ? `${teamName(state.winner)} CHIẾN THẮNG!` : '';

  return <section className="bamboo-stage" style={style} aria-label="Game Đại chiến bè tre">
    <div className="bamboo-sky"><i/><i/><i/></div><div className="bamboo-forest back"/><div className="bamboo-forest front"/>
    <header className="bamboo-header">
      <div className="bamboo-live"><i className={connection === 'connected' ? 'on' : ''}/><span>LIVE</span><b>{compact.format(viewerCount)}</b></div>
      <div className="bamboo-title"><small>ORBITSTAGE GAME 02</small><strong>ĐẠI CHIẾN BÈ TRE</strong><span>VÁN {Math.max(1, state.round)}</span></div>
      <div className={`bamboo-clock ${seconds <= 10 ? 'urgent' : ''}`}><small>THỜI GIAN</small><b>{minutes}:{String(seconds % 60).padStart(2, '0')}</b></div>
    </header>

    <div className="bamboo-instructions"><span><b>1</b> THAM GIA PHE XANH</span><i>GÕ PHÍM ĐỂ CHỌN PHE</i><span><b>2</b> THAM GIA PHE CAM</span></div>

    <div className="bamboo-power-board">
      <div className="bamboo-power-label green"><span>1</span><p><b>{compact.format(Math.round(state.teams.green.power))}</b><small>LỰC ĐẨY</small></p></div>
      <div className="bamboo-power-meter"><i/><span className="green"/><span className="orange"/><b/></div>
      <div className="bamboo-power-label orange"><p><b>{compact.format(Math.round(state.teams.orange.power))}</b><small>LỰC ĐẨY</small></p><span>2</span></div>
    </div>

    <div className="bamboo-arena">
      <div className="bamboo-river"><i/><i/><i/><i/></div>
      <TeamRaft team="green" players={green} power={state.teams.green.power}/>
      <TeamRaft team="orange" players={orange} power={state.teams.orange.power}/>
      <div className="bamboo-center-line"><span>VS</span></div>
      {state.impact && <div key={state.impact.id} className={`bamboo-impact ${state.impact.team} ${state.impact.kind}`}><span>{state.impact.kind === 'gift' ? '🎁' : state.impact.kind === 'like' ? '♥' : '✦'}</span><p><b>{state.impact.name}</b><small>{state.impact.label}</small></p><strong>+{Math.max(1, Math.round(state.impact.power))}</strong></div>}
    </div>

    <aside className="bamboo-ranking"><strong>🏆 CHIẾN BINH NỔI BẬT</strong>{leaders.length ? leaders.map((player, index) => <div key={player.id}><span>{index + 1}</span><p><b>{player.name}</b><small>{teamName(player.team)}</small></p><em>{Math.round(player.contribution)} ⚡</em></div>) : <small>Chưa có người chơi</small>}</aside>

    <footer className="bamboo-footer"><div><span>♥</span><p><b>THẢ TIM</b><small>Tăng lực nhẹ cho phe</small></p></div><i/><div><span>🎁</span><p><b>TẶNG QUÀ</b><small>Tạo cú đẩy cực mạnh</small></p></div></footer>

    {state.status === 'finished' && <div className={`bamboo-result ${state.winner ?? 'draw'}`}><div><small>KẾT THÚC VÁN {state.round}</small><h2>{result}</h2><p>{state.winner === 'draw' ? 'Cả hai phe giữ bè cân bằng.' : `Tổng lực ${compact.format(Math.round(state.teams[state.winner!].power))} điểm.`}</p>{state.settings.autoRestart && <span>Ván mới bắt đầu sau ít giây…</span>}</div></div>}
  </section>;
}

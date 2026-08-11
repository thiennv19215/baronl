import type { CSSProperties } from 'react';
import { bambooTeamPlayers, type BambooBattleState } from './bambooBattle';
import { skillLabel } from './bambooBattleEffects';
import type { StageConnection } from './types';
import { BambooBattle3D } from './BambooBattle3D';
import './BambooBattleV2.css';
import './BambooBattleFallback.css';

interface BambooBattleProps {
  state: BambooBattleState;
  connection: StageConnection;
  viewerCount: number;
  greenCharacter: 'bear' | 'dog';
  orangeCharacter: 'bear' | 'dog';
}

const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });
const lowQualityFallback = new URLSearchParams(window.location.search).get('quality') === 'low';

function BambooBattleFallback({ greenCharacter, orangeCharacter }: Pick<BambooBattleProps, 'greenCharacter' | 'orangeCharacter'>) {
  return <div className="bamboo-battle-3d bamboo-battle-3d-fallback" data-webgl-fallback="true" aria-hidden="true">
    <span className="bamboo-fallback-fighter green">{greenCharacter === 'bear' ? '🐻' : '🐶'}</span>
    <b className="bamboo-fallback-vs">VS</b>
    <span className="bamboo-fallback-fighter orange">{orangeCharacter === 'bear' ? '🐻' : '🐶'}</span>
    <small className="bamboo-fallback-note">CHẾ ĐỘ 2D · WEBGL KHÔNG KHẢ DỤNG</small>
  </div>;
}

export function BambooBattle({ state, connection, viewerCount, greenCharacter, orangeCharacter }: BambooBattleProps) {
  const green = bambooTeamPlayers(state, 'green');
  const orange = bambooTeamPlayers(state, 'orange');
  const greenMvp = green[0];
  const orangeMvp = orange[0];
  const seconds = Math.ceil(state.remainingMs / 1_000);
  const minutes = Math.floor(seconds / 60);
  const greenPercent = Math.max(4, Math.min(96, 50 + state.position));
  const style = { '--green-percent': `${greenPercent}%` } as CSSProperties;
  const result = state.winner === 'draw' ? 'HAI PHE HÒA NHAU' : state.winner === 'green' ? 'PHE XANH CHIẾN THẮNG!' : state.winner === 'orange' ? 'PHE CAM CHIẾN THẮNG!' : '';

  return <section className="bamboo-v2" style={style} aria-label="Bamboo Battle V2">
    {lowQualityFallback
      ? <BambooBattleFallback greenCharacter={greenCharacter} orangeCharacter={orangeCharacter}/>
      : <BambooBattle3D state={state} greenCharacter={greenCharacter} orangeCharacter={orangeCharacter}/>
    }

    <div className="bamboo-v2-hud">
      <div className="bamboo-v2-top">
        <div className="bamboo-v2-team green">
          <strong>{greenCharacter === 'bear' ? '🐻' : '🐶'} PHE XANH</strong>
          <b>{compact.format(Math.round(state.teams.green.power))} ⚡</b>
        </div>
        <div className="bamboo-v2-clock">{minutes}:{String(seconds % 60).padStart(2, '0')}</div>
        <div className="bamboo-v2-team orange">
          <strong>PHE CAM {orangeCharacter === 'bear' ? '🐻' : '🐶'}</strong>
          <b>{compact.format(Math.round(state.teams.orange.power))} ⚡</b>
        </div>
      </div>
      <div className="bamboo-v2-meter"><i/></div>
      <div className="bamboo-v2-vs">VS</div>

      {state.impact && <div key={state.impact.id} className={`bamboo-v2-event ${state.impact.skill}`}>
        <strong>{skillLabel(state.impact.skill)}</strong>
        <b>{state.impact.name}</b>
        <small>{state.impact.label}{state.impact.diamonds > 0 ? ` · ${compact.format(state.impact.diamonds)} 💎` : ''}</small>
      </div>}

      <div className="bamboo-v2-bottom">
        <div className="bamboo-v2-mvp green">👑 MVP XANH{greenMvp ? <><b>{greenMvp.name}</b><span>{Math.round(greenMvp.contribution)} ⚡</span></> : <b>Đang chờ...</b>}</div>
        <div className="bamboo-v2-mvp orange">MVP CAM 👑{orangeMvp ? <><b>{orangeMvp.name}</b><span>{Math.round(orangeMvp.contribution)} ⚡</span></> : <b>Đang chờ...</b>}</div>
      </div>
      <div className="bamboo-v2-join">GÕ <b>1</b> CHỌN XANH · GÕ <b>2</b> CHỌN CAM · {connection === 'connected' ? `LIVE ${compact.format(viewerCount)}` : 'ĐANG KẾT NỐI'}</div>
    </div>

    {state.status === 'finished' && <div className="bamboo-v2-result"><div><small>KẾT THÚC VÁN {state.round}</small><h2>{result}</h2><p>{state.settings.autoRestart ? 'Ván mới sẽ tự bắt đầu.' : 'Chờ bắt đầu ván mới.'}</p></div></div>}
  </section>;
}

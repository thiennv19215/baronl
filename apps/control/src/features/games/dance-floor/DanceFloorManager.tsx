import type { GameManagerProps } from '../types';
import { GameField, GamePanel, GamePanelTitle, GameToggle } from '../components/GameUi';

const floorStyles = [
  ['orbit', 'Orbit', 'Neon nguyên bản'],
  ['club', 'Club', 'Quán bar 3D · sàn gỗ'],
  ['prism', 'Arena', 'Sàn lưới · TOP 3 · đông dancer'],
] as const;

export function DanceFloorManager({ config, patch }: GameManagerProps) {
  const stage = config.stage;

  return <>
    <GamePanel>
      <GamePanelTitle title="Giao diện Game 01" hint="Chọn phong cách riêng cho sàn nhảy."/>
      <div className="game-style-list">
        {floorStyles.map(([value, title, hint]) => <button
          key={value}
          type="button"
          className={stage.danceFloorStyle === value ? 'selected' : ''}
          onClick={() => void patch('stage', { danceFloorStyle: value })}
        >
          <i/>
          <span><strong>{title}</strong><small>{hint}</small></span>
          {stage.danceFloorStyle === value && <b>✓</b>}
        </button>)}
      </div>
    </GamePanel>

    <GamePanel>
      <GamePanelTitle title="Cấu hình Sàn nhảy" hint="Chỉnh thoải mái kể cả khi Game 02 đang chạy."/>
      <GameField label="Chuyển động camera">
        <select value={stage.cameraMode} onChange={(event) => void patch('stage', { cameraMode: event.target.value as typeof stage.cameraMode })}>
          <option value="ambient">Ambient · lia nhẹ</option>
          <option value="cinematic">Cinematic · lia rộng</option>
          <option value="locked">Locked · cố định</option>
        </select>
      </GameField>
      <GameToggle checked={stage.threeDEnabled} onChange={(threeDEnabled) => void patch('stage', { threeDEnabled })} label="Bật Three.js" description="Tắt để chỉ dùng overlay 2D."/>
      <GameToggle checked={stage.floorBright} onChange={(floorBright) => void patch('stage', { floorBright })} label="Sàn phản ứng nhạc"/>
      <GameToggle checked={stage.lasers} onChange={(lasers) => void patch('stage', { lasers })} label="Laser & spotlight"/>
      <GameToggle checked={stage.ledScreens} onChange={(ledScreens) => void patch('stage', { ledScreens })} label="Màn LED 3D"/>
      <GameToggle checked={stage.topPodiums} onChange={(topPodiums) => void patch('stage', { topPodiums })} label="Bục TOP 1 / 2 / 3"/>
      <GameToggle checked={stage.autoFitCrowd} onChange={(autoFitCrowd) => void patch('stage', { autoFitCrowd })} label="Tự giãn khi đông" description="Tự thêm hàng và giữ người mới/TOP trên sàn."/>
      <div className="form-grid">
        <GameField label={`Số nhân vật · ${stage.maxFloorActors}`}>
          <input type="range" min="8" max="80" step="1" value={stage.maxFloorActors} onChange={(event) => void patch('stage', { maxFloorActors: Number(event.target.value) })}/>
        </GameField>
        <GameField label={`Độ rộng sàn · ${stage.floorWidth}%`}>
          <input type="range" min="80" max="110" step="1" value={stage.floorWidth} onChange={(event) => void patch('stage', { floorWidth: Number(event.target.value) })}/>
        </GameField>
      </div>
    </GamePanel>
  </>;
}

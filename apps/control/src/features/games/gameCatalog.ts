import type { GameDefinition } from './types';

export const gameCatalog: readonly GameDefinition[] = [
  {
    id: 'dance-floor',
    order: 'GAME 01',
    title: 'Sàn nhảy tương tác',
    description: 'Dancer, âm nhạc, quà tặng và hiệu ứng LIVE trên sân khấu 3D.',
    tag: 'DANCE FLOOR',
  },
  {
    id: 'bamboo-battle',
    order: 'GAME 02',
    title: 'Bamboo Battle',
    description: 'Hai phe đối đầu trực quan; like và gift tạo lực, skill và knockout.',
    tag: 'BATTLE 3D',
  },
] as const;

export function getGameDefinition(gameId: GameDefinition['id']) {
  const game = gameCatalog.find((item) => item.id === gameId);
  if (!game) throw new Error(`Unknown game: ${gameId}`);
  return game;
}

import type { AppConfig } from '../../types';

export type GameId = 'dance-floor' | 'bamboo-battle';
export type BambooTeam = 'green' | 'orange';
export type Notify = (message: string, tone?: 'ok' | 'warn' | 'error') => void;

export type PatchConfig = <K extends keyof AppConfig>(
  section: K,
  patch: Partial<AppConfig[K]>,
  success?: string,
) => Promise<void>;

export interface GameManagerProps {
  config: AppConfig;
  patch: PatchConfig;
  notify: Notify;
}

export interface GameDefinition {
  id: GameId;
  order: string;
  title: string;
  description: string;
  tag: string;
}

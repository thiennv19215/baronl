import type { OrbitStageStageFacade } from './types';

declare global {
  interface Window {
    orbitStage?: OrbitStageStageFacade;
  }
}

export {};

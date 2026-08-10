import type { OrbitStageFacade } from './types';

declare global {
  interface Window {
    orbitStage?: OrbitStageFacade;
  }
}

export {};

# Control Room Code Structure

This document explains where Control Room code lives and how to extend it without turning `App.tsx` into another monolith.

## Top-level responsibilities

```text
apps/control/src/
├─ main.tsx                 # renderer bootstrap; mounts one App root
├─ App.tsx                  # Control shell, routing, shared config/runtime state
├─ bridge.ts                # typed renderer bridge to Electron preload/Main
├─ types.ts                 # renderer-facing shared types
├─ lib/
│  └─ model.ts              # config defaults/merge helpers
├─ features/
│  └─ games/                # Game Store + per-game management screens
└─ styles.css               # global Control Room styles
```

`main.tsx` mounts only `App`. Feature screens are routed by `App.tsx`; they do not mount independent React roots or overlay the shell.

## Game feature

```text
apps/control/src/features/games/
├─ index.ts
├─ GameHubScreen.tsx
├─ gameCatalog.ts
├─ types.ts
├─ README.md
├─ components/
│  ├─ GameCover.tsx
│  ├─ GamePageHeader.tsx
│  └─ GameUi.tsx
├─ styles/
│  └─ game-hub.css
├─ dance-floor/
│  └─ DanceFloorManager.tsx
└─ bamboo-battle/
   ├─ BambooBattleManager.tsx
   ├─ useBattleTester.ts
   └─ battleBots.ts
```

### Routing boundary

`App.tsx` owns `screen`, config state, runtime state, `patchConfig`, notifications and the shared sidebar/topbar. For the Game route it renders:

```tsx
screen === 'games' && (
  <GameHubScreen config={config} patch={patchConfig} notify={notify} />
)
```

Because `GameHubScreen` only exists while the Game route is active, leaving the Game tab unmounts its local manager-navigation state. Returning to Game always starts at the two-card Store.

### `GameHubScreen.tsx`

Owns Game workspace navigation only:

- renders installed Store cards;
- remembers which game screen is open while the Game route is active;
- shows which game is active on Stage;
- exposes the explicit `Kích hoạt game này` action through each game page;
- delegates settings/test UI to the selected game manager.

It must not contain Dance Floor/Bamboo-specific settings or fake-event behavior.

### `gameCatalog.ts`

Single source of truth for installed-game metadata shown in the Store: id, display order, title, description and tag.

### `components/`

Presentation shared by more than one game. Shared components must not contain gameplay rules.

### `dance-floor/`

Everything specific to Game 01 Control UI lives here. Stage rendering remains in the Stage app.

### `bamboo-battle/`

Everything specific to Game 02 Control UI lives here:

- `BambooBattleManager.tsx`: settings and test controls;
- `useBattleTester.ts`: fake-player/event simulation behavior;
- `battleBots.ts`: test fixture names only.

Actual Bamboo Battle reducer/rendering remains in `apps/stage/src`.

## Cross-app boundary

```text
Control Room
   │ config / test commands
   ▼
Electron bridge / Main
   │ normalized LIVE events + config
   ▼
Stage
   ├─ Dance Floor rendering
   └─ Bamboo Battle gameplay/rendering
```

Control configures and tests games. It must not duplicate Stage gameplay state or rendering logic.

## Rules for adding a new game

1. Add the id to `GameId` in `features/games/types.ts`.
2. Add Store metadata to `features/games/gameCatalog.ts`.
3. Create a dedicated directory such as `features/games/game-03/`.
4. Put the game's Control UI in its manager component.
5. Put game-specific test helpers beside that manager.
6. Add one manager dispatch in `GameHubScreen.tsx`.
7. Extend the Stage/service runtime for the new `gameMode`.
8. Never make opening a Store card switch the LIVE game automatically.
9. Extend Playwright coverage for Store → game → back and route exit/re-entry.

## Naming convention

Use feature-first names instead of generic names:

- good: `BambooBattleManager.tsx`, `useBattleTester.ts`, `DanceFloorManager.tsx`;
- avoid: `Game2.tsx`, `helpers.ts`, `utils2.ts`, `data.ts` when responsibility is unclear.

A contributor should be able to infer a file's purpose from its path and filename without opening it.

## CI validation

`.github/workflows/ci.yml` validates pull requests with Node 22.12.0:

1. `npm ci`;
2. workspace TypeScript checks;
3. build `@orbitstage/shared` for workspace tests;
4. full Vitest suite;
5. required asset registry audit;
6. builds for `shared`, `live-service`, `control`, `stage`, and `desktop`;
7. browser Playwright smoke for the two-card Game Store and route reset;
8. browser Stage smoke at 540×960 with Bamboo Three.js + gift skill rendering;
9. Electron E2E under Xvfb/SwiftShader for preload isolation, the real 540×960 Stage window, Three.js, IPC fake LIVE events, local AI/TTS stubs, Bamboo V2 and bot simulation;
10. upload UI screenshots and the Playwright report.

The asset registry audit is a hard CI gate. Bytes/hash drift must fail the workflow.

The Electron suite uses Chromium SwiftShader on Linux CI so 3D behavior is validated with a deterministic software GPU instead of depending on the hosted runner's display driver. Production secret storage is not weakened for CI: `safeStorage` remains mandatory for persisted keys, while the E2E process may resolve a test-only AI key only when `ORBITSTAGE_E2E=1`.

## Stage WebGL resilience

Stage probes the same Three.js `WebGLRenderer` configuration it will use before bootstrapping the main Stage app. If WebGL cannot be created, it switches to low-quality mode before importing the Stage UI. Bamboo Battle provides a lightweight 2D arena fallback so HUD/game state can remain visible instead of leaving a blank Stage.

## Current migration state

The old Game implementation has been removed from `App.tsx`. `features/games` is the only Control implementation for Game 01 / Game 02 management. The remaining non-game screens are still defined in `App.tsx` and can be migrated into their own `features/*` directories later without affecting the Game boundary.

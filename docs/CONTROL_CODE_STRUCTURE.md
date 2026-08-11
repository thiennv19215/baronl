# Control Room Code Structure

This document explains where Control Room code lives and how to extend it without turning `App.tsx` into another monolith.

## Top-level responsibilities

```text
apps/control/src/
├─ main.tsx                 # renderer bootstrap; mounts App + active feature roots
├─ App.tsx                  # existing Control Room shell and non-game screens
├─ bridge.ts                # typed renderer bridge to Electron preload/Main
├─ types.ts                 # renderer-facing shared types
├─ lib/
│  └─ model.ts              # config defaults/merge helpers
├─ features/
│  └─ games/                # active Game Store and per-game management feature
└─ styles.css               # existing global Control Room styles
```

The Game feature is intentionally isolated under `features/games`. New game UI should not be added back into the large root `App.tsx`.

## Game feature

```text
apps/control/src/features/games/
├─ index.ts
├─ GameHubRoot.tsx
├─ GameHubScreen.tsx
├─ gameCatalog.ts
├─ types.ts
├─ README.md
├─ components/
│  ├─ GameCover.tsx
│  └─ GameUi.tsx
├─ dance-floor/
│  └─ DanceFloorManager.tsx
└─ bamboo-battle/
   ├─ BambooBattleManager.tsx
   ├─ useBattleTester.ts
   └─ battleBots.ts
```

### `GameHubRoot.tsx`

Owns feature-level infrastructure only:

- reads the current config from `bridge.config()`;
- subscribes to config changes;
- saves config patches;
- shows loading and toast state;
- renders `GameHubScreen`.

It must not know how Game 01 or Game 02 works.

### `GameHubScreen.tsx`

Owns navigation only:

- renders the Store cards;
- remembers which game management page is open;
- shows which game is active on Stage;
- exposes the explicit `Kích hoạt game này` action;
- delegates settings UI to the selected game's manager.

Do not add Bamboo-specific fake-event logic here.

### `gameCatalog.ts`

Single source of truth for installed game metadata shown in the Store: id, display order, title, description and tag.

### `components/`

Contains presentation shared by more than one game. These components must not contain game rules.

### `dance-floor/`

Everything specific to Game 01 Control UI lives here. `DanceFloorManager.tsx` owns only Dance Floor settings; Stage rendering remains in the Stage app.

### `bamboo-battle/`

Everything specific to Game 02 Control UI lives here:

- `BambooBattleManager.tsx`: settings and test controls;
- `useBattleTester.ts`: fake-player/event simulation behavior;
- `battleBots.ts`: test fixture data only.

Actual Bamboo Battle gameplay/rendering remains in `apps/stage/src`.

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

Control should configure and test games. It should not duplicate Stage gameplay state or rendering logic.

## Rules for adding a new game

1. Add the id to `GameId` in `features/games/types.ts`.
2. Add its Store metadata to `features/games/gameCatalog.ts`.
3. Create a dedicated directory such as `features/games/game-03/`.
4. Put that game's Control UI in its manager component.
5. Put game-specific test helpers beside that manager.
6. Add one manager dispatch in `GameHubScreen.tsx`.
7. Keep gameplay/rendering in `apps/stage`, not in Control.
8. Never make opening a Store card switch the LIVE game automatically.

## Naming convention

Use feature-first names instead of generic names:

- good: `BambooBattleManager.tsx`, `useBattleTester.ts`, `DanceFloorManager.tsx`;
- avoid: `Game2.tsx`, `helpers.ts`, `utils2.ts`, `data.ts` when the responsibility is not obvious.

A new contributor should be able to infer a file's purpose from its path and filename without opening it.

## Current migration note

`App.tsx` still contains older Control Room screen code from before the feature split. The active Game Store implementation is `features/games`; do not add new game functionality to the older game section in `App.tsx`. Future cleanup can migrate the remaining non-game screens into their own `features/*` directories using the same pattern.

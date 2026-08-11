# Control Game Feature

The `features/games` directory is the only active implementation of the Game Store and per-game management UI.

## Structure

```text
features/games/
├─ index.ts                         # public exports for the feature
├─ GameHubRoot.tsx                  # config loading/saving + feature toast
├─ GameHubScreen.tsx                # store navigation and game selection only
├─ gameCatalog.ts                   # installed game metadata
├─ types.ts                         # shared game feature types
├─ components/
│  ├─ GameCover.tsx                 # visual cover used by store/header
│  └─ GameUi.tsx                    # shared Panel / Field / Toggle primitives
├─ dance-floor/
│  └─ DanceFloorManager.tsx         # Game 01 settings UI only
└─ bamboo-battle/
   ├─ BambooBattleManager.tsx       # Game 02 settings + test controls
   ├─ useBattleTester.ts            # fake-player/test-event behavior
   └─ battleBots.ts                 # fake player fixture names
```

## Ownership rules

- `GameHubScreen.tsx` must not contain game-specific settings or fake-event logic.
- `gameCatalog.ts` is the single source of truth for cards shown in the Game Store.
- Each game owns its settings UI inside its own directory.
- Test/simulation logic belongs next to the game that uses it, not in the hub.
- Shared presentational controls belong in `components/`.
- External code should import the feature through `features/games/index.ts`.

## Adding Game 03

1. Add the new id to `GameId` in `types.ts`.
2. Add one entry to `gameCatalog.ts`.
3. Create `your-game/YourGameManager.tsx`.
4. Add the manager dispatch in `GameHubScreen.tsx`.
5. Keep runtime/gameplay code in the Stage or service layer; the Control manager should only configure and test it.

## Important

Opening a game card is navigation only. It must never switch the LIVE Stage automatically. Switching the active LIVE game happens only through the explicit `Kích hoạt game này` action (or an intentional test action that needs that game active).

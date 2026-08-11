# Control Game Feature

`features/games` is the active Control application UI. Opening Control lands directly on the Game Store; the legacy `App.tsx` shell is not mounted by `main.tsx`.

## User flow

```text
Open Control
  -> Game Store (Game 01 + Game 02 only)
     -> Game 01 manager
        -> Back to Game Store
     -> Game 02 manager
        -> Back to Game Store
```

There is no shared sidebar on the Store screen. Each game owns its own management UI.

## Structure

```text
features/games/
├─ index.ts                         # public exports for the feature
├─ GameHubRoot.tsx                  # standalone Control root + config loading/saving
├─ GameHubScreen.tsx                # Store navigation and manager selection
├─ gameCatalog.ts                   # installed game metadata
├─ types.ts                         # shared game feature types
├─ README.md                        # local ownership rules
├─ components/
│  ├─ GameCover.tsx                 # visual cover used by store/header
│  └─ GameUi.tsx                    # shared Panel / Field / Toggle primitives
├─ styles/
│  ├─ game-hub.css                  # Store + manager presentation
│  └─ game-hub-overlay.css          # standalone app layout + toast/loading
├─ dance-floor/
│  └─ DanceFloorManager.tsx         # Game 01 settings UI only
└─ bamboo-battle/
   ├─ BambooBattleManager.tsx       # Game 02 settings + test controls
   ├─ useBattleTester.ts            # fake-player/test-event behavior
   └─ battleBots.ts                 # fake player fixture names
```

## Ownership rules

- `main.tsx` mounts only `GameHubRoot` for the Control UI.
- `GameHubScreen.tsx` must not contain game-specific settings or fake-event logic.
- `gameCatalog.ts` is the single source of truth for cards shown on the app home.
- Each game owns its settings UI inside its own directory.
- Test/simulation logic belongs next to the game that uses it, not in the hub.
- Shared presentational controls belong in `components/`.
- Feature-specific CSS belongs in `styles/`.
- External code should import the feature through `features/games/index.ts`.

## Adding Game 03

1. Add the new id to `GameId` in `types.ts`.
2. Add one entry to `gameCatalog.ts`.
3. Create `your-game/YourGameManager.tsx`.
4. Add the manager dispatch in `GameHubScreen.tsx`.
5. Keep runtime/gameplay code in the Stage or service layer; the Control manager should only configure and test it.

## Important

Opening a game card is navigation only. It must never switch the LIVE Stage automatically. Switching the active LIVE game happens only through the explicit `Kích hoạt game này` action (or an intentional test action that needs that game active).

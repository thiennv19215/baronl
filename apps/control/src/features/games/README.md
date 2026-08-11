# Control Game Feature

`features/games` owns the Game workspace inside the existing OrbitStage Control shell.

The sidebar and topbar remain owned by `App.tsx`. When `screen === 'games'`, `App.tsx` mounts `GameHubScreen` directly inside the normal content area and passes the same config/patch/notification infrastructure used by the other Control screens.

## User flow

```text
OrbitStage Control
  -> sidebar: Game
     -> Game Store (exactly Game 01 + Game 02)
        -> Game 01 screen
           -> Back to Game Store
        -> Game 02 screen
           -> Back to Game Store
  -> leave Game tab
  -> return to Game tab
     -> Game Store again
```

Opening a card is navigation only. It does not change the game running on Stage.

## Structure

```text
features/games/
├─ index.ts                         # public feature entry point
├─ GameHubScreen.tsx                # Store navigation + manager dispatch
├─ gameCatalog.ts                   # installed game metadata
├─ types.ts                         # shared Game feature types
├─ README.md                        # ownership and extension rules
├─ components/
│  ├─ GameCover.tsx                 # visual cover used by cards/header
│  ├─ GamePageHeader.tsx            # per-game back/status/activate header
│  └─ GameUi.tsx                    # shared Panel / Field / Toggle primitives
├─ styles/
│  └─ game-hub.css                  # Store + dedicated game screens
├─ dance-floor/
│  └─ DanceFloorManager.tsx         # Game 01 settings UI only
└─ bamboo-battle/
   ├─ BambooBattleManager.tsx       # Game 02 settings + test controls
   ├─ useBattleTester.ts            # fake-player/test-event behavior
   └─ battleBots.ts                 # fake player fixture names
```

## Ownership rules

- `main.tsx` mounts only `App`.
- `App.tsx` owns the Control shell, active screen, shared config state and notifications.
- `App.tsx` mounts `GameHubScreen` only while `screen === 'games'`; leaving Game unmounts the feature and naturally resets its local navigation state.
- `GameHubScreen.tsx` contains Store navigation and manager selection only. It must not contain game-specific settings or fake-event logic.
- `gameCatalog.ts` is the single source of truth for cards shown in the Store.
- Each game owns its settings UI inside its own directory.
- Test/simulation logic belongs beside the game that uses it, not in the Store router.
- Shared presentational controls belong in `components/`.
- Feature-specific CSS belongs in `styles/`.
- External code should import the feature through `features/games/index.ts`.

## Adding Game 03

1. Add the new id to `GameId` in `types.ts`.
2. Add one entry to `gameCatalog.ts`.
3. Create `your-game/YourGameManager.tsx`.
4. Add the manager dispatch in `GameHubScreen.tsx`.
5. Add/extend the Stage `gameMode` and runtime implementation.
6. Keep gameplay/rendering in Stage or the service layer; Control should configure and test it.
7. Add an E2E assertion that the new card opens only its own screen.

## Important behavior

- Opening Game 01/Game 02 never switches the LIVE Stage automatically.
- Switching the active LIVE game only happens through `Kích hoạt game này`, except explicit test helpers that intentionally need that game active.
- Leaving the Game workspace stops rendering its manager UI. Returning to Game always starts at the two-card Store.

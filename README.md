# OrbitStage Live

Windows control room and 9:16 OBS Browser Source stage for TikTok LIVE, built with Electron, TypeScript, React and a local-first architecture.

OrbitStage is a new, independent project. It contains no source code, brand assets, license keys, API keys or user data from another application. The license module is disabled by default, so free mode is the normal product mode.

## What is included

- Safe Electron Main / Preload / Renderer separation (`contextIsolation`, sandbox, no renderer Node access).
- Control Room with Live, LED, Customize, Characters, AI MC/DJ, Test LIVE, Update and License screens.
- Loopback-only HTTP/WebSocket server, health endpoint and an OBS URL for the 9:16 Stage.
- TikFinity WebSocket normalization, reconnect, spam protection, fake events, viewer levels, leaderboards, gifts and individual gift wishes.
- Music ownership, background/image/video selection, dual-host CSS fallback and quality profiles.
- OpenAI-compatible AI providers, OpenAI/Edge TTS, content filtering, rate limiting and a shared speech queue.
- Encrypted secret storage, redacted diagnostics, signed-manifest updater with hash verification, backup and rollback helpers.

## Prerequisites

- Windows 10/11 x64
- Node.js 22.12 or later for development
- TikFinity Desktop when connecting to a real TikTok LIVE

## Develop

```powershell
npm install
npm run dev
```

The Control UI starts on Vite, while the desktop app starts after both Control and Stage are ready. The normal local Stage URL is shown in **Điều khiển LIVE** and follows this format:

```text
http://127.0.0.1:17321/stage?source=obs&audio=1
```

Use it as an OBS Browser Source at **1080 × 1920**. The server binds only to `127.0.0.1`.

## TikFinity, AI and TTS

1. Start TikFinity and enable its local WebSocket output (default `ws://127.0.0.1:21213/`).
2. In **Điều khiển LIVE**, set the TikTok account and WebSocket URL, save, then choose **Chạy LIVE**.
3. In **AI MC / DJ**, choose a provider/model and save the API key. The key is sent only to Electron Main and is protected through Electron `safeStorage`; it is never exported with config.
4. Choose Edge TTS for key-free local operation, or OpenAI TTS for `gpt-4o-mini-tts` using the same securely stored API key.

For full operational instructions, see [docs/guides](docs/guides/development.md), including [TikFinity](docs/guides/tikfinity.md), [AI/TTS](docs/guides/ai-and-tts.md), and [installation/OBS](docs/guides/installation-and-obs.md).

## Verify and release

```powershell
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
npm run dist:win
```

The NSIS installer is written to `release/`. A production updater additionally requires a project-owned HTTPS feed, an Ed25519 verification public key, and a code-signed installer; unsigned artifacts are not accepted for an in-app update.

## Assets and acceptance

- Validate the registry with `npm run assets:check`.
- Asset rights, placeholders and the non-migration decision are recorded in [docs/assets/rights-report.md](docs/assets/rights-report.md).
- Architecture, security and the evidence-based acceptance checklist live in [docs/README.md](docs/README.md).

Source UI screenshots/assets were not present in the supplied workspace. New OrbitStage screenshots are available in [docs/screenshots/new](docs/screenshots/new); a true side-by-side comparison remains blocked until the project owner provides authorized reference screenshots and asset rights confirmations.

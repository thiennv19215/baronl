# Evidence phát hành — 2026-08-10

## Artifact tạo được

| Artifact | Kết quả |
|---|---|
| `release/OrbitStage-Live-1.0.0-x64.exe` | NSIS x64, 100,638,990 bytes |
| Block map | `release/OrbitStage-Live-1.0.0-x64.exe.blockmap`, 105,626 bytes |
| SHA-256 installer | `DF3D4CD5E9C86BBD3FD5CA49B86385D30695FE39F4A545EAB631A8C91FCC886D` |
| Artifact secret scan | PASS — `node scripts/scan-secrets.mjs release` |
| Extracted ASAR secret scan | PASS — extracted `resources/app.asar` then scanned the unpacked contents |
| Dependency audit | PASS — `npm audit`: 0 vulnerabilities |

`release/win-unpacked/OrbitStage Live.exe` was launched on the build host as a packaged smoke test and then closed cleanly. The final installer has **no Authenticode signature** (`Get-AuthenticodeSignature` = `NotSigned`) because no project-owned signing certificate was supplied. This is intentionally a release gate: the in-app updater verifies Authenticode and will reject an unsigned update.

NSIS installer smoke test on the build host also passed: silent install to `release/installer-smoke` exited `0`; the installed `OrbitStage Live.exe` started; then `Uninstall OrbitStage Live.exe /S` exited `0` and removed the installation directory. This does not substitute for the separate clean-machine/no-Node gate.

## Automated evidence

| Command | Result |
|---|---|
| `npm run lint` | PASS — asset registry + strict typecheck for all workspaces |
| `npm test` | PASS — 20 files, 45 tests |
| `npm run test:integration` | PASS — 2 files, 2 tests (local HTTP/WS/fake event and TikFinity reconnect) |
| `npm run test:e2e` | PASS — 3 Electron tests: preload isolation/8 screens; fake gift to real Stage; local AI/TTS stub and Stage close/reopen continuity |
| `npm run build` | PASS — shared, live-service, control, stage and desktop |
| `node scripts/scan-secrets.mjs` | PASS |
| `node scripts/check-doc-links.mjs` | PASS — 46 local links |
| Diagnostic canary test | PASS — ZIP redacts config, health and JSONL secret canary |

## Acceptance still requiring external evidence

- Authorized screenshots or a runnable source app are required for an honest old/new UI comparison; no source UI was supplied.
- Rights confirmation and real files are required to certify migrated old assets or run a real Live2D/3D model. The shipped assets are new/generated placeholders with their own manifest and rights report.
- A clean Windows VM without Node.js is required for install/uninstall and no-Node acceptance.
- A project-owned signing certificate and update feed are required for a signed production release/update rollout.

These items are deliberately recorded as blocked/not-run rather than represented as completed by local tests.

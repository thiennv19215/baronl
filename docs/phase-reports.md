# Báo cáo theo giai đoạn

## Giai đoạn 0 — Chuẩn bị

Trạng thái: `PARTIAL`.

- Đã tạo: architecture, UI specification/wireframe, acceptance checklist, asset inventory/rights policy, registry và placeholder mới.
- Cách kiểm tra asset: `npm run assets:check` hoặc `node scripts/validate-assets.mjs`; registry hiện có 14 entries và kết quả gần nhất nằm trong test report.
- Ảnh đối chiếu: đã có đủ tám màn Control 1440×866 và một Stage demo 9:16; toàn bộ ảnh nguồn thiếu nên vẫn `BLOCKED_SOURCE`.
- Còn lại: owner cung cấp ảnh UI nguồn hợp pháp nếu yêu cầu tương đương nguồn vẫn là release gate.

File chính đã tạo/sửa:

- `docs/architecture.md`, `docs/scope-and-acceptance.md`, `docs/ui/*`, `docs/assets/*`.
- `assets/manifest.json`, `assets/manifest.schema.json`, `assets/LICENSE.md` và asset placeholder/brand đã đăng ký.
- `scripts/validate-assets.mjs`, `scripts/check-assets.mjs`, `scripts/generate-placeholder-media.mjs`, `scripts/render-brand-icon.cjs`, `scripts/scan-secrets.mjs`, `scripts/check-doc-links.mjs`.

## Giai đoạn 1 — Nền Electron

Trạng thái: `PARTIAL`.

- Workspace Electron/Control/Stage/shared/live-service đã build thành công; runtime security/window E2E vẫn cần evidence.
- Đã chạy `npm run typecheck` và `npm run build` pass; development launch/E2E còn cần ghi nhận riêng.
- Ảnh: bộ Control/Stage mới đã chụp; source comparison còn thiếu.
- Còn lại: cập nhật evidence FND trong checklist sau test.

File runtime chính quan sát được:

- `apps/desktop/src/main.ts`, `preload.ts`, `local-server.ts`, `config-store.ts`, `window-state.ts`, `logger.ts`.
- `apps/control/src/App.tsx`, `bridge.ts`, `styles.css`; `apps/stage/src/App.tsx`, `stageState.ts`, `styles.css`.
- `packages/shared/src/config.ts`, `events.ts`; workspace/root build config.

## Giai đoạn 2 — MVP LIVE và Stage

Trạng thái: `NOT VERIFIED`.

- Cần chứng minh TikFinity/fake event qua cùng event router, Stage/OBS local URL và audio owner.
- Đã chạy `npm test` pass 19 files/40 tests và `npm run test:integration` pass 2/2; E2E còn chờ.
- Ảnh: LIVE idle và Stage demo đã chụp; connected/reconnect/transparent states chưa chụp.

File chính:

- `apps/desktop/src/live-runtime.ts`, `local-server.ts`.
- `packages/live-service/src/tikfinity.ts`, `event-bus.ts`, `event-router.ts`, `fake-events.ts`, `music-coordinator.ts`, `local-server.ts`.
- `apps/stage/src/App.tsx`, `stageState.ts`; unit/integration tests tương ứng dưới `*.test.ts` và `packages/live-service/tests/integration/`.

## Giai đoạn 3 — Tùy biến và trải nghiệm

Trạng thái: `NOT VERIFIED`.

- Placeholder asset hợp pháp đã chuẩn bị; chưa xác minh UI/runtime registry.
- Cần test continuity nhạc, level/leaderboard, gift priority, character fallback và GPU profile.
- Cách chạy/kiểm tra: `npm run assets:check`, `npm test`, sau đó `npm run test:e2e` cho luồng UI/Stage.

File chính:

- `packages/live-service/src/viewer-store.ts`, `gifts.ts`, `music-coordinator.ts` và tests.
- `apps/control/src/App.tsx`, `styles.css`; `apps/stage/src/App.tsx`, `styles.css`.
- `assets/backgrounds/`, `avatars/`, `gifts/`, `badges/`, `characters/`, `textures/`, `music/`, `video/`.

## Giai đoạn 4 — AI và TTS

Trạng thái: `NOT VERIFIED`.

- Hướng dẫn provider/secret/queue đã tạo.
- Cần unit/integration với provider mock và E2E test prompt/TTS queue; không cần đưa key thật vào CI.
- Cách chạy/kiểm tra: `npm test`, `npm run test:integration`, `npm run test:e2e`; provider network thật không bắt buộc trong CI.

File chính:

- `apps/desktop/src/ai-service.ts`, `auto-hype.ts`, `speech-service.ts`, `secret-store.ts`.
- `packages/live-service/src/ai.ts`, `tts.ts`, `rate-limiter.ts` và tests.
- `docs/guides/ai-and-tts.md` và màn AI trong `apps/control/src/App.tsx`.

## Giai đoạn 5 — Vận hành và release

Trạng thái: `NOT VERIFIED`.

- Security, update/rollback, license và diagnostics policy đã tạo.
- Cần build installer, scan artifact, failure-injection update và manual clean-machine test.
- Cách chạy/kiểm tra: `npm run release:verify`, `npm run dist:win`, `node scripts/scan-secrets.mjs .\release`, sau đó manual clean-machine checklist.

File chính:

- `apps/desktop/src/license-service.ts`, `update-service.ts`, `diagnostics.ts`, `service-supervisor.ts`, `secret-store.ts`.
- `packages/live-service/src/license.ts`, `updater.ts`, `diagnostics.ts`, `health.ts`, `logger.ts` và tests.
- `electron-builder.yml`, `docs/security.md`, `docs/update-and-rollback.md`, `docs/license.md`, `docs/diagnostics.md`, `docs/guides/release.md`.

## Quy tắc cập nhật báo cáo

Sau mỗi giai đoạn, bổ sung danh sách file thực tế đã tạo/sửa, exact command + kết quả test, đường dẫn screenshot và các mục còn lại. Không xóa blocker hoặc đổi `PASS` nếu chưa có evidence tương ứng.

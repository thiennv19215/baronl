# Phạm vi và checklist nghiệm thu

Ngày lập: 2026-08-10. Tài liệu gốc: `C:\Users\nguye\Documents\sannhay\electron-rebuild-plan.md` ở ngoài repository mới. Trạng thái dưới đây là trạng thái bằng chứng, không chỉ là trạng thái source code. Người nghiệm thu phải cập nhật cột trạng thái và evidence sau mỗi lần chạy.

## Gate bắt buộc trước bàn giao

| Gate | Điều kiện | Trạng thái | Evidence hiện có / còn thiếu |
|---|---|---|---|
| G-01 | Windows app build/installer tạo thành công | `PASS` | NSIS x64 + blockmap tạo được; silent install/run/uninstall trên build host PASS. Xem [release-evidence.md](release-evidence.md). |
| G-02 | Tất cả automated unit/integration/E2E pass | `PASS` | 20 file/45 unit, 2 integration, 3 Electron E2E. Xem [release-evidence.md](release-evidence.md). |
| G-03 | Manual clean-machine install/run/uninstall | `NOT RUN` | Cần máy Windows sạch không cài Node.js. |
| G-04 | Toàn bộ checklist chức năng pass | `NOT VERIFIED` | Các mục runtime bên dưới chưa có evidence. |
| G-05 | UI tương đương theo ảnh đối chiếu | `BLOCKED` | Không có screenshot/app nguồn hợp pháp. |
| G-06 | Asset có quyền, không secret trong installer | `PASS` (scope hiện có) | 14 generated/placeholder assets có manifest/rights report; source, release và ASAR secret scans PASS. Không có asset nguồn để migrate. |
| G-07 | Update lỗi tự rollback | `NOT RUN` | Cần integration/E2E update transaction. |
| G-08 | Diagnostic bundle không chứa canary secret | `PASS` | Test ZIP canary redaction PASS cho config, health và JSONL log. |

Không được coi dự án đã nghiệm thu trong khi bất kỳ gate bắt buộc nào còn `NOT VERIFIED`, `NOT RUN`, `PARTIAL` hoặc `BLOCKED`.

## Giai đoạn 0 — Chuẩn bị

| ID | Tiêu chí | Trạng thái | Evidence |
|---|---|---|---|
| P0-01 | Tên sản phẩm mới | `PASS` | OrbitStage Live; không dùng thương hiệu cũ. |
| P0-02 | Logo/nhận diện/bảng màu mới | `PASS` | `assets/brand/orbitstage-mark.svg`, [UI analysis](ui/source-ui-analysis.md). |
| P0-03 | License sản phẩm mới | `PASS` | Free/disabled mặc định, [license.md](license.md). |
| P0-04 | Kiểm kê asset nguồn | `PASS` | [inventory.md](assets/inventory.md): nguồn chỉ có plan, không có asset. |
| P0-05 | Chỉ asset có quyền được migrate | `PASS` | Không migrate asset nguồn nào; placeholder nguyên gốc có report. |
| P0-06 | Đặc tả màn hình/interaction | `PASS` | [source-ui-analysis.md](ui/source-ui-analysis.md), [wireframes.md](ui/wireframes.md). |
| P0-07 | Tiêu chí nghiệm thu từng nhóm | `PASS` | Tài liệu này. |
| P0-08 | TikFinity là nguồn event chính | `PASS` (decision) | Endpoint mặc định `ws://127.0.0.1:21213/`; [architecture.md](architecture.md). |
| P0-09 | Phương án khi mất kết nối | `PASS` (design) | Reconnect backoff + giữ snapshot + fake-event fallback; cần runtime test ở MVP-07. |
| P0-10 | Ảnh UI nguồn được kiểm kê | `BLOCKED` | Không có ảnh nguồn; xem [screenshot-comparison.md](ui/screenshot-comparison.md). |

## Giai đoạn 1 — Nền Electron

| ID | Tiêu chí quan sát được | Trạng thái | Evidence cần có |
|---|---|---|---|
| FND-01 | npm workspace gồm `apps/*`, `packages/*`, tests | `NOT VERIFIED` | Workspace tree + install/build log. |
| FND-02 | Electron Main/Preload/Renderer bằng TypeScript | `NOT VERIFIED` | Typecheck + source inspection. |
| FND-03 | `contextIsolation`/sandbox bật, `nodeIntegration` tắt | `NOT VERIFIED` | Unit/source assertion và E2E probe. |
| FND-04 | Typed IPC allow-list và runtime validation | `NOT VERIFIED` | Contract tests payload hợp lệ/không hợp lệ. |
| FND-05 | Control window và Stage window riêng | `NOT VERIFIED` | E2E window count/route/screenshot. |
| FND-06 | Window bounds lưu/khôi phục an toàn | `NOT VERIFIED` | Unit test off-screen/DPI bounds. |
| FND-07 | HTTP/WS server chỉ bind `127.0.0.1:17321` | `NOT VERIFIED` | Integration test address và LAN rejection. |
| FND-08 | `/health` có schema an toàn | `NOT VERIFIED` | HTTP integration test + secret scan. |
| FND-09 | Event bus nội bộ | `NOT VERIFIED` | Unit/integration test publish/subscribe/ordering. |
| FND-10 | Structured logging và error boundary | `NOT VERIFIED` | Test structured fields, rotation/error UI. |
| FND-11 | Export log/diagnostics có redaction | `NOT VERIFIED` | Canary secret test. |
| FND-12 | App đóng/mở ổn định, Stage qua local URL | `NOT VERIFIED` | E2E launch/relaunch/URL. |

## Giai đoạn 2 — MVP LIVE và Stage

| ID | Tiêu chí quan sát được | Trạng thái | Evidence cần có |
|---|---|---|---|
| MVP-01 | TikFinity WebSocket bridge configurable | `NOT VERIFIED` | Integration fake server. |
| MVP-02 | UI trạng thái idle/connecting/connected/reconnecting/error | `NOT VERIFIED` | Component/E2E state assertions. |
| MVP-03 | Normalize join | `NOT VERIFIED` | Unit + stage integration fixture. |
| MVP-04 | Normalize chat/comment | `NOT VERIFIED` | Unit + XSS/length test. |
| MVP-05 | Normalize follow | `NOT VERIFIED` | Unit + stage integration fixture. |
| MVP-06 | Normalize like | `NOT VERIFIED` | Unit + burst/spam test. |
| MVP-07 | Normalize gift và disconnect/reconnect | `NOT VERIFIED` | Unit + reconnect/dedupe integration. |
| MVP-08 | Queue, ordering, dedupe và chống spam | `NOT VERIFIED` | Load/burst unit/integration. |
| MVP-09 | Stage 9:16 trong window và OBS Browser Source | `NOT VERIFIED` | E2E + screenshot 1080×1920. |
| MVP-10 | Avatar/tên/chat/gift render đúng và fallback | `NOT VERIFIED` | E2E fake fixtures/missing avatar. |
| MVP-11 | Fake event dùng cùng validator/router | `NOT VERIFIED` | Integration event source/assertion. |
| MVP-12 | Nhạc play/pause/skip/volume | `NOT VERIFIED` | Unit/E2E audio coordinator. |
| MVP-13 | Chỉ một audio owner | `NOT VERIFIED` | Unit/integration concurrent commands. |
| MVP-14 | Event thật/fake lên stage không treo app | `NOT VERIFIED` | E2E soak/burst. |

## Giai đoạn 3 — Tùy biến và trải nghiệm LIVE

| ID | Tiêu chí quan sát được | Trạng thái | Evidence cần có |
|---|---|---|---|
| CUS-01 | LED text/style/preview | `NOT VERIFIED` | UI/E2E và screenshot. |
| CUS-02 | Background/image/video registry | `NOT VERIFIED` | Asset resolver + UI/E2E. |
| CUS-03 | Music catalog và continuity khi đổi stage/layout | `NOT VERIFIED` | Unit position continuity + E2E. |
| CUS-04 | Viewer avatar/name/level/title | `NOT VERIFIED` | Reducer/unit + stage E2E. |
| CUS-05 | Leaderboard deterministic | `NOT VERIFIED` | Unit tie/order/update tests. |
| CUS-06 | Viewer command/chat bubble và anti-spam | `NOT VERIFIED` | Unit rate limit/content tests. |
| CUS-07 | Gift wish show/hide/delete | `NOT VERIFIED` | UI/state/E2E. |
| CUS-08 | Super gift animation và priority flow | `NOT VERIFIED` | Scheduler/unit + visual E2E. |
| CUS-09 | Character shuffle/DJ platform/dual host | `NOT VERIFIED` | UI/state/stage E2E. |
| CUS-10 | Mobile/OBS layout và safe area | `NOT VERIFIED` | Multi-viewport screenshots. |
| CUS-11 | Live2D/3D capability hoặc fallback rõ nhãn | `NOT VERIFIED` | Fallback E2E; model thật cần asset có quyền. |
| CUS-12 | Blink/lip sync/motion khi capability có | `NOT VERIFIED` | Animation integration/manual visual test. |
| CUS-13 | Quality profiles/GPU fallback | `NOT VERIFIED` | Low-GPU/manual or deterministic fallback test. |
| CUS-14 | Đổi config không restart service/rewind nhạc | `NOT VERIFIED` | Integration/E2E continuity. |

## Giai đoạn 4 — AI và TTS

| ID | Tiêu chí quan sát được | Trạng thái | Evidence cần có |
|---|---|---|---|
| AI-01 | Provider abstraction | `NOT VERIFIED` | Adapter contract tests. |
| AI-02 | OpenAI-compatible/Groq/DeepSeek/Qwen/GLM/Grok config | `NOT VERIFIED` | Provider registry/UI + mocked tests. |
| AI-03 | Endpoint/model/key UI và secret storage | `NOT VERIFIED` | IPC/safeStorage test; key absent from renderer/export. |
| AI-04 | Test prompt | `NOT VERIFIED` | Mocked provider E2E. |
| AI-05 | Persona MC/DJ và Q&A | `NOT VERIFIED` | Prompt builder/content tests. |
| AI-06 | Auto-hype scheduler/cooldown | `NOT VERIFIED` | Fake-clock unit tests. |
| AI-07 | TTS OpenAI adapter | `NOT VERIFIED` | Mock HTTP/audio contract test. |
| AI-08 | Edge TTS adapter/voice selection | `NOT VERIFIED` | Adapter contract test. |
| AI-09 | Shared speech queue, no overlap, cancel/volume | `NOT VERIFIED` | Fake audio queue unit/integration. |
| AI-10 | Content filter/rate limit/timeout/retry | `NOT VERIFIED` | Unit tests malicious/timeout/burst. |
| AI-11 | AI/TTS log không lộ key | `NOT VERIFIED` | Canary secret scan. |
| AI-12 | AI lỗi không chặn LIVE/stage | `NOT VERIFIED` | Integration failure injection. |

## Giai đoạn 5 — Vận hành, license, update, packaging

| ID | Tiêu chí quan sát được | Trạng thái | Evidence cần có |
|---|---|---|---|
| OPS-01 | Config versioned/migration/atomic backup | `NOT VERIFIED` | Unit migration/corruption tests. |
| OPS-02 | Secret dùng Electron `safeStorage` | `NOT VERIFIED` | Main integration test trên Windows. |
| OPS-03 | Import/export không kèm secret | `NOT VERIFIED` | Canary export test. |
| OPS-04 | License module tách biệt, free/disabled mặc định | `NOT VERIFIED` | Runtime/unit evidence; policy ở [license.md](license.md). |
| OPS-05 | Không có cơ chế bypass license | `NOT VERIFIED` | Code/security review. |
| OPS-06 | Health monitor và recovery child service | `NOT VERIFIED` | Crash/restart-budget integration. |
| OPS-07 | Diagnostic bundle redacted | `NOT VERIFIED` | Canary archive test. |
| OPS-08 | Signed manifest + hash update validation | `NOT VERIFIED` | Unit/integration signatures/hash. |
| OPS-09 | Backup/update transaction/rollback | `NOT VERIFIED` | Failure-injection integration/E2E. |
| OPS-10 | Windows installer | `NOT VERIFIED` | `npm run dist:win` artifact/log. |
| OPS-11 | App chạy không cần Node.js ngoài máy | `NOT RUN` | Clean-machine test. |
| OPS-12 | Installer cài/gỡ được | `NOT RUN` | Clean-machine install/uninstall report. |
| OPS-13 | Source/artifact không chứa key/private data | `PARTIAL` | Source asset scan còn cần chạy; artifact chưa có. |

## UI migration bổ sung

| ID | Tiêu chí | Trạng thái | Evidence |
|---|---|---|---|
| UI-01 | Phân tích bố cục/tab/màu/type/icon/states/dialog/flow nguồn | `BLOCKED` | Chỉ phân tích được yêu cầu chức năng; không có source/screenshot. |
| UI-02 | UI Windows mới giữ bố cục/chức năng bằng nhận diện hợp pháp | `PASS` (new UI) | Bộ ảnh mới đã review: shell 240 px, palette/token và interaction chính nhất quán. Không kết luận tương đương nguồn. |
| UI-03 | Đủ 8 màn Control + Stage | `PASS` (visual evidence) | Tám ảnh Control 1440×866 và Stage demo 9:16 ở `docs/screenshots/new/`. |
| UI-04 | Ảnh đối chiếu từng màn | `PARTIAL / BLOCKED` | Ảnh mới đủ màn cơ bản; toàn bộ ảnh nguồn vẫn thiếu. |
| UI-05 | Sửa sai khác quan trọng trước nghiệm thu | `BLOCKED` | Chưa có cặp ảnh để review. |
| UI-06 | Thay asset/branding không rõ quyền | `PASS` (docs/assets) | Nhận diện mới và placeholder CC0; runtime cần verify registry. |

## Asset migration bổ sung

| ID | Tiêu chí | Trạng thái | Evidence |
|---|---|---|---|
| AST-01 | Kiểm kê `assets/`, `design-assets/`, stage, Live2D nguồn | `PASS` | Các thư mục không tồn tại; ghi rõ trong inventory. |
| AST-02 | Chỉ chuyển asset được xác nhận quyền | `PASS` | Không chuyển asset nguồn nào. |
| AST-03 | Registry có path/category/hash/rights/license/metadata | `PASS` | `assets/manifest.json` và validator. |
| AST-04 | Placeholder có nhãn cho asset chưa rõ quyền | `PASS` | SVG/WAV/WebM nguyên gốc trong `assets/`. |
| AST-05 | Script bắt asset thiếu/manifest/hash sai | `PASS` | `node scripts/validate-assets.mjs`; kết quả ở test report. |
| AST-06 | Metadata cần thiết được giữ khi migrate | `N/A` | Không có asset nguồn để migrate. |
| AST-07 | Không chuyển API/private/license/user data | `PASS` | Nguồn không có các file đó; manifest không chứa secret. |
| AST-08 | Báo cáo quyền theo từng nhóm asset | `PASS` | [rights-report.md](assets/rights-report.md). |

## Kế hoạch kiểm thử

| ID | Loại/kịch bản | Trạng thái | Evidence |
|---|---|---|---|
| TST-01 | Unit: router/level/gift/music/TTS/AI/config/updater | `PASS` | `npm test`: lần mới nhất 19 files/40 tests pass; suites bao phủ đúng các module liệt kê. |
| TST-02 | Integration: fake TikFinity/HTTP/WS/supervisor | `PASS` | 2 files/2 tests pass: local HTTP+WS/fake event và fake TikFinity real WS/reconnect. Supervisor crash-budget vẫn cần evidence riêng ở OPS-06. |
| TST-03 | E2E: launch → LIVE → fake gift → stage → AI/TTS → reopen | `PASS` | Playwright Electron 3/3: preload/8 màn; fake gift tới Stage; AI/TTS mock loopback + reopen continuity. |
| TST-04 | Manual: clean Windows/DPI/network/GPU thấp | `NOT RUN` | Cần môi trường ngoài workspace. |
| TST-05 | Security review: IPC/server/log/package/secret | `NOT RUN` | Cần source review + artifact scan. |

## Điều kiện gỡ blocker bên ngoài

- `G-05/UI-01/UI-04/UI-05`: cung cấp screenshot hoặc quyền chạy app nguồn cho tất cả state, kèm xác nhận quyền tham chiếu.
- `G-03/OPS-11/OPS-12/TST-04`: cung cấp VM/máy Windows sạch và quyền cài/gỡ.
- Live2D/3D/media thật: chủ dự án cung cấp file và bằng chứng license/ownership; nếu không, fallback có nhãn là hành vi release hợp lệ nhưng không thể nghiệm thu capability model thật.

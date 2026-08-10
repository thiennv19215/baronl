# Báo cáo kiểm thử

Tài liệu này chỉ ghi kết quả đã chạy. Không suy ra `PASS` từ việc test file tồn tại.

> Kết quả mới nhất thay thế các dòng lịch sử cũ bên dưới: xem [release-evidence.md](release-evidence.md). Lần xác minh 2026-08-10 đã PASS `npm run lint`, 20 file/45 unit tests, 2 integration tests, 3 Electron E2E tests, build, asset/secret/doc checks và package NSIS. E2E có fake gift vào Stage, AI/TTS mock loopback và đóng/mở lại Stage giữ state. Các gate Windows sạch, nguồn UI/asset và code-signing vẫn được giữ ở trạng thái không xác minh/blocked theo evidence đó.

## Môi trường

| Trường | Giá trị |
|---|---|
| Ngày | 2026-08-10 |
| Hệ điều hành host | Microsoft Windows 10 Pro 64-bit, 10.0.19045 build 19045 |
| Node/npm | Node v24.18.0, npm 11.16.0 |
| Commit | Chưa có |
| Build artifact | Chưa có |

## Kết quả hiện tại

| Lệnh/kịch bản | Trạng thái | Kết quả/bằng chứng |
|---|---|---|
| `npm run assets:check` | `PASS` | Exit 0; 14 entries, 0 errors, 0 warnings. |
| `node scripts/scan-secrets.mjs` | `PASS` | Exit 0 sau khi fixture key-like được ghép runtime; 1 source root, không finding. Chưa scan installer. |
| `node --check` cho các script asset/media/secret | `PASS` | Exit 0 cho `validate-assets.mjs`, `generate-placeholder-media.mjs`, `scan-secrets.mjs`. |
| `node scripts/check-doc-links.mjs` | `PASS` | Exit 0; 44 local links, không có target thiếu. |
| `ffprobe assets/video/stage-placeholder.webm` | `PASS` | VP9, 540×960, 24 fps, duration 3.000 s, 55,300 bytes; frame giữa đã kiểm tra trực quan có nhãn placeholder. |
| `npm run typecheck` | `PASS` | Exit 0 sau sửa; control, desktop, stage, live-service và shared đều typecheck thành công. |
| `npm run lint` | `NOT RUN` | Chưa chạy. |
| `npm test` | `PASS` | Lần chạy mới nhất exit 0; Vitest 19 files/40 tests pass, 0 fail, duration 21.65 s. |
| `npm run test:integration` | `PASS` | Exit 0; 2 files/2 tests pass, 0 fail, duration 3.48 s: local HTTP+WS/fake event và fake TikFinity real WS/reconnect. |
| `npm run test:e2e` | `NOT RUN` | Chưa chạy. |
| `npm run build` | `PASS` | Exit 0 sau sửa; assets 14/0/0, shared/live-service/control/stage/desktop đều build, Vite và Electron main/preload artifacts được tạo. |
| `npm run dist:win` | `NOT RUN` | Chưa chạy. |
| Cài/chạy/gỡ trên Windows sạch không có Node.js | `NOT RUN` | Cần VM/máy sạch. |
| Test DPI 100/125/150/200% | `NOT RUN` | Cần manual/UI automation phù hợp. |
| Test mạng chập chờn/TikFinity reconnect | `NOT RUN` | Cần integration + manual. |
| Test GPU thấp/fallback | `NOT RUN` | Cần môi trường GPU phù hợp. |
| Update lỗi và rollback | `NOT RUN` | Cần signed test fixture + failure injection. |
| Diagnostic canary secret | `NOT RUN` | Cần bundle implementation. |
| Installer/ASAR secret scan | `NOT RUN` | Chưa có artifact. |

## Mẫu ghi bằng chứng

Khi chạy, ghi exact command, exit code, số test pass/fail/skip, duration, đường dẫn log/artifact và giới hạn môi trường. Ví dụ:

```text
2026-08-10T12:00:00Z
Command: npm test
Exit: 0
Result: 42 passed, 0 failed, 0 skipped
Artifact: artifacts/test/unit-20260810.txt
Notes: provider network mocked; không phải live-provider test
```

Manual clean-machine chỉ được `PASS` khi máy/VM không dùng dependency dev từ workspace, installer cài được, app chạy không cần Node.js, local stage mở được, và uninstall hoàn tất. Chưa có lần chạy như vậy trong report này.

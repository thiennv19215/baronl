# Mô hình bảo mật

## Phạm vi

Tài sản cần bảo vệ gồm API key AI/TTS, cấu hình TikFinity, dữ liệu người xem, nội dung log, file cập nhật, asset có bản quyền và trạng thái license. Các biên tin cậy là renderer, preload, Main, local HTTP/WebSocket, TikFinity và provider bên ngoài.

## Threat model rút gọn

| Mối đe dọa | Biện pháp bắt buộc | Bằng chứng nghiệm thu |
|---|---|---|
| XSS từ tên/chat/gift | Render text, không `innerHTML`; CSP; giới hạn độ dài | Unit/E2E payload HTML/script |
| Renderer gọi Node tùy ý | `nodeIntegration: false`, `contextIsolation: true`, sandbox, preload allow-list | Test cấu hình BrowserWindow và API surface |
| IPC payload độc hại | Schema runtime hai chiều, channel cố định, size limit | Unit test payload sai/siêu lớn |
| Local server bị truy cập qua LAN | Bind đúng `127.0.0.1`; test socket address | Integration test bind address |
| Command giả mạo từ website khác | Kiểm tra Origin/session token cho command channel | Integration test origin/token |
| SSRF qua avatar/endpoint | Chỉ protocol/host theo policy, chặn private ranges khi là remote fetch, timeout/byte cap | Unit test URL policy |
| Secret lọt log/bundle | Redaction key/value/pattern trước serialize; bundle allow-list | Canary secret test |
| Path traversal asset | Registry path tương đối, resolve rồi kiểm tra vẫn nằm trong asset root | `node scripts/validate-assets.mjs` |
| Supply-chain/update giả | HTTPS + signed manifest + SHA-256 + code signing | Updater validation tests |
| Zip-slip khi update/diagnostic | Reject absolute path, `..`, symlink/reparse point ngoài root | Unit test archive độc hại |
| License bypass | Module tách biệt; free mode là policy chính thức; không patch/skip khi enabled | Unit test disabled/enabled states |

## Electron hardening

- Dùng session partition riêng nếu cần; không cấp permission theo mặc định.
- `setPermissionRequestHandler` và `setPermissionCheckHandler` deny trừ capability đã ghi rõ.
- Chặn `will-navigate`, giới hạn `setWindowOpenHandler`, không mở URL không tin cậy bằng shell.
- Không dùng `webSecurity: false`, `allowRunningInsecureContent`, `enableRemoteModule` hoặc `eval`.
- DevTools chỉ bật theo cấu hình development; không dựa vào việc tắt DevTools như biện pháp bảo mật.
- Header CSP mục tiêu: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; media-src 'self' blob:; connect-src 'self' ws://127.0.0.1:* https:` và siết host theo provider thực tế.

## Secret lifecycle

1. Renderer gửi secret mới qua một IPC command chuyên dụng và không nhận lại plaintext.
2. Main mã hóa bằng `safeStorage`; nếu hệ điều hành không hỗ trợ, từ chối lưu lâu dài và giải thích rõ.
3. Secret trong bộ nhớ được giữ trong phạm vi ngắn nhất, không thêm vào error context.
4. Export cấu hình chỉ có `configured: true/false`.
5. Khi xóa cấu hình/provider, ciphertext và cache liên quan được xóa bằng thao tác có xác nhận.

## Redaction

Redactor phải che theo cả tên trường (`apiKey`, `authorization`, `token`, `secret`, `licenseKey`, `cookie`) và mẫu giá trị (`Bearer ...`, query token, key provider). Trường hợp kiểm thử dùng canary riêng, ví dụ `ORBITSTAGE_CANARY_SECRET_...`; bundle pass chỉ khi không tìm thấy chuỗi canary hoặc biến thể URL-encoded/base64 thường gặp.

## Release gate

- Chạy unit/integration/E2E security.
- Chạy secret scan trên source, artifact unpacked và diagnostic fixture.
- Validate asset registry và rights report.
- Kiểm tra ASAR/installer không chứa `.env`, private key, credential DB, log người dùng.
- Xác minh chữ ký code-signing trên installer/binary nếu phát hành production.

Không ghi `PASS` cho release gate khi chỉ kiểm tra source mà chưa kiểm tra artifact đóng gói.

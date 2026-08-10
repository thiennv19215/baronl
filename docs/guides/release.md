# Phát hành Windows

## Điều kiện đầu vào

- Version/channel/release notes được chốt.
- Dependency lockfile sạch và review supply-chain hoàn tất.
- Code-signing certificate/private key nằm trong secret store của CI, không ở repository.
- Update feed production, public verification key và signing policy đã provision; không dùng domain/key mẫu.
- Asset rights report được review và không có asset `pending/restricted` ngoài policy.

## Pipeline đề nghị

```powershell
npm ci
npm run assets:check
node scripts/scan-secrets.mjs
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
npm run dist:win
node scripts/scan-secrets.mjs .\release
```

Tên thư mục artifact có thể khác theo root config; dùng path thật và ghi vào test report. Dừng pipeline ở lỗi đầu tiên, không publish build có test skip ngoài danh sách chấp thuận.

## Kiểm tra artifact

- Xác minh installer/binary có chữ ký và timestamp hợp lệ.
- Tính SHA-256, size và phát hành checksum qua kênh chính thức.
- Unpack ASAR/installer trong môi trường kiểm soát; tìm `.env`, private key, API/license key, log/userData và asset ngoài registry.
- Kiểm tra ứng dụng không load source map/debug endpoint nhạy cảm trong production.
- Kiểm tra local server chỉ bind `127.0.0.1`.

## Clean-machine smoke test

Dùng Windows VM snapshot không cài Node/npm/dependency dev:

1. Cài installer bằng user tiêu chuẩn; ghi prompt/UAC/publisher.
2. Mở app, xác minh free mode không gọi license network.
3. Kiểm tra `/health`, mở Stage/OBS URL và fake join/chat/gift.
4. Test nhạc/TTS mock hoặc provider được kiểm soát.
5. Đóng/mở app và Stage; cấu hình không bí mật được giữ, bounds không off-screen.
6. Tạo diagnostic với canary secret và quét bundle.
7. Chạy update fixture: success và failure rollback.
8. Gỡ cài đặt; ghi rõ dữ liệu nào được giữ/xóa.

Lặp lại tối thiểu với DPI 100% và 150/200%, network loss/reconnect và GPU fallback. Đây là manual gate; CI trên máy development không thay thế được.

## Update publication

1. Upload artifact immutable.
2. Tạo manifest với URL HTTPS, exact bytes/SHA-256/version/channel.
3. Ký manifest offline/CI protected; verify bằng chính public key app dùng.
4. Publish manifest cuối cùng sau artifact; tránh client thấy manifest trước file.
5. Canary rollout trước stable; theo dõi startup health/rollback rate đã ẩn danh theo policy.

Không publish unsigned feed production. Hash đơn lẻ trên cùng máy chủ bị xâm nhập không đủ bảo vệ authenticity.

## Rollback release

- Ngừng phục vụ manifest lỗi hoặc publish manifest khắc phục đã ký theo anti-downgrade policy.
- Không yêu cầu người dùng xóa userData trừ khi có migration recovery được tài liệu hóa.
- Giữ installer/backup version trước trong retention window.
- Ghi incident id, affected versions, trigger, recovery và data impact.

## Bằng chứng bàn giao

- Installer + checksum + signature verification output.
- Test logs unit/integration/E2E.
- Clean-machine report/screenshots.
- UI screenshot comparison review.
- Asset manifest/validator output/rights report.
- Updater success + forced-failure rollback evidence.
- Diagnostic canary scan output.

Không phát hành chính thức khi checklist gate trong `docs/scope-and-acceptance.md` chưa `PASS` hoặc blocker chưa được chủ dự án chấp thuận bằng quyết định phạm vi rõ ràng.

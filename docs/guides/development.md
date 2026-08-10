# Development và build

## Yêu cầu

- Windows 10/11 x64 cho Electron/installer test.
- Node.js LTS và npm tương thích với `package.json`/lockfile của repository.
- TikFinity Desktop chỉ cần cho integration thủ công; fake server/event dùng cho automated test.
- FFmpeg chỉ cần khi chủ ý regenerate placeholder WebM, không phải dependency runtime/build vì asset đã được check-in.

## Workspace

Repository dùng npm workspaces:

```text
apps/*       Electron desktop và Stage renderer
packages/*   shared contracts/services/modules
assets/      registry và media có quyền
docs/        kiến trúc/hướng dẫn/bằng chứng
scripts/     validator/generation/security helpers
```

Xem tree thực tế thay vì suy tên package chưa tồn tại.

## Cài dependency

```powershell
cd C:\path\to\orbitstage-live
npm install
```

Sau khi lockfile được commit, CI/release nên dùng `npm ci` để cài deterministic. Không commit `.env`, key hoặc file userData.

## Lệnh root

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Chạy Control/Stage/service ở development |
| `npm run typecheck` | Kiểm tra TypeScript toàn workspace |
| `npm run lint` | Asset validation + strict TypeScript typecheck theo root config hiện tại |
| `npm test` | Unit tests |
| `npm run test:integration` | Fake TikFinity, HTTP/WS, supervisor |
| `npm run test:e2e` | Electron/Stage end-to-end |
| `npm run build` | Build toàn workspace |
| `npm run assets:check` | Validate registry, file, hash và rights |
| `npm run dist:win` | Tạo installer Windows |

Nếu script chưa được khai báo hoặc fail, đó là lỗi cần sửa trong root config; không thay report thành pass bằng cách chạy package con khác mà không ghi chú.

## Chạy local

1. `npm install`.
2. `npm run assets:check`.
3. `npm run dev`.
4. Mở `/health` ở `http://127.0.0.1:17321/health`.
5. Mở Stage bằng Control hoặc `http://127.0.0.1:17321/stage`.
6. Dùng Test LIVE trước; sau đó mới mở TikFinity ở `ws://127.0.0.1:21213/`.

Port conflict phải được báo rõ. Không đổi bind thành `0.0.0.0` để “sửa nhanh”.

## Asset workflow

```powershell
node scripts/generate-placeholder-media.mjs        # bỏ qua binary đang có
node scripts/generate-placeholder-media.mjs --force # regenerate có chủ ý
node scripts/validate-assets.mjs
```

Sau `--force`, hash WebM có thể khác theo FFmpeg encoder/version. Cập nhật manifest bằng review có chủ ý, không thêm auto-write hash vào validator release.

## Security checks

```powershell
node scripts/scan-secrets.mjs
node scripts/scan-secrets.mjs .\release
```

Script là defense-in-depth và không thay thế secret scanner CI hoặc review ASAR/installer. Nếu fixture cần chuỗi giống key, dùng token ngắn/non-production và allow-list có giải thích thay vì tắt scan toàn repo.

## Ghi kết quả

Cập nhật `docs/test-report.md` với exact command, exit code, số pass/fail/skip, môi trường và artifact. Không ghi manual clean-machine `PASS` khi chỉ chạy development trên máy có Node/dependencies.

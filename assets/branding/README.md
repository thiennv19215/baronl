# Windows build resources

`icon.ico` là icon 256×256 nguyên gốc, được raster hóa bằng code Node trong `scripts/generate-placeholder-media.mjs` từ cùng motif OrbitStage. Đây là Windows fallback resource; cấu hình electron-builder hiện dùng PNG 512×512 ở `assets/brand/icon.png` và có thể tự tạo format cần thiết.

Icon được đăng ký/hash trong `assets/manifest.json` và cấp CC0 theo `assets/LICENSE.md`. Không thay bằng logo/icon cũ khi chưa có xác nhận quyền sử dụng.

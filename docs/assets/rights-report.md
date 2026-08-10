# Báo cáo quyền sử dụng asset

## Kết luận

- Asset chuyển từ ứng dụng/project nguồn: **0**.
- Asset nguồn bị loại vì chưa rõ quyền: **0 file được cung cấp**; toàn bộ nhóm production ở trạng thái `AWAITING_OWNER_ASSET`.
- Asset mới được duyệt trong registry: **14**, đều nguyên gốc/tạo trong repository và cấp `CC0-1.0` theo `assets/LICENSE.md`.
- API key, private key, license key, dữ liệu người dùng hoặc cơ chế license được migrate: **0**.

Đây là báo cáo provenance kỹ thuật, không thay thế tư vấn pháp lý.

## Ma trận quyền theo nhóm

| Nhóm | Asset registry | Nguồn/provenance | Holder | License | Evidence | Ship |
|---|---|---|---|---|---|---|
| Brand | `brand-orbitstage-mark`, `brand-build-icon-png`, `brand-windows-icon` | SVG mới + PNG/ICO raster mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md`, generation scripts | Có |
| Background | `background-stage-placeholder` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có, có nhãn placeholder |
| Avatar | `avatar-guest-placeholder` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có, fallback |
| Gift | `gift-generic-placeholder` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có, fallback |
| Badge | `badge-level-placeholder` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có, fallback |
| Character | `character-host-placeholder` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có; không tuyên bố là Live2D |
| Texture | `texture-neon-grid-placeholder` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có, fallback |
| Audio effect | `audio-placeholder-chime` | Tone tổng hợp bằng script | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md`, generation script | Có, test-only placeholder |
| Video poster | `video-stage-placeholder-poster` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có, có nhãn |
| Video | `video-stage-placeholder` | Pattern/text tổng hợp bằng script/FFmpeg | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md`, generation script | Có, muted placeholder |
| Music cover | `music-placeholder-cover` | Vẽ SVG mới trong repo | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md` | Có, có nhãn |
| Music loop | `music-placeholder-loop` | Tone/arpeggio tổng hợp bằng script | OrbitStage project contributors | CC0-1.0 | `assets/LICENSE.md`, generation script | Có, test-only placeholder |

Segoe UI chỉ được tham chiếu qua CSS/SVG font-family và FFmpeg dùng font cài sẵn trên máy tạo để rasterize chữ trong video; repository không phân phối file font.

## Nhóm production đang chờ quyền

| Nhóm | Trạng thái | Bằng chứng cần trước khi nhập | Fallback hiện tại |
|---|---|---|---|
| Logo/icon cũ | `NOT PROVIDED` | Xác nhận ownership/trademark và quyền sửa/phân phối | OrbitStage mark mới |
| Background/stage art | `NOT PROVIDED` | Tác giả, license, phạm vi livestream/redistribution | Stage placeholder |
| Avatar/ảnh | `NOT PROVIDED` | Model/property/privacy release nếu cần | Guest placeholder |
| Gift/sprite/title | `NOT PROVIDED` | License file hoặc xác nhận owner | Gift/badge placeholder |
| Music/SFX | `NOT PROVIDED` | Quyền master, composition, sync/livestream, redistribution | Synthetic WAV placeholders |
| Video | `NOT PROVIDED` | Quyền hình/nhạc/performer và redistribution | Generated muted WebM |
| Live2D/3D | `NOT PROVIDED` | Model/texture/motion/IP license + runtime SDK terms | Host SVG fallback |

Không đưa file `pending` vào `assets/manifest.json`; staging ngoài release tree và review quyền trước.

## Mẫu xác nhận asset owner-supplied

Mỗi batch cần ít nhất:

```text
Batch ID:
Files/hashes:
Rights holder:
How rights were obtained:
License/contract reference:
Allowed uses: modify / bundle / redistribute / livestream / commercial
Territory and expiration:
Attribution requirements:
Reviewer and date:
```

Email/chat chung chung như “dùng được” không đủ nếu không xác định file/phạm vi. Với third-party asset, lưu link/license version và kiểm tra điều khoản có cho phép đóng gói installer, không chỉ cho phép xem/cá nhân.

## Release gate

Trước mỗi release:

1. `node scripts/validate-assets.mjs` phải exit 0.
2. Rights report khớp manifest và mọi asset ship có `approved`.
3. Scan installer unpacked để bảo đảm không có asset ngoài registry do glob/package nhầm.
4. Quét secret/key/user data riêng; rights approval không thay thế security scan.
5. Nếu owner rút quyền hoặc license hết hạn, xóa asset khỏi release và quay về placeholder trước build.

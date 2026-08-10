# Kiểm kê và migration asset

## Phạm vi kiểm kê nguồn

Kiểm kê ban đầu được thực hiện tại `C:\Users\nguye\Documents\sannhay` trước khi repo mới được tạo. Kết quả chỉ có một file:

| File nguồn | Bytes | SHA-256 | Nội dung |
|---|---:|---|---|
| `electron-rebuild-plan.md` | 9,819 | `104b00f03f6d6a4b58489488436b9e812b2f536171299c5b371147e843e9baec` | Kế hoạch văn bản, không phải asset runtime |

Không tìm thấy source project cũ hoặc các thư mục/file asset được yêu cầu kiểm kê.

## Kết quả theo nhóm nguồn

| Nhóm cần kiểm kê | Tình trạng nguồn | Asset đã migrate | Quyết định |
|---|---|---:|---|
| `assets/` | Không tồn tại | 0 | Dùng placeholder nguyên gốc |
| `design-assets/` | Không tồn tại | 0 | Dùng nhận diện OrbitStage mới |
| Asset stage | Không tồn tại | 0 | Nền/poster/video placeholder mới |
| Live2D/model/texture/motion | Không tồn tại | 0 | Không ship model; dùng host SVG fallback |
| Logo/icon | Không tồn tại | 0 | Tạo mark OrbitStage mới |
| Ảnh/background/avatar | Không tồn tại | 0 | Tạo SVG placeholder mới |
| Gift/title/badge/sprite | Không tồn tại | 0 | Tạo gift/badge placeholder mới |
| Music/audio/TTS cache | Không tồn tại | 0 | Tạo chime/loop test bằng thuật toán |
| Video | Không tồn tại | 0 | Tạo WebM test mới bằng FFmpeg |
| Dữ liệu người dùng | Không tồn tại | 0 | Không migrate |
| API/private/license key | Không tồn tại trong đầu vào quan sát được | 0 | Cấm migrate/đóng gói |

“Không tồn tại” chỉ mô tả dữ liệu được cung cấp trong workspace tại thời điểm kiểm kê; không khẳng định asset không tồn tại ở nơi khác.

## Asset mới trong registry

| Category | ID | Loại | Placeholder | Mục đích |
|---|---|---|---|---|
| Brand | `brand-orbitstage-mark` | SVG | Không | Nhận diện ứng dụng mới |
| Brand | `brand-build-icon-png` | PNG 512×512 | Không | Input icon deterministic cho electron-builder |
| Brand | `brand-windows-icon` | ICO 256×256 | Không | Icon app/installer Windows |
| Background | `background-stage-placeholder` | SVG 9:16 | Có | Nền stage an toàn khi asset thiếu |
| Avatar | `avatar-guest-placeholder` | SVG | Có | Fallback avatar |
| Gift | `gift-generic-placeholder` | SVG | Có | Fallback gift |
| Badge | `badge-level-placeholder` | SVG | Có | Fallback level/title |
| Character | `character-host-placeholder` | SVG 9:16 | Có | Fallback khi không có Live2D/3D |
| Texture | `texture-neon-grid-placeholder` | SVG | Có | Test texture/tile |
| Audio | `audio-placeholder-chime` | WAV 1 giây | Có | Test effect/TTS queue/audio output |
| Video | `video-stage-placeholder-poster` | SVG 9:16 | Có | Poster có nhãn |
| Video | `video-stage-placeholder` | WebM 3 giây | Có | Test background video/loop |
| Music | `music-placeholder-cover` | SVG | Có | Cover test có nhãn |
| Music | `music-placeholder-loop` | WAV 4 giây | Có | Test play/pause/skip/volume/continuity |

Kích thước byte và SHA-256 canonical nằm trong `assets/manifest.json`, được kiểm tra bằng `scripts/validate-assets.mjs`.

## Metadata được giữ/không giữ

Không có asset nguồn nên không có metadata nguồn để chuyển. Registry mới lưu metadata kỹ thuật tối thiểu (width/height, duration, sample rate, loop, quan hệ poster/cover) và metadata quyền. Nếu thêm asset owner-supplied sau này, cần giữ filename nguồn, creator/holder, license evidence, phạm vi phân phối, kích thước/duration và mapping id cũ→mới trong report; không giữ EXIF/GPS/dữ liệu cá nhân không cần thiết.

## Placeholder generation

- SVG được viết mới trong repository, không trace hình/logo nguồn.
- ICO Windows được raster hóa bằng code Node từ motif OrbitStage mới, không nhúng icon ngoài.
- WAV là các tone sine đơn giản được sinh bởi `node scripts/generate-placeholder-media.mjs`.
- WebM là màu/grid/shape/text mới, được script gọi FFmpeg để sinh; không có audio track.
- Script không cần chạy để sử dụng repository vì binary đã được đăng ký/check-in; chạy `--force` chỉ khi cố ý regenerate rồi cập nhật hash qua review.

## Validation đã chạy

```text
Command: node scripts/validate-assets.mjs
Exit: 0
Result: Asset registry: 14 entries, 0 error(s), 0 warning(s)
Date: 2026-08-10
```

Validator kiểm tra id/path trùng, path traversal, symlink, file thiếu, file media chưa đăng ký, MIME theo extension, byte length, SHA-256, metadata cơ bản và rights status `approved`.

## Còn thiếu từ chủ dự án

Nếu cần thay placeholder bằng tài sản production, chủ dự án phải cung cấp file cùng bằng chứng sở hữu/cấp phép cho từng nhóm. Không có xác nhận nào như vậy trong đầu vào hiện tại. Cho tới lúc đó, placeholder là lựa chọn release an toàn và Live2D thật được ghi là capability chưa có asset, không được giả vờ đã migrate.

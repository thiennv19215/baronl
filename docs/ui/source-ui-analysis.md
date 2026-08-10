# Phân tích giao diện nguồn và định hướng UI mới

## 1. Bằng chứng đầu vào

Tại thời điểm kiểm kê, thư mục nguồn `C:\Users\nguye\Documents\sannhay` chỉ có `electron-rebuild-plan.md`. Không có:

- executable hoặc source code của ứng dụng cũ;
- screenshot/video thao tác;
- `assets/`, `design-assets/`, asset stage hoặc Live2D;
- logo, icon, font, design token hoặc đặc tả dialog;
- tài liệu xác nhận quyền sử dụng tài sản cũ.

Do đó không thể phân tích pixel, kích thước thật, trạng thái hover/focus thật hoặc luồng ẩn của UI nguồn. Những gì dưới đây là đặc tả chức năng rút ra từ kế hoạch và một nhận diện mới, nguyên gốc. Trạng thái đối chiếu nguồn phải là `BLOCKED_SOURCE` cho tới khi chủ dự án cung cấp screenshot hợp pháp.

## 2. Inventory màn hình có thể xác định

| Màn | Yêu cầu quan sát được từ kế hoạch | Điều chưa biết từ nguồn |
|---|---|---|
| License | Free/trial/activation nếu cần, trạng thái hợp lệ và offline/online policy | Bố cục, wording, key field, dialog |
| Điều khiển LIVE | TikTok account, local port, TikFinity WS, trạng thái, Run/Stop | Vị trí control, màu trạng thái, density |
| LED | Đổi text/LED và preview | Kiểu LED, animation, preset |
| Tùy chỉnh | Background/video/avatar/layout/asset | Cấu trúc form, thumbnail, dialog picker |
| Nhân vật | MC/DJ, Live2D/3D, dual-host, motion/layout | Model, platform, control chi tiết |
| AI MC/DJ | Provider/model/endpoint/key, persona, auto-hype, test prompt | Tab con, default prompt, trạng thái provider |
| Test LIVE | Fake guest/join/chat/follow/like/gift | Form payload và lịch sử event |
| Cập nhật | Check, manifest, download, backup, rollback | Progress/dialog/release notes |
| Stage | 9:16, viewer/gift/level/leaderboard/LED/background/media | Composition, typography, animation gốc |

## 3. Nhận diện mới OrbitStage Live

Nhận diện này được tạo mới để không sao chép thương hiệu hoặc asset không rõ quyền.

| Token | Giá trị | Mục đích |
|---|---|---|
| `bg` | `#090b14` | Nền app |
| `surface` | `#101526` | Sidebar/header |
| `panel` | `#151b31` | Card và dialog |
| `primary` | `#8b5cf6` | CTA/selection |
| `cyan` | `#22d3ee` | LIVE/network/LED |
| `lime` | `#a3e635` | Healthy/success |
| `danger` | `#fb7185` | Stop/error/destructive |
| `text` | `#f8fafc` | Nội dung chính |
| `muted` | `#94a3b8` | Nội dung phụ |
| Font | Segoe UI, system fallback | Tự nhiên trên Windows |

Shell Control dùng sidebar cố định 240 px, nội dung co giãn, dark theme. Icon nên là SVG nguyên gốc hoặc bộ icon có license được ghi vào manifest/package notices. Không dùng icon/logo ứng dụng cũ khi chưa có quyền.

## 4. Bố cục Control

- Sidebar 240 px: brand, trạng thái service tóm tắt, tám mục `Điều khiển LIVE`, `LED`, `Tùy chỉnh`, `Nhân vật`, `AI MC/DJ`, `Test LIVE`, `Cập nhật`, `License`.
- `Điều khiển LIVE` là màn mặc định.
- Header nội dung: title, description, badge connection/health và action theo màn.
- Main content: grid card, tối đa khoảng 1200 px để đọc tốt; scroll riêng content, sidebar giữ cố định.
- Stage là cửa sổ/route riêng, không phải mục điều hướng trong Control.

## 5. Trạng thái component

### Nút

- Primary: nền violet, chữ trắng; hover sáng nhẹ; active dịch 1 px; focus ring cyan rõ ràng.
- Secondary: panel/outline; hover tăng border contrast.
- Danger: coral, chỉ dùng Stop, Remove, Rollback; action không khôi phục phải có confirm dialog.
- Disabled: opacity giảm nhưng label vẫn đọc được; cursor và tooltip giải thích điều kiện.
- Loading: giữ nguyên chiều rộng, spinner + label hành động, ngăn double-submit.

### Trạng thái kết nối

| State | Màu/nhãn | Hành vi |
|---|---|---|
| Idle | muted / `Chưa chạy` | Cho sửa endpoint và Run |
| Connecting | cyan / `Đang kết nối` | Disable Run, cho Stop |
| Connected | lime / `Đã kết nối` | Hiện heartbeat/last event |
| Reconnecting | cyan pulse / `Đang kết nối lại` | Giữ stage, hiện attempt |
| Degraded | amber / `Suy giảm` | Nêu component lỗi và Retry |
| Error | coral / `Lỗi` | Thông báo dễ hiểu + Diagnostics |

### Form và secret

- Label luôn hiện; placeholder không thay label.
- Validation đặt sát field và có summary khi submit.
- API/license key mặc định masked; không có nút copy plaintext. Renderer chỉ biết `Đã lưu`.
- Thay đổi chưa lưu tạo dirty indicator; rời màn có confirm nếu dữ liệu sẽ mất.

### Dialog

- Focus trap, Esc để đóng trừ bước commit update, trả focus về trigger.
- Confirm destructive nêu cụ thể ảnh hưởng, dùng động từ rõ (`Xóa`, `Rollback`, `Dừng LIVE`).
- Không dùng dialog cho thông báo có thể hiển thị inline/toast.

## 6. Luồng thao tác chính

### Khởi tạo và LIVE

1. App mở vào Điều khiển LIVE; health card cho biết local server ở `127.0.0.1:17321`.
2. Người dùng nhập/kiểm tra TikFinity endpoint `ws://127.0.0.1:21213/` và tài khoản hiển thị.
3. `Kiểm tra kết nối` xác minh endpoint nhưng không bắt đầu phiên nếu implementation hỗ trợ.
4. `Chạy LIVE` chuyển qua connecting rồi connected; activity feed bắt đầu cập nhật.
5. `Mở Stage` mở cửa sổ 9:16; `Sao chép URL OBS` cung cấp local URL.
6. `Dừng LIVE` dừng bridge/reconnect; UI nói rõ nhạc/stage có tiếp tục hay không.

### Test fake event

1. Chọn event type.
2. Form thay đổi theo schema nhưng có preset hợp lệ.
3. Preview payload đã sanitize.
4. Gửi event qua đúng router thật; history hiển thị accepted/rejected và lý do.

### AI/TTS

1. Chọn provider, endpoint/model; nhập key qua secret IPC.
2. `Kiểm tra AI` chạy prompt ngắn và hiển thị latency/kết quả đã lọc.
3. Chọn TTS OpenAI/Edge, voice, volume; test voice đi vào speech queue chung.
4. Bật auto-hype sau khi chọn interval/cooldown/content policy; UI hiển thị lần chạy kế tiếp.

### Update

1. Check chỉ đọc manifest và hiển thị version/hash/signature status.
2. Download có progress/cancel an toàn.
3. Install dialog nêu backup/restart; chỉ enable khi verification pass.
4. Sau restart, UI hiển thị success hoặc rollback record.

## 7. Accessibility và Windows UX

- Tất cả action dùng được bằng bàn phím, focus visible, target tối thiểu 32 px.
- Không dùng màu làm tín hiệu duy nhất; badge luôn có icon/text.
- Text thông thường đạt contrast WCAG AA; animation tôn trọng reduced motion.
- Zoom/scaling 100–200% không che CTA; Control có min-size hợp lý.
- Stage có safe area và quality profile; nội dung quan trọng không sát mép OBS crop.

## 8. Điều kiện để hoàn tất phân tích nguồn

Cần chủ dự án cung cấp screenshot/video của từng màn và xác nhận có quyền dùng chúng cho mục đích tham chiếu. Sau đó ghi kích thước cửa sổ, DPI, state, phiên bản app và cập nhật [screenshot-comparison.md](screenshot-comparison.md). Không nhập asset từ ảnh chụp nếu chưa có quyền riêng cho asset đó.

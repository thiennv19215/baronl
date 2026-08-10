# Cấu hình TikFinity

Tài liệu TikFinity Event API chính thức được kiểm tra ngày 2026-08-10 cho biết desktop app cung cấp WebSocket local `ws://localhost:21213/` và frame dạng `{ "event": "chat", "data": {} }`. OrbitStage dùng địa chỉ tương đương nhưng rõ loopback: `ws://127.0.0.1:21213/`. Tham khảo [TikFinity Event API](https://staging.tikfinity.com/tiktok/chatbot); tên payload có thể thay đổi theo phiên bản TikFinity.

## Chuẩn bị TikFinity

1. Cài/mở TikFinity Desktop từ nguồn chính thức và hoàn tất setup tài khoản.
2. Nhập đúng TikTok `@handle`, không dùng display name nếu TikFinity yêu cầu username.
3. Bắt đầu TikTok LIVE hoặc dùng chức năng test của TikFinity khi chỉ cấu hình. Một số event chỉ xuất hiện trong phiên LIVE thật.
4. Giữ TikFinity Desktop chạy trên cùng máy với OrbitStage. Event API local không nên được expose ra LAN/Internet.

## Kết nối từ OrbitStage

1. Mở `Điều khiển LIVE`.
2. TikFinity WebSocket: `ws://127.0.0.1:21213/`.
3. Bấm `Kiểm tra kết nối` nếu action có sẵn; sửa lỗi trước khi LIVE.
4. Bấm `Chạy LIVE` và chờ trạng thái `Đã kết nối`.
5. Dùng `Test LIVE` gửi một join/chat/gift giả để kiểm tra Stage độc lập với TikFinity.

Chỉ đổi endpoint khi TikFinity thực tế hiển thị port khác. Endpoint ngoài loopback phải bị từ chối theo mặc định; không port-forward 21213.

## Mapping event

TikFinity hiện tài liệu hóa các tên như `chat`, `gift`, `share`, `follow`, `like`, `roomUser`, `subscribe`. Một số phiên bản/connector có thể dùng alias khác. Adapter OrbitStage chuẩn hóa theo bảng sau và bỏ qua event không biết một cách an toàn:

| Upstream/alias có thể gặp | Event nội bộ | Ghi chú |
|---|---|---|
| `member`, `join` | `join` | Không suy `roomUser` count thành join cá nhân nếu không có viewer payload. |
| `chat`, `comment` | `chat` | Sanitize text, giới hạn độ dài, không render HTML. |
| `follow` | `follow` | Dedupe theo event id/fingerprint. |
| `like` | `like` | Có burst/rate limiting. |
| `gift` | `gift` | Validate count/repeat/diamond fields; tên gift có fallback. |
| socket close/error | `disconnect` | Giữ snapshot Stage. |
| socket open sau reconnect | `reconnect` | Lấy snapshot/sequence mới. |
| `share`, `subscribe`, `roomUser` | Extension/ignore an toàn | Không ép thành event sai; log tên đã sanitize ở debug. |

Fake event phải đi qua cùng schema/validator/router, chỉ khác `source: "fake"`.

## Reconnect kỳ vọng

- Khi TikFinity đóng hoặc restart, OrbitStage chuyển `Đang kết nối lại`, không xóa leaderboard/current stage.
- Retry dùng backoff có jitter; UI hiển thị attempt hoặc lần thử tiếp theo.
- Khi người dùng bấm Stop, timer retry phải dừng.
- Sau reconnect, không thêm listener trùng và không replay gift hai lần.

## Kiểm thử trước khi LIVE

1. Mở Stage và OBS Browser Source.
2. Gửi lần lượt fake join, chat Unicode, follow, like burst, gift thường và super gift.
3. Gửi tên rất dài/HTML-like để chắc chắn layout không vỡ và text không chạy script.
4. Tắt TikFinity 10–20 giây rồi mở lại; quan sát reconnect.
5. Xác minh nhạc tiếp tục và AI/TTS lỗi (nếu provider offline) không chặn event Stage.

## Khi không kết nối được

- Kiểm tra TikFinity Desktop đang chạy và Event API khả dụng ở phiên bản/tài khoản hiện tại.
- Xác nhận endpoint/port, không nhầm với OBS WebSocket.
- Kiểm tra port có bị app khác chiếm; restart TikFinity rồi OrbitStage.
- Không mở firewall inbound cho 21213; cả hai app phải chạy cùng máy.
- Export diagnostic bundle đã redaction và ghi version TikFinity/OrbitStage; không gửi API/license key.

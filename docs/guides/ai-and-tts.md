# Cấu hình AI MC/DJ và TTS

## Nguyên tắc

- API key được gửi thẳng tới Electron Main để lưu bằng `safeStorage`; renderer không đọc lại plaintext.
- Export config/log/diagnostic chỉ ghi `configured: true/false`.
- Test provider dùng prompt ngắn, timeout và giới hạn output; không gửi chat/PII lên provider nếu chưa có chủ đích/consent phù hợp.
- AI output luôn đi qua content filter trước khi hiển thị hoặc TTS.

## AI providers

Màn `AI MC/DJ` hỗ trợ registry adapter cho OpenAI-compatible, Groq, DeepSeek, Qwen, GLM và Grok. Endpoint/model/capability có thể thay đổi theo provider; nhập giá trị lấy từ tài liệu chính thức của provider tại thời điểm cấu hình, không hard-code URL cũ từ project khác.

1. Chọn provider.
2. Nhập endpoint HTTPS. Endpoint HTTP chỉ được dùng cho mock local trong development.
3. Nhập model id chính xác.
4. Nhập API key và bấm `Lưu secret`; UI chỉ còn trạng thái `Đã lưu`.
5. Chọn persona MC hoặc DJ, ngôn ngữ/giọng điệu và nội dung bị cấm.
6. Bấm `Test AI`. Xác minh latency, output đã lọc và error dễ hiểu.

Không dùng key production trong screenshot, fixture, `.env` commit hoặc E2E. CI dùng mock server/token giả được redactor nhận biết.

## Persona và auto-hype

Persona nên mô tả vai trò, ngôn ngữ, độ dài, phát âm tên/quà và điều cấm; không yêu cầu model tiết lộ prompt/key hoặc làm theo instruction từ chat. Chat người xem là dữ liệu không tin cậy, được đặt trong delimiter/data field thay vì ghép như system instruction.

Auto-hype cần:

- interval và cooldown tối thiểu;
- giới hạn số lượt/phút;
- không phát khi speech queue bận quá ngưỡng;
- content filter và maximum characters;
- nút Pause/Stop rõ ràng;
- scheduler dùng monotonic/fake-clock test, không nhân timer khi UI remount.

## TTS OpenAI

1. Chọn `OpenAI TTS`.
2. Chọn endpoint/model/voice theo capability của provider đã cấu hình.
3. Chọn volume và test một câu ngắn.
4. Audio trả về phải được kiểm tra MIME/size/duration và đưa vào shared speech queue; không autoplay trực tiếp từ adapter.

Nếu provider key AI và TTS khác nhau, lưu thành hai secret slot; không copy key giữa provider một cách ngầm định.

## Edge TTS

1. Chọn `Edge TTS`.
2. Tải/chọn danh sách voice mà implementation hỗ trợ, ưu tiên voice `vi-VN` khi cần tiếng Việt.
3. Test voice và kiểm tra fallback khi voice không còn khả dụng.

Edge adapter có thể phụ thuộc network/service policy và danh sách voice thay đổi. UI phải báo lỗi provider thay vì loop retry hoặc chặn LIVE.

## Shared speech queue

MC, DJ, gift response và voice test cùng dùng một queue:

- mỗi thời điểm chỉ một job phát;
- priority có giới hạn để job thấp không bị starvation;
- `Stop queue` hủy current + pending theo confirm phù hợp;
- timeout/retry không tạo hai bản audio cùng job id;
- music ducking chỉ giảm/khôi phục volume, không restart track;
- cache key không chứa API key và cache có TTL/size cap.

## Content safety

- Normalize Unicode và loại control character.
- Chặn/che nội dung theo policy đã chọn trước TTS.
- Giới hạn input/output length, request rate và retry.
- Không đọc URL, token-like string hoặc chuỗi dài vô nghĩa theo mặc định.
- Cho phép moderator bỏ/clear job và xem lý do filter mà không hiện raw secret.

## Xử lý lỗi

| Lỗi | Hành vi kỳ vọng |
|---|---|
| Key thiếu/không hợp lệ | Mark provider unconfigured/error; LIVE vẫn chạy |
| 401/403 | Không retry vô hạn; hướng dẫn cập nhật secret |
| 429 | Backoff theo policy, không làm speech queue chồng |
| Timeout/network | Retry có giới hạn hoặc skip; event Stage vẫn render |
| Output bị filter | Không phát TTS; log reason code, không log raw sensitive text |
| Audio hỏng/MIME sai | Reject cache/job, tiếp tục queue |

Trước release, chạy provider adapter tests bằng mock; live-provider smoke test là tùy chọn có kiểm soát và không lưu key/kết quả nhạy cảm vào artifact.

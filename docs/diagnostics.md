# Health check, log và diagnostic bundle

## Health check

`GET http://127.0.0.1:<port>/health` chỉ trả dữ liệu vận hành không nhạy cảm:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptimeSeconds": 42,
  "components": {
    "localServer": "ok",
    "tikfinity": "disconnected",
    "stage": "ok",
    "speechQueue": "idle"
  }
}
```

Không trả endpoint có credential, username TikTok đầy đủ, nội dung chat, path userData, machine id, API key hoặc license key. `status` tổng có thể là `starting`, `ok`, `degraded` hoặc `failed`.

## Structured log

- JSON Lines có timestamp UTC, level, component, event name, correlation id và field đã sanitize.
- Quay vòng theo size/thời gian, retention hữu hạn; không log raw WebSocket frame theo mặc định.
- Error stack được phép nhưng message/context phải qua redactor trước serialize.
- Renderer gửi log qua IPC schema nhỏ; không được tùy ý chọn path hoặc component name.
- Các action nhạy cảm chỉ ghi outcome/mã lỗi, không ghi input bí mật.

## Nội dung bundle cho phép

- `summary.json`: version app/OS/architecture, timestamp, health snapshot.
- `config.redacted.json`: cấu hình không bí mật và cờ `configured`.
- `logs/*.jsonl`: cửa sổ log giới hạn và đã redact.
- `assets-report.json`: kết quả validator, không kèm asset người dùng nếu chưa đồng ý.
- `update-journal.redacted.json`: trạng thái update không có URL token.

Không bao gồm secret store, `.env`, cookie, localStorage dump, raw chat history, activation key, private key, file tùy ý trong user profile hoặc media có bản quyền.

## Quy trình export

1. Người dùng mở Diagnostics, xem trước danh sách file/loại dữ liệu.
2. Main dựng bundle trong temporary directory riêng bằng allow-list.
3. Redact field + pattern, giới hạn size và quét canary/secret lần cuối.
4. Archive vào vị trí do người dùng chọn; tên không chứa username/machine id.
5. Xóa temporary directory sau thành công/lỗi; log chỉ ghi bundle id và kích thước.

## Recovery của service

Supervisor dùng heartbeat và restart budget, ví dụ tối đa 3 lần trong 5 phút. Khi vượt budget, health chuyển `degraded`, UI cung cấp Restart service và Export diagnostics. Không restart vô hạn và không đóng toàn bộ app chỉ vì AI/TTS provider lỗi.

## Checklist xác minh

- `/health` chỉ bind loopback và không chứa secret.
- Chuỗi canary không xuất hiện trong log hoặc archive, kể cả URL-encoded/base64 phổ biến.
- Bundle vẫn tạo được khi TikFinity/AI offline.
- Bundle không vượt size cap và không theo symlink/reparse point.
- Archive mở được và manifest file khớp nội dung.

Trạng thái chạy thực tế được ghi trong [test-report.md](test-report.md).

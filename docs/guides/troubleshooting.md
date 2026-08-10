# Khắc phục sự cố

## App không mở

- Mở log/Diagnostics từ shortcut hỗ trợ nếu có; không chạy binary với quyền Administrator trừ khi tài liệu release yêu cầu.
- Kiểm tra artifact đúng architecture và chữ ký/checksum.
- Nếu vừa update, kiểm tra rollback journal; không xóa backup thủ công.
- Development: chạy `npm run typecheck`, `npm run build`; production/clean machine không được yêu cầu cài Node.js.

## Port 17321 bị chiếm

- OrbitStage phải báo process/port conflict dễ hiểu và cho chọn port loopback hợp lệ nếu feature hỗ trợ.
- Đóng instance OrbitStage cũ hoặc ứng dụng thực sự chiếm port.
- Không đổi bind sang `0.0.0.0` và không mở firewall inbound.
- Nếu đổi port, cập nhật OBS Browser Source bằng nút `Sao chép URL OBS`.

## TikFinity không kết nối

- Xác minh TikFinity Desktop chạy cùng máy và endpoint `ws://127.0.0.1:21213/`.
- Không nhầm với OBS WebSocket port.
- Kiểm tra username/TikTok LIVE trong TikFinity và version Event API.
- Restart TikFinity rồi bấm Retry/Run LIVE; Stop phải dừng reconnect.
- Dùng Test LIVE để tách lỗi TikFinity khỏi Stage/router.

## Event không hiện trên Stage

1. Kiểm tra `/health` và connection state.
2. Gửi fake event cùng loại.
3. Nếu fake cũng lỗi: kiểm tra WebSocket Stage, sequence/snapshot, console/log đã redaction.
4. Nếu chỉ event thật lỗi: export payload shape đã sanitize/event name, không gửi raw user data không cần thiết.
5. Asset lỗi phải hiện placeholder; chạy `npm run assets:check` ở development.

## OBS trắng hoặc không kết nối

- Mở URL Stage trong browser cùng máy; OrbitStage phải đang chạy.
- Xác nhận URL/port, width 1080/height 1920.
- Refresh Browser Source; Stage phải reconnect và lấy snapshot.
- Tạm bỏ `transparent=1` để phân biệt nền trong suốt với blank page.
- Kiểm tra quality/GPU fallback; không tắt Electron web security.

## Audio phát hai lần hoặc nhạc reset

- Chỉ capture một nguồn audio trong OBS.
- Kiểm tra không mở nhiều Browser Source cùng phát audio.
- AudioCoordinator phải có một owner; đổi layout/Stage reload không được tạo player thứ hai.
- Dùng placeholder loop, ghi current position trước/sau khi đóng/mở Stage và đưa vào bug report.

## AI/TTS lỗi

- Kiểm tra provider/model/endpoint và trạng thái key `Đã lưu`; không dán key vào log/ticket.
- 401/403: thay key/quyền; 429: chờ cooldown; timeout: kiểm tra network/provider.
- Test Edge/OpenAI TTS riêng nhưng cả hai vẫn qua shared queue.
- Clear/Stop queue nếu job kẹt; LIVE/Stage phải tiếp tục không phụ thuộc provider.

## Asset thiếu/sai hash

Chạy:

```powershell
npm run assets:check
```

Không sửa hash để “cho pass” khi file không rõ nguồn. Khôi phục asset đã review hoặc dùng placeholder có quyền, cập nhật manifest/rights report và review diff.

## Update không thành công

- Không chạy lại installer chưa verify hoặc xóa backup.
- Ghi mã lỗi/update journal đã redaction.
- Nếu startup health fail, để updater tự rollback; xác minh version sau restart.
- Export diagnostics; không gửi secret store/update URL có token.

## Chuẩn bị báo cáo lỗi

Ghi version OrbitStage/TikFinity/Windows, thời điểm UTC, bước tái hiện, expected/actual, screenshot đã che dữ liệu và diagnostic bundle. Không đính API key, activation key, cookie, chat history thô hoặc asset có bản quyền ngoài phạm vi hỗ trợ.

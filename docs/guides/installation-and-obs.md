# Cài đặt OrbitStage Live và cấu hình OBS

## Cài ứng dụng Windows

1. Tải installer và file checksum/signature từ kênh phát hành chính thức của dự án.
2. Kiểm tra publisher trong Windows và SHA-256 theo release notes. Không chạy installer từ mirror không được công bố.
3. Chạy `OrbitStage-Live-Setup-<version>.exe` và làm theo trình cài đặt.
4. Mở OrbitStage Live. Bản đóng gói phải chạy độc lập, không yêu cầu cài Node.js trên máy người dùng.
5. Ở màn Điều khiển LIVE, xác minh Local server là `http://127.0.0.1:17321` và Health là `OK` hoặc nêu lỗi cụ thể.

Tên artifact có thể khác trong bản development; dùng tên/chữ ký ghi trong release notes của đúng version. Nếu Windows báo publisher không xác định, chỉ tiếp tục với build development do chính nhóm dự án tạo; production release phải qua signing policy.

## Mở Stage

- Trong Control, chọn `Mở Stage` để mở cửa sổ dọc riêng.
- URL OBS mặc định: `http://127.0.0.1:17321/stage`.
- Stage chỉ truy cập được trên cùng máy vì server bind loopback.
- Chế độ trong suốt/quality được chọn bằng UI; nếu dùng query thủ công, chỉ dùng query được app công bố và không đặt API key/token vào URL.

## Thêm OBS Browser Source

1. Khởi động OrbitStage trước để local server sẵn sàng.
2. Trong OBS, mở scene cần dùng, bấm `+` ở Sources và chọn `Browser`.
3. Đặt tên, ví dụ `OrbitStage 9x16`.
4. URL: `http://127.0.0.1:17321/stage?transparent=1&quality=high`.
5. Width `1080`, Height `1920`; FPS nên bắt đầu ở 30, tăng theo profile/máy nếu cần.
6. Bật/tắt `Shutdown source when not visible` theo nhu cầu. Nếu bật, Stage sẽ reconnect/lấy snapshot khi source xuất hiện lại; nhạc không được reset vì audio owner nằm ngoài Stage.
7. Không bật custom CSS lấy từ nguồn không tin cậy. Crop/scale trong OBS phải giữ tỷ lệ 9:16.

Nếu implementation dùng URL được tạo kèm session parameter, luôn bấm `Sao chép URL OBS` thay vì tự dựng URL. Không chia sẻ URL/token ra ngoài máy.

## Audio trong OBS

Chọn đúng một đường audio:

- Nếu OrbitStage phát audio vào desktop output, capture thiết bị đó trong OBS.
- Nếu Browser Source được cấu hình capture audio, tránh capture cùng âm thanh lần hai ở Desktop Audio.

Phát chime/nhạc test và quan sát mixer trước khi LIVE. TTS dùng queue chung; khi TTS nói, music ducking (nếu bật) không tạo thêm audio owner.

## Gỡ cài đặt và dữ liệu

Uninstaller phải gỡ binary ứng dụng. Dữ liệu cấu hình/user assets có thể được giữ để tránh mất dữ liệu; bản release phải hỏi hoặc tài liệu hóa rõ. Trước khi xóa dữ liệu, export cấu hình/asset catalog; export không chứa secret. Không xóa thủ công thư mục không xác định.

## Kiểm tra nhanh sau cài

- Control mở và hiển thị tám màn điều hướng.
- `/health` trả trạng thái mà không chứa secret.
- Stage mở trong Electron và OBS.
- Test LIVE gửi join/chat/gift giả lên Stage.
- Chime/nhạc placeholder phát, pause/skip/volume hoạt động.
- Đóng/mở Stage không đưa nhạc về đầu.

Kịch bản này không thay thế manual clean-machine gate. Xem [test-report.md](../test-report.md) để biết kịch bản nào thực sự đã chạy.

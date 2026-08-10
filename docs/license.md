# Chính sách module license

## Mặc định sản phẩm

OrbitStage LIVE mặc định chạy ở chế độ miễn phí với cấu hình license `disabled`. Đây là chế độ sản phẩm hợp lệ, không phải cơ chế bypass. Khi `disabled`, ứng dụng:

- Không yêu cầu activation key.
- Không gọi máy chủ license.
- Không thu thập device identity cho mục đích license.
- Hiển thị rõ `Free mode` trên màn License.

## Ranh giới module

Core LIVE, Stage, TikFinity, AI/TTS và dữ liệu người dùng không phụ thuộc trực tiếp vào SDK/license server. Chúng chỉ nhận một capability snapshot từ interface license:

```ts
interface LicenseProvider {
  getStatus(): Promise<LicenseStatus>;
  activate(input: ActivationInput): Promise<LicenseStatus>;
  deactivate(): Promise<void>;
  refresh(): Promise<LicenseStatus>;
}
```

Hai implementation được phép:

- `DisabledLicenseProvider`: luôn trả free capability theo policy compile/runtime đã công bố.
- `SignedLicenseProvider`: dùng máy chủ do dự án mới sở hữu, xác minh phản hồi có chữ ký và áp dụng offline grace policy rõ ràng.

Không nhập code, key, endpoint, device fingerprint hay thuật toán license của ứng dụng cũ. Không thêm biến môi trường hoặc phím tắt để bỏ qua kiểm tra của `SignedLicenseProvider`.

## Dữ liệu và riêng tư

Nếu sau này bật license trả phí, UI phải mô tả dữ liệu gửi đi, mục đích, thời hạn lưu và offline policy trước activation. Device identity phải là định danh do app mới tạo, tối thiểu hóa dữ liệu và có version. Activation key lưu qua `safeStorage`, không vào log/diagnostic/export.

## Trạng thái UI

| Trạng thái | Hành vi |
|---|---|
| Free / disabled | App hoạt động bình thường theo capability miễn phí, không có network license. |
| Checking | Không khóa app vô hạn; có timeout và thông báo. |
| Active | Hiển thị gói và thời hạn, che key. |
| Offline grace | Hiển thị ngày hết grace và cách khôi phục kết nối. |
| Expired/invalid | Chỉ giới hạn capability đúng policy; dữ liệu người dùng vẫn export được. |
| Server error | Không tự coi là gian lận; áp dụng grace policy và retry có giới hạn. |

## Kiểm thử bắt buộc

- Free mode không tạo request mạng license.
- Enabled mode từ chối response sai chữ ký, sai audience, hết hạn hoặc replay.
- Clock skew và offline grace có boundary tests.
- Log và diagnostic không chứa activation key/device raw id.
- Chuyển cấu hình mode chỉ qua cơ chế sản phẩm được công bố, không qua hidden bypass.

# Cập nhật, backup và rollback

## Mô hình tin cậy

Updater chỉ tin manifest từ feed HTTPS đã cấu hình và phải xác minh chữ ký manifest bằng public key đóng gói trong app. SHA-256 trong manifest dùng kiểm tra integrity của từng artifact; hash không thay thế chữ ký. Private signing key không bao giờ nằm trong repository hoặc CI log.

## Manifest tối thiểu

```json
{
  "schemaVersion": 1,
  "channel": "stable",
  "version": "1.2.3",
  "publishedAt": "2026-08-10T00:00:00Z",
  "artifact": {
    "url": "https://updates.example.invalid/orbitstage-1.2.3.exe",
    "sha256": "<64 lowercase hex>",
    "bytes": 123456
  },
  "minimumSupportedVersion": "1.0.0",
  "signature": "<base64 detached signature>"
}
```

Production phải thay domain mẫu và provision public key qua quy trình release. Redirect sang scheme/host ngoài allow-list bị từ chối. So sánh version bằng parser semver, không so sánh chuỗi.

## Transaction cập nhật

1. `check`: tải manifest với timeout/size limit; validate schema, channel, version, chữ ký.
2. `download`: ghi vào thư mục staging mới; stream hash và giới hạn số byte.
3. `verify`: so sánh exact size/hash và xác minh chữ ký Authenticode/code signing theo policy.
4. `prepare`: kiểm tra dung lượng; chụp backup config/schema và ghi rollback journal atomic.
5. `install`: đóng service theo thứ tự, chạy installer/helper đã xác minh.
6. `commit`: app mới khởi động, chạy startup health marker trong thời hạn quy định.
7. `rollback`: nếu không có marker hoặc migration lỗi, helper khôi phục bản trước và config backup tương thích.
8. `cleanup`: chỉ xóa backup sau số lần khởi động/retention policy đã cấu hình.

Không ghi đè trực tiếp binary đang chạy và không xóa backup trước commit.

## Backup dữ liệu

- Backup gồm config không bí mật, asset manifest người dùng và schema metadata cần phục hồi.
- Secret store giữ nguyên tại vị trí hệ điều hành; không đưa plaintext/ciphertext vào diagnostic.
- Mỗi backup có app version, config schema version, timestamp UTC và checksum.
- Restore dùng temporary directory + atomic rename; kiểm tra path traversal và dung lượng.

## Kịch bản kiểm thử

| Kịch bản | Kỳ vọng | Trạng thái ban đầu |
|---|---|---|
| Manifest sai schema/chữ ký | Từ chối trước download/install | `NOT RUN` |
| Artifact sai hash/size | Xóa staging, app hiện tại tiếp tục chạy | `NOT RUN` |
| Mất mạng giữa download | Retry có giới hạn hoặc resume an toàn | `NOT RUN` |
| Mất điện/crash giữa commit | Journal dẫn tới resume/rollback xác định | `NOT RUN` |
| App mới không đặt health marker | Tự rollback bản backup | `NOT RUN` |
| Config migration lỗi | Giữ backup, rollback không mất dữ liệu | `NOT RUN` |
| Downgrade/replay manifest | Từ chối ngoài policy có xác nhận | `NOT RUN` |

Các dòng chỉ được chuyển `PASS` khi test updater thực sự tạo bằng chứng; không suy ra từ mock UI.

# OrbitStage asset registry

Mọi asset đi kèm installer phải được đăng ký trong `manifest.json`. Registry lưu category, MIME, path tương đối, kích thước byte, SHA-256, metadata hiển thị và bằng chứng quyền sử dụng.

## Quy tắc

1. Không chép asset từ ứng dụng/project cũ khi chưa có xác nhận quyền bằng văn bản.
2. Asset `rights.status` khác `approved` không được đóng gói; dùng placeholder `approved` thay thế.
3. Không ghi API key, private key, license key, URL có token hoặc dữ liệu người dùng vào asset/metadata.
4. Đường dẫn dùng dấu `/`, nằm dưới `assets/`, không symlink và không chứa `..`.
5. Sau khi sửa asset, cập nhật `bytes`/`sha256` có review và chạy:

```powershell
npm run assets:check
# hoặc
node scripts/validate-assets.mjs
```

Các placeholder trong repository là tác phẩm mới/tạo bằng thuật toán đơn giản và được cấp theo [LICENSE.md](LICENSE.md). Chúng có nhãn/metadata rõ ràng, không đại diện cho asset production.

## Thêm asset do chủ dự án cung cấp

- Lưu file vào category phù hợp.
- Ghi nguồn, rights holder, SPDX license hoặc điều khoản nội bộ, evidence và phạm vi phân phối.
- Nếu chỉ có quyền dùng nội bộ, ghi restriction rõ ràng và không đưa vào release công khai.
- Tạo id ổn định, cập nhật metadata/hashes, chạy validator.
- Cập nhật `docs/assets/inventory.md` và `docs/assets/rights-report.md`.

Không đưa file vào registry nếu quyền sử dụng còn `pending`; hãy giữ file ngoài release tree và dùng placeholder.

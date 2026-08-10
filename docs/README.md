# Hồ sơ kỹ thuật OrbitStage LIVE

Thư mục này là nguồn sự thật cho phạm vi, kiến trúc, quyền sử dụng asset và bằng chứng nghiệm thu của ứng dụng OrbitStage LIVE.

## Tài liệu chính

- [Kiến trúc hệ thống](architecture.md)
- [Phạm vi và checklist nghiệm thu](scope-and-acceptance.md)
- [Phân tích giao diện nguồn](ui/source-ui-analysis.md)
- [Wireframe](ui/wireframes.md)
- [Ma trận ảnh đối chiếu](ui/screenshot-comparison.md)
- [Kiểm kê asset](assets/inventory.md)
- [Báo cáo quyền sử dụng asset](assets/rights-report.md)
- [Mô hình bảo mật](security.md)
- [Cập nhật, backup và rollback](update-and-rollback.md)
- [Chính sách license](license.md)
- [Health check và chẩn đoán](diagnostics.md)
- [Báo cáo kiểm thử](test-report.md)
- [Evidence build, test và release](release-evidence.md)
- [Báo cáo theo giai đoạn](phase-reports.md)

## Hướng dẫn vận hành

- [Cài đặt và OBS](guides/installation-and-obs.md)
- [Cấu hình TikFinity](guides/tikfinity.md)
- [Cấu hình AI và TTS](guides/ai-and-tts.md)
- [Development và build](guides/development.md)
- [Phát hành Windows](guides/release.md)
- [Khắc phục sự cố](guides/troubleshooting.md)

## Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| `PASS` | Có triển khai và bằng chứng kiểm tra được ghi rõ. |
| `FAIL` | Đã chạy và không đạt; phải sửa rồi chạy lại. |
| `PARTIAL` | Có triển khai nhưng còn thiếu một phần tiêu chí hoặc bằng chứng. |
| `NOT VERIFIED` | Chưa có đủ bằng chứng để kết luận. |
| `NOT RUN` | Kịch bản kiểm thử chưa được chạy. |
| `BLOCKED` | Thiếu đầu vào/quyền/môi trường bên ngoài; có ghi rõ điều kiện gỡ chặn. |
| `N/A` | Không áp dụng theo quyết định phạm vi có tài liệu. |

Không đổi trạng thái thành `PASS` chỉ dựa trên việc có source code. Cần ghi lệnh kiểm tra, artifact hoặc kết quả quan sát tương ứng.

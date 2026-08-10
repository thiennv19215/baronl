# Ma trận ảnh đối chiếu UI

## Trạng thái nguồn

`BLOCKED_SOURCE`: không có screenshot hoặc ứng dụng nguồn trong đầu vào; xem [source/README.md](../screenshots/source/README.md). Vì thế chưa thể đưa ra phần trăm tương đồng hoặc kết luận “tương đương giao diện nguồn”. Đây không phải lỗi build; là thiếu bằng chứng nghiệm thu bên ngoài repository.

## Quy ước chụp

- Bộ Control hiện có dùng viewport đồng nhất 1440×866; Windows scaling theo máy capture. Lần đối chiếu nguồn phải chụp cùng viewport/DPI/state.
- Stage: viewport 1080×1920 logical, cả opaque và transparent khi phù hợp.
- Chụp PNG lossless sau khi font/animation ổn định; tắt timestamp động hoặc dùng deterministic fixture.
- Ảnh app mới nằm dưới `docs/screenshots/new/`; ảnh nguồn hợp pháp sẽ đặt dưới `docs/screenshots/source/` và không đưa vào release nếu quyền chỉ cho tham chiếu.
- Diff ưu tiên bố cục, clipping, contrast, focus, disabled/error/loading/dialog state; không ép dùng asset nguồn không có quyền.

## Ma trận

| ID | Màn/state bắt buộc | Ảnh nguồn | Ảnh app mới dự kiến | Trạng thái | Sai khác/việc cần làm |
|---|---|---|---|---|---|
| UI-01 | License · free mode | Không được cung cấp | [control-license.png](../screenshots/new/control-license.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | Free mode, module off và tuyên bố không bypass hiển thị rõ; chưa thể so nguồn. |
| UI-02 | License · invalid/offline | Không được cung cấp | Chưa chụp | `N/A_DEFAULT_FREE / BLOCKED_SOURCE` | Chỉ áp dụng nếu commercial module được bật. |
| UI-03 | Điều khiển LIVE · idle | Không được cung cấp | [control-live.png](../screenshots/new/control-live.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | Endpoint 21213, local 17321, OBS URL và audio control thấy rõ. |
| UI-04 | Điều khiển LIVE · connected | Không được cung cấp | Chưa chụp | `PENDING_NEW / BLOCKED_SOURCE` | Cần deterministic fake connection. |
| UI-05 | Điều khiển LIVE · reconnect/error | Không được cung cấp | Chưa chụp | `PENDING_NEW / BLOCKED_SOURCE` | Không được xóa state stage. |
| UI-06 | LED · editor/preview | Không được cung cấp | [control-led.png](../screenshots/new/control-led.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | Preview, text, motion, speed, color và apply state rõ; cần test overflow riêng. |
| UI-07 | Tùy chỉnh · catalog/layout | Không được cung cấp | [control-customize.png](../screenshots/new/control-customize.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | Có preview 9:16, theme, background/video, quality/avatar và layer; trang scroll hợp lý. |
| UI-08 | Nhân vật · fallback | Không được cung cấp | [control-characters.png](../screenshots/new/control-characters.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | Nêu rõ SVG/CSS fallback khi chưa có model Live2D/GPU. |
| UI-09 | AI MC/DJ · configured/off | Không được cung cấp | [control-ai.png](../screenshots/new/control-ai.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | API key masked, persona/filter/auto-hype/TTS/queue playground có mặt; AI đang off. |
| UI-10 | AI MC/DJ · error/queue | Không được cung cấp | Chưa chụp | `PENDING_NEW / BLOCKED_SOURCE` | Cần state timeout/filter/queue. |
| UI-11 | Test LIVE · gift | Không được cung cấp | [control-test.png](../screenshots/new/control-test.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | Gift form và validated payload cùng thấy; history chưa có event sau gửi. |
| UI-12 | Cập nhật · no update/diagnostics | Không được cung cấp | [control-update.png](../screenshots/new/control-update.png) · 1440×866 | `NEW_CAPTURED / BLOCKED_SOURCE` | Trust chain, health, diagnostics, rollback controls có mặt; không coi mock UI là signature pass. |
| UI-13 | Cập nhật · verified/progress | Không được cung cấp | Chưa chụp | `PENDING_NEW / BLOCKED_SOURCE` | Cần fixture manifest ký test và progress state. |
| UI-14 | Stage · idle/fallback | Không được cung cấp | Chưa chụp | `PENDING_NEW / BLOCKED_SOURCE` | Cần state không event/asset lỗi. |
| UI-15 | Stage · join/chat/demo | Không được cung cấp | [stage-demo-9x16.png](../screenshots/new/stage-demo-9x16.png) · 486×863 | `NEW_CAPTURED / BLOCKED_SOURCE` | DOM surface xác minh 486×864 giữ 9:16; screenshot crop 1 px theo capture. |
| UI-16 | Stage · gift/leaderboard | Không được cung cấp | [stage-demo-9x16.png](../screenshots/new/stage-demo-9x16.png) · 486×863 | `NEW_CAPTURED / BLOCKED_SOURCE` | Gift, leaderboard, viewer cards, dual host, LED và music đều thấy rõ. |
| UI-17 | Stage · transparent OBS | Không được cung cấp | Chưa chụp | `PENDING_NEW / BLOCKED_SOURCE` | Cần alpha channel và overlay readability. |
| UI-18 | Dialog · destructive/rollback | Không được cung cấp | Chưa chụp | `PENDING_NEW / BLOCKED_SOURCE` | Cần focus trap, wording, disabled state. |

## Review trực quan bộ mới — 2026-08-10

- Đã mở và kiểm tra đủ tám ảnh Control cùng Stage demo. Sidebar, typography Segoe UI, màu violet/cyan/lime/coral, card spacing và trạng thái toggle/button nhất quán; không thấy clipping nghiêm trọng ở viewport đã chụp.
- LIVE đã được chụp lại 1440×866 để đồng nhất với bảy màn Control còn lại; URL/port hiển thị đúng `127.0.0.1:17321` và TikFinity `21213`.
- License thể hiện free mode chính thức, module tắt, server/grace policy chỉ dùng khi bật; AI che key; Nhân vật nói rõ fallback; Update có signed feed URL/channel/auto-check nhưng không giả vờ signature/update đã pass.
- Stage demo thể hiện LED, dual host, viewer/avatar/level, gift, leaderboard và music. File 486×863 là crop ảnh; DOM layout được xác minh 486×864 đúng 9:16. File stitch 1080×1920 bị loại khỏi evidence.
- Chưa có ảnh state connected/reconnect, AI error, update progress, transparent OBS hoặc dialog; đây là khoảng trống state coverage, không làm mất bằng chứng rằng các màn cơ bản tồn tại.
- Không thể phát hiện/sửa sai khác so với UI nguồn vì không có bất kỳ ảnh nguồn nào. Không có asset nguồn được trích từ screenshot.

## Quy trình sửa sai khác quan trọng

1. Cung cấp ảnh nguồn hợp pháp, ghi version/window size/DPI/state.
2. Chụp app mới với fixture tương ứng.
3. Ghi issue theo mức `P0` (luồng không dùng được), `P1` (bố cục/interaction khác quan trọng), `P2` (visual nhỏ).
4. Sửa P0/P1, chụp lại và ghi commit/test evidence.
5. Với logo/icon/ảnh không có quyền, giữ layout và semantics nhưng dùng asset mới; ghi `INTENTIONAL_LEGAL_SUBSTITUTION` thay vì coi là lỗi.

## Điều kiện đóng ma trận

Mỗi hàng cần đủ đường dẫn hai ảnh hoặc quyết định substitution, người review, ngày review và trạng thái `PASS`. Bộ mới hiện đã có ảnh cho đủ tám màn Control và một Stage demo; ảnh stitch viewport sai đã chuyển sang [rejected/README.md](../screenshots/rejected/README.md), không dùng làm evidence dù DOM bbox đúng. Không hàng nào có ảnh nguồn, nên không được diễn giải `NEW_CAPTURED` là đã đạt tương đương nguồn.

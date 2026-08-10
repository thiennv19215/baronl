# Wireframe OrbitStage Live

Các wireframe sau là bố cục mục tiêu mới, không phải bản sao pixel của UI nguồn. Control dùng sidebar 240 px; Stage là surface 9:16 riêng.

## Shell Control

```text
+------------------------+---------------------------------------------------+
| ◇ ORBITSTAGE LIVE      | [Tên màn]                         [Health: OK]     |
| TikFinity: Connected   | Mô tả ngắn                                       |
|                        +---------------------------------------------------+
| > Điều khiển LIVE      |                 PAGE CONTENT                      |
|  LED                   |                                                   |
|  Tùy chỉnh             |                                                   |
|  Nhân vật              |                                                   |
|  AI MC/DJ              |                                                   |
|  Test LIVE             |                                                   |
|  Cập nhật              |                                                   |
|  License               |                                                   |
|                        |                                                   |
| v1.x  Local :17321     |                                                   |
+------------------------+---------------------------------------------------+
```

## License

```text
+---------------- FREE MODE ----------------+ +------ MODULE STATUS -------+
| OrbitStage đang chạy miễn phí             | | Provider: Disabled         |
| Không cần key, không gọi license server    | | Network calls: None        |
| [Tìm hiểu chính sách]                      | | Capabilities: Free         |
+-------------------------------------------+ +----------------------------+
| Nếu bản phân phối bật commercial licensing:                             |
| [ Activation key ••••••••••••••••• ] [Kích hoạt]                       |
| Policy/offline grace/privacy hiển thị trước khi gửi                     |
+-------------------------------------------------------------------------+
```

Trong build mặc định, form activation có thể ẩn hoặc disabled; free-mode card vẫn phải hiện để người dùng hiểu đây là policy chính thức.

## Điều khiển LIVE

```text
+---------------- CONNECTION ----------------+ +------- QUICK ACTIONS ------+
| TikTok account [ display name           ]  | | [Mở Stage]                |
| TikFinity WS   [ ws://127.0.0.1:21213/  ]  | | [Sao chép URL OBS]        |
| Local server   http://127.0.0.1:17321       | | [Export diagnostics]      |
| [Kiểm tra]          [ CHẠY LIVE ]           | +----------------------------+
+--------------------------------------------+ | Music: track / time        |
| LIVE ACTIVITY                               | | [◀] [Play/Pause] [Skip]   |
| 12:04 join  Minh                            | | Volume [========---]       |
| 12:04 gift  An · Rose ×5                    | +----------------------------+
| 12:05 chat  ...                             |
+--------------------------------------------+
```

Khi connected, CTA đổi thành `DỪNG LIVE` màu danger. Reconnect hiển thị attempt/cooldown, không xóa activity.

## LED

```text
+---------------- LED EDITOR ----------------+ +--------- PREVIEW ----------+
| Text       [ ORBITSTAGE LIVE             ] | |  ▓ O R B I T S T A G E ▓  |
| Style      [ Neon cyan                  v ] | |                            |
| Speed      [=======-----]                   | |        9:16 crop           |
| Brightness [==========--]                   | |                            |
| [Preset] [Reset]              [Áp dụng]     | | [Safe area overlay]        |
+--------------------------------------------+ +----------------------------+
```

## Tùy chỉnh

```text
+------ CATALOG ------+ +---------------- PROPERTIES ------------------------+
| Background          | | Selected: Stage placeholder                       |
| Video               | | Fit [Cover v]  Opacity [==========]              |
| Avatar              | | Tint [#______] Blur [---]                         |
| Gift                | | [Chọn asset đã đăng ký] [Mở thư mục người dùng]   |
| Badge / Texture     | |                                                    |
| Music               | | Layout [Classic v] [Preview] [Save]              |
+---------------------+ +----------------------------------------------------+
```

Asset thiếu/sai hash hiện card placeholder có nhãn, không làm màn trắng hoặc cản build.

## Nhân vật

```text
+---------------- HOST A --------------------+ +---------- HOST B -----------+
| Asset [Placeholder host v]                 | | [Không dùng v]             |
| Type: 2D fallback                          | | Position / scale           |
| Blink [on] Lip sync [on] Motion [Idle v]   | | Mirror [ ]                 |
+--------------------------------------------+ +-----------------------------+
| Platform [DJ deck v]  Layout [Single v]  Quality [Auto v]                 |
| [Shuffle] [Test motion]                                    [Áp dụng]      |
+-------------------------------------------------------------------------+
```

Khi không có model Live2D/3D có quyền, UI dùng SVG placeholder có nhãn và disable capability không khả dụng.

## AI MC/DJ

```text
+---------------- PROVIDER ------------------+ +---------- SPEECH -----------+
| Provider [OpenAI-compatible v]             | | TTS [Edge v]               |
| Endpoint [https://...                   ]   | | Voice [vi-VN ... v]        |
| Model    [model-id                       ]  | | Volume [========--]        |
| API key  [••••••••••••••  Đã lưu]          | | Queue: idle                |
| [Test AI]                                  | | [Test voice] [Stop queue]  |
+--------------------------------------------+ +-----------------------------+
| PERSONA / SAFETY / AUTO-HYPE                                             |
| [persona editor........................................................] |
| Content filter [Strict v]  Cooldown [30s]  Auto-hype [off]               |
| Test prompt [..............................................] [Gửi]       |
+-------------------------------------------------------------------------+
```

## Test LIVE

```text
+---------------- EVENT BUILDER -------------+ +---------- HISTORY ----------+
| Type [Gift v]                              | | 12:05 accepted gift         |
| Viewer [Orbit Guest] Avatar [placeholder]  | | 12:04 accepted chat         |
| Gift [Rose] Count [5] Repeat [1]           | | 12:03 rejected: bad count  |
| [Load preset] [Preview JSON] [GỬI EVENT]   | | [Clear]                    |
+--------------------------------------------+ +-----------------------------+
| Reconnect scenario: [Disconnect] [Reconnect] [Burst ×20]                 |
+-------------------------------------------------------------------------+
```

## Cập nhật

```text
+---------------- CURRENT -------------------+ +--------- AVAILABLE ---------+
| OrbitStage 1.0.0 · stable                  | | 1.1.0                     |
| Last check: --                             | | Signature: verified/pending|
| [Kiểm tra cập nhật]                        | | Hash: verified/pending     |
+--------------------------------------------+ | [Download] [Release notes] |
| BACKUP / ROLLBACK                          | +----------------------------+
| Backup: none/current  Journal: clean       |
| [Open update log] [Rollback…]              |
+--------------------------------------------+
```

Install/rollback luôn dùng dialog có state xác minh, tiến độ, restart và kết quả startup health.

## Stage 9:16

```text
             1080 × 1920 logical canvas
+--------------------------------------+
| [LED ticker: text / latest event]    |
|                                      |
|      +------------------------+      |
|      | background / video     |      |
|      |                        |      |
|      |   HOST A      HOST B   |      |
|      |   character / fallback |      |
|      +------------------------+      |
|  [avatar] Viewer Name   Lv.12        |
|  “chat bubble / gift wish…”          |
|                                      |
|  GIFT: icon  Rose ×5   + animation   |
|                                      |
|  LEADERBOARD                          |
|  1. An      2,400                     |
|  2. Minh    1,200                     |
|  3. Lan       900                     |
|                                      |
|  ♪ Track title          [LIVE status] |
+--------------------------------------+
```

Stage route nhận query `ws`, `demo`, `transparent`, `quality`. Query phải được validate/allow-list; giá trị sai quay về default an toàn. Transparent mode dành cho OBS; demo mode không cần TikFinity và phải ghi nhãn trong Control.

## Kích thước và responsive

- Control mục tiêu: 1280×800; minimum khoảng 1024×680, content chuyển từ 2 cột sang 1 cột khi hẹp.
- Stage logical: 1080×1920, scale theo viewport giữ aspect ratio 9:16.
- Safe area stage: tối thiểu 48 logical px ở cạnh, với title-safe rộng hơn cho text.
- Windows scaling: xác minh 100%, 125%, 150% và 200%; screenshot phải ghi DPI.

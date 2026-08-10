# Kiến trúc OrbitStage LIVE

## 1. Mục tiêu và ranh giới

OrbitStage LIVE là ứng dụng Windows độc lập dùng Electron + TypeScript để nhận sự kiện TikFinity, điều khiển nội dung LIVE và xuất sân khấu dọc 9:16 cho cửa sổ Electron hoặc OBS Browser Source. Kiến trúc ưu tiên ba thuộc tính: renderer không được tin cậy, luồng LIVE vẫn dùng được khi dịch vụ ngoài lỗi, và dữ liệu bí mật không đi vào log/diagnostic/installer.

Tài liệu này mô tả kiến trúc mục tiêu và các invariant bắt buộc. Trạng thái triển khai thực tế nằm trong [scope-and-acceptance.md](scope-and-acceptance.md).

## 2. Sơ đồ hệ thống

```text
TikFinity WebSocket                AI / TTS providers
          |                                |
          v                                v
+----------------------- Electron Main Process ----------------------+
| Connection manager -> Event normalizer -> Event bus -> State store |
|                                      |             |               |
| HTTP/WS server (127.0.0.1 only) <-----+             +-> AI/TTS      |
| Window manager | audio owner | diagnostics | license | updater     |
+--------+----------------------+----------------------+--------------+
         | typed, allow-listed IPC                    |
         v                                             v
+---------------------------+             +--------------------------+
| Control renderer          |             | Stage renderer          |
| Live / LED / Customize    |             | 9:16 overlay            |
| Character / AI / Test     |             | viewer/gift/LED/media   |
| Update / License          |             | no direct Node access   |
+---------------------------+             +--------------------------+
                                                        ^
                                                        |
                                              OBS Browser Source
                                       http://127.0.0.1:17321/stage
```

## 3. Thành phần và trách nhiệm

### Electron Main

- Tạo cửa sổ Control và Stage; khôi phục bounds sau khi kiểm tra bounds vẫn nằm trên màn hình khả dụng.
- Bật `contextIsolation`, bật sandbox renderer, tắt `nodeIntegration` và chặn navigation/window-open không nằm trong allow-list.
- Quản lý lifecycle của local server, TikFinity bridge, AI/TTS, audio, diagnostics, updater và module license.
- Lưu cấu hình có version; chỉ Main được đọc/ghi secret qua `safeStorage`.
- Không gửi token/API key về renderer. Renderer chỉ nhận boolean như `configured: true` hoặc secret đã che.

### Preload

- Là biên API nhỏ, typed và có version giữa renderer với Main.
- Chỉ expose hàm nghiệp vụ rõ ràng; không expose `ipcRenderer`, `require`, filesystem, shell hay socket tùy ý.
- Validate cả request và response ở runtime. Mọi channel phải nằm trong allow-list.
- Hàm subscribe phải trả về unsubscribe để tránh rò listener khi chuyển màn.

### Control renderer

- Hiển thị trạng thái; không nắm quyền sở hữu service.
- Gửi command có schema: start/stop LIVE, cập nhật cấu hình, điều khiển nhạc, phát fake event, test AI/TTS, export diagnostics, kiểm tra update.
- Không lưu secret trong localStorage, URL, DOM attribute hoặc crash report.

### Stage renderer

- Một render surface 9:16, có thể chạy trong BrowserWindow riêng hoặc qua `/stage` trên local HTTP server.
- Nhận snapshot ban đầu rồi event delta qua WebSocket; reconnect phải lấy snapshot mới trước khi tiếp tục.
- Asset được resolve qua registry, không nhận đường dẫn filesystem tùy ý từ event.
- Âm nhạc do một audio owner duy nhất điều phối; remount/chuyển layout không tự đưa track về đầu.

### Local HTTP/WebSocket server

- Chỉ bind `127.0.0.1`; port mặc định `17321`; không bind `0.0.0.0` hay interface LAN.
- Endpoint tối thiểu: `/health`, `/stage`, asset tĩnh được allow-list và WebSocket trạng thái/sự kiện.
- Kiểm tra `Origin`/token phiên ngắn hạn đối với command channel. Stage read-only có thể dùng URL token riêng nếu cần.
- Có giới hạn payload, timeout, heartbeat và số client; không log raw request chứa secret.

### TikFinity bridge

- Endpoint WebSocket do người dùng cấu hình; mặc định chỉ cho loopback.
- Kết nối có trạng thái `idle -> connecting -> connected -> degraded -> reconnecting -> stopped`.
- Reconnect dùng exponential backoff có jitter và giới hạn; thao tác Stop phải hủy timer reconnect.
- Chuẩn hóa payload nhà cung cấp sang schema nội bộ, loại field không dùng và giới hạn độ dài chuỗi.
- Dedupe theo upstream id khi có; nếu không có thì dùng fingerprint cửa sổ thời gian ngắn.

### AI/TTS

- Adapter AI dùng contract OpenAI-compatible khi phù hợp, nhưng endpoint/model/capability là cấu hình tách biệt.
- Persona, content filter, rate limiter và timeout được áp dụng trước khi đưa text vào speech queue.
- Adapter TTS OpenAI và Edge cùng xuất `SpeechJob`; một queue dùng chung đảm bảo MC/DJ không đọc chồng.
- Có cancellation, priority, cooldown, giới hạn text và fallback không phát tiếng khi provider lỗi.

### Updater, license và diagnostics

- Updater tải manifest qua HTTPS, xác minh chữ ký/hash trước khi staging; backup và rollback là transaction riêng.
- License là module độc lập. Chế độ mặc định `disabled/free` không gọi máy chủ license. Không có cơ chế bỏ qua kiểm tra khi module đã bật.
- Diagnostic bundle dùng allow-list file/field và redaction nhiều lớp; không đóng gói secret store, token, key, dữ liệu chat thô hoặc thông tin license nhạy cảm.

## 4. Hợp đồng sự kiện LIVE

Envelope nội bộ tối thiểu:

```ts
type LiveEvent = {
  id: string;
  type: 'join' | 'chat' | 'follow' | 'like' | 'gift' | 'disconnect' | 'reconnect';
  occurredAt: string;       // ISO-8601 UTC
  receivedAt: string;       // ISO-8601 UTC
  source: 'tikfinity' | 'fake';
  viewer?: {
    id?: string;
    displayName: string;
    avatarUrl?: string;
  };
  payload: Record<string, unknown>;
  schemaVersion: 1;
};
```

Quy tắc:

- `displayName`, chat và gift name phải được cắt độ dài, normalize Unicode và render dưới dạng text, không dùng HTML.
- `avatarUrl` chỉ chấp nhận `https:` hoặc asset local hợp lệ; có timeout, giới hạn kích thước và placeholder khi lỗi.
- Gift amount/count phải là số hữu hạn, không âm, có trần hợp lý.
- Fake event đi qua cùng validator/router như event thật và luôn có `source: 'fake'`.
- Event router không được block bởi animation, AI hoặc TTS; các tác vụ chậm chạy qua queue riêng.

## 5. Luồng trạng thái

1. Main khởi tạo config đã migrate và registry asset đã validate.
2. Local server mở trên loopback; `/health` báo `starting` cho tới khi snapshot sẵn sàng.
3. Control và Stage nhận snapshot phiên hiện tại.
4. Khi Run LIVE, bridge kết nối TikFinity; event được validate, normalize, dedupe và phát vào bus.
5. Reducer cập nhật viewer/leaderboard/gift/state; Stage nhận delta có sequence tăng dần.
6. Khi Stage reconnect hoặc phát hiện thiếu sequence, client bỏ delta cũ và yêu cầu snapshot.
7. Khi Stop LIVE, bridge dừng reconnect nhưng local stage và nhạc chỉ dừng nếu người dùng yêu cầu.

## 6. Dữ liệu và cấu hình

| Loại | Nơi lưu | Quy tắc |
|---|---|---|
| Cấu hình không bí mật | JSON versioned trong userData | Ghi atomic, có schema/migration và backup gần nhất. |
| API key/token | Electron `safeStorage` | Không export; renderer chỉ thấy trạng thái đã cấu hình. |
| Window bounds | JSON không bí mật | Clamp theo work area trước khi khôi phục. |
| Asset catalog | `assets/manifest.json` + user catalog | Hash, MIME, quyền sử dụng và đường dẫn tương đối. |
| Cache TTS | Cache có TTL | Key là hash nội dung/cấu hình, không chứa API key. |
| Log | JSON Lines quay vòng | Redact trước khi serialize, retention hữu hạn. |
| Backup update/config | Thư mục versioned | Không sao chép secret ra archive chẩn đoán. |

Mọi schema persistent phải có `schemaVersion`. Migration phải idempotent và giữ bản backup trước khi ghi.

## 7. Audio ownership

Main duy trì `AudioCoordinator` với một owner logic duy nhất. Renderer gửi intent (`play`, `pause`, `skip`, `setVolume`) thay vì tự tạo nhiều player. Track hiện tại được nhận dạng bằng asset id và position; thay theme/layout chỉ cập nhật presentation. TTS dùng channel ưu tiên có ducking, không tạo player cạnh tranh với nhạc.

## 8. Khả năng chịu lỗi

- TikFinity mất kết nối: UI chuyển `reconnecting`, stage giữ snapshot cuối, không xóa leaderboard; reconnect không nhân đôi listener.
- AI/TTS lỗi: event LIVE vẫn render; job lỗi kết thúc rõ ràng và queue tiếp tục.
- Asset thiếu/sai hash: dùng placeholder hợp lệ và ghi warning đã redaction.
- Stage crash/reload: local server và audio owner vẫn sống; stage lấy lại snapshot.
- Child service lỗi: supervisor restart có budget; sau ngưỡng chuyển `degraded` thay vì loop vô hạn.
- Update lỗi trước commit: xóa staging; lỗi sau commit/khởi động: rollback bản backup và ghi mã sự cố.

## 9. Invariant bảo mật bắt buộc

1. Renderer không có Node capability trực tiếp.
2. Local server chỉ nghe loopback.
3. IPC và HTTP command đều validate runtime và giới hạn kích thước.
4. Không secret nào xuất hiện trong log, diagnostic, export cấu hình hoặc URL.
5. Không load remote code trong renderer; CSP mặc định chặn inline/eval.
6. Chỉ asset có trong registry và quyền hợp lệ mới đi vào installer.
7. Gói update phải qua xác minh chữ ký/hash trước khi thay file.
8. License `disabled/free` là cấu hình sản phẩm chính thức, không phải bypass.

## 10. Quyết định kiến trúc

| ID | Quyết định | Lý do |
|---|---|---|
| ADR-001 | Local server bind loopback | OBS trên cùng máy vẫn truy cập được, giảm bề mặt tấn công LAN. |
| ADR-002 | Event schema nội bộ versioned | Cách ly thay đổi payload TikFinity khỏi UI và test. |
| ADR-003 | Main sở hữu service/audio/secret | Renderer có thể reload mà không phá phiên LIVE, giảm quyền. |
| ADR-004 | Asset registry có hash và quyền | Ngăn asset thiếu/sai và tạo bằng chứng release. |
| ADR-005 | License tắt mặc định | Bản miễn phí chạy hợp lệ; module thương mại có thể bật sau bằng policy riêng. |
| ADR-006 | Update là transaction staging/commit/rollback | Không để app ở trạng thái cài nửa chừng. |

## 11. Những điều chưa thể suy ra từ nguồn

Không có source project, executable, screenshot, logo, font, icon, media hoặc model Live2D đi kèm `electron-rebuild-plan.md`. Vì vậy tài liệu này không khẳng định tương đương pixel hoặc tương đương hành vi với ứng dụng cũ. Các phần đó chỉ được nghiệm thu khi có đầu vào hợp pháp và bằng chứng trong ma trận UI/asset.

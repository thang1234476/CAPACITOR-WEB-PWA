# LAB 05 — MODIFY & EXTEND CAPACITOR FIELD SURVEY
## Chỉnh sửa và mở rộng Field Survey chạy trong Android Native Shell

> **Môn:** Phát triển ứng dụng di động đa nền tảng  
> **Tuần:** 5  
> **Thời lượng dự kiến:** 2 tiết  
> **Sản phẩm:** Bản mở rộng từ project Demo Complete Week 5

---

# 1. Mục tiêu

Lab này **không yêu cầu tạo lại project Capacitor từ đầu**.

Sinh viên sử dụng project demo Week 5 đã chạy hoàn chỉnh, sau đó:

1. đọc lại cấu trúc Web + Android của project;
2. chỉnh sửa phần Native Evidence trong giao diện;
3. kết hợp state của form với dữ liệu Camera/GPS;
4. mở rộng phần hiển thị Local Submissions;
5. thêm một extension nhỏ liên quan đến native data;
6. kiểm tra lại toàn bộ workflow Android → Offline → Pending → Synced.

Mục tiêu chính:

> Hiểu cách một Web/PWA hiện có được mở rộng bằng native capability mà **không phá vỡ kiến trúc offline-first** đã xây dựng ở Week 4.

---

# 2. Project bắt đầu

Sử dụng **project sau khi hoàn thành Demo Week 5**.

Trong Demo, sinh viên đã lấy project Week 4 làm nền, gắn Capacitor, chạy app trên Android và tích hợp Camera + Geolocation.

Project nền của Lab đã có:

```text
Dynamic Form
Skip Logic
Validation
IndexedDB
UUID
Local-first submission
Pending queue
Sync engine
Mock API
Capacitor
Camera Plugin
Geolocation Plugin
photo + location trong submission
```

> Nếu giảng viên phát bản source không kèm thư mục `android/`, chỉ cần chạy `npx cap add android` một lần sau `npm install` và `npm run build`, rồi tiếp tục `npx cap sync android`.

Luồng chính:

```text
Web Form
+ Camera
+ Geolocation
      ↓
Submission
      ↓
IndexedDB
      ↓
pending
      ↓
API available
      ↓
POST /api/submissions
      ↓
synced
```

Không viết lại các phần này từ đầu.

---

# 3. Chạy project trước khi sửa

Cài package:

```bash
npm install
```

Terminal 1 — chạy Mock API:

```bash
npm run api
```

Build Web App:

```bash
npm run build
```

Sync với Android project:

```bash
npx cap sync android
```

Mở Android Studio:

```bash
npx cap open android
```

Trong Android Studio:

```text
Chọn Emulator / Device
→ Run
```

Trước khi sửa code, cần kiểm tra demo gốc chạy đúng:

```text
Field Survey render được
Camera hoạt động
Geolocation hoạt động
IndexedDB lưu được
API down → pending
API hoạt động → synced
```

> Nếu vừa sửa Web code, luôn nhớ lại workflow:
>
> ```text
> npm run build
> → npx cap sync android
> → Run lại Android App
> ```

---

# 4. Yêu cầu 1 — Mở rộng khu vực Native Evidence

Project demo đã có Camera và Geolocation, nhưng khu vực Native Evidence mới ở mức cơ bản: ảnh preview và tọa độ hiện tại.

Hãy mở rộng giao diện để người dùng nhìn thấy rõ trạng thái native data **trước khi Submit**.

Khu vực Native Evidence phải hiển thị tối thiểu:

```text
Ảnh hiện trường:
- Chưa có ảnh
hoặc
- Đã có ảnh

Vị trí:
- Chưa có vị trí
hoặc
- latitude / longitude
- accuracy
```

Ví dụ:

```text
NATIVE EVIDENCE

Ảnh hiện trường: Đã có ảnh
[ Preview ảnh ]

Vị trí:
16.0745, 108.1502
Accuracy: 12 m
```

Có thể thiết kế lại UI theo cách khác nếu vẫn thể hiện đủ thông tin.

### PASS khi

- trạng thái ảnh cập nhật sau khi chụp;
- latitude / longitude cập nhật sau khi lấy vị trí;
- `accuracy` được hiển thị từ `currentLocation.accuracy`;
- thông tin lấy từ state thật `currentPhoto` và `currentLocation`, không hardcode.

---

# 5. Yêu cầu 2 — Kết hợp Form State với Native Data

Thêm business rule sau:

```text
condition = damaged
→ bắt buộc phải có ảnh hiện trường
```

Và:

```text
mọi submission
→ phải có location trước khi lưu
```

Nói cách khác:

```text
Good
→ Location bắt buộc
→ Photo không bắt buộc

Damaged
→ Location bắt buộc
→ Photo bắt buộc
```

Nếu thiếu dữ liệu, không tạo submission mới.

Ví dụ thông báo:

```text
Vui lòng lấy vị trí trước khi lưu khảo sát.
```

hoặc:

```text
Khảo sát hư hỏng phải có ảnh hiện trường.
```

## Gợi ý

Có thể mở rộng hàm validation hiện có:

```javascript
function validateNativeEvidence() {
  const errors = [];

  if (!currentLocation) {
    errors.push(
      "Vui lòng lấy vị trí trước khi lưu khảo sát."
    );
  }

  if (
    answers.condition === "damaged"
    && !currentPhoto
  ) {
    errors.push(
      "Khảo sát hư hỏng phải có ảnh hiện trường."
    );
  }

  return errors;
}
```

Không bắt buộc dùng đúng tên hàm trên.

### PASS khi

Test đủ ba trường hợp:

```text
Case 1
Good + không có location
→ không submit
```

```text
Case 2
Damaged + có location + không có photo
→ không submit
```

```text
Case 3
Damaged + có location + có photo
→ lưu IndexedDB thành công
```

---

# 6. Yêu cầu 3 — Mở rộng Local Submissions

Project demo đã hiển thị local submissions.

Hãy mở rộng mỗi submission card để hiển thị thêm native data.

Bắt buộc có tối thiểu:

```text
Tên khu vực / phòng
Tình trạng
Thời gian tạo
Photo: Có / Không
Latitude
Longitude
Accuracy
Sync Status
```

Nếu record có ảnh, hiển thị thêm **thumbnail nhỏ**.

Ví dụ:

```text
Phòng A201
Tình trạng: Hư hỏng
Created: 20/09/2026 14:20

Photo: Có
[thumbnail]

Location:
16.0745, 108.1502
Accuracy: 12 m

Status: pending
```

### PASS khi

- thông tin được đọc từ record trong IndexedDB;
- record không có ảnh phải hiển thị trạng thái phù hợp;
- location đọc từ `submission.location`;
- thumbnail lấy từ `submission.photo.previewDataUrl`, không dùng ảnh hardcode.

---

# 7. Yêu cầu 4 — Reset Native State sau khi lưu

Sau khi submission được lưu local thành công, Native Evidence của lần khảo sát cũ không được tự động đi sang lần khảo sát tiếp theo.

Cần reset tối thiểu:

```text
currentPhoto
currentLocation
photo preview
location text/status
```

Luồng đúng:

```text
Survey A
→ chụp ảnh A
→ lấy location A
→ Submit

Survey B mới
→ chưa có ảnh
→ chưa có location
```

### PASS khi

Sau khi lưu Survey A, UI trở về:

```text
Ảnh hiện trường: Chưa có ảnh
Vị trí: Chưa có vị trí
```

và Survey B không vô tình chứa native data của Survey A.

---

# 8. Yêu cầu 5 — Thêm một Extension

Chọn **một** trong các extension dưới đây.

## Extension A — Xóa ảnh / Chụp lại

Thêm nút:

```text
Xóa ảnh
```

hoặc:

```text
Chụp lại
```

Khi xóa:

```text
currentPhoto = null
preview ẩn
UI chuyển về “Chưa có ảnh”
```

---

## Extension B — Location Accuracy Indicator

Dựa vào:

```javascript
currentLocation.accuracy
```

hiển thị đánh giá đơn giản:

```text
≤ 20 m
→ Tốt

21–50 m
→ Trung bình

> 50 m
→ Thấp
```

Không cần coi các ngưỡng trên là chuẩn ngành; đây chỉ là rule cho bài lab.

---

## Extension C — Cập nhật vị trí + thời gian lấy GPS

Mở rộng nút lấy vị trí hiện có để mỗi lần bấm lại:

```text
Geolocation gọi lại
→ currentLocation cập nhật
→ UI cập nhật
→ hiển thị capturedAt / thời gian lấy vị trí mới nhất
```

---

## Extension D — Native Evidence Counter

Hiển thị trạng thái:

```text
Native Evidence: 2/2
```

Trong đó:

```text
Photo có dữ liệu     → +1
Location có dữ liệu  → +1
```

Counter phải cập nhật sau khi:

```text
Take Photo
Get Location
Clear Photo
Submit / Reset
```

---

## Extension E — Tự đề xuất

Có thể làm extension khác nếu:

- liên quan trực tiếp Camera / Geolocation / native data;
- không phá kiến trúc hiện tại;
- có thể demo rõ ràng trong vài phút;
- được giảng viên chấp nhận.

### PASS khi

Extension hoạt động ổn định trên Android Emulator/device và không làm hỏng workflow chính.

---

# 9. Checkpoint bắt buộc — Android + Offline-first vẫn hoạt động

Sau khi hoàn thành các thay đổi, phải kiểm tra lại toàn bộ luồng chính.

---

## Bước 1 — Build và Sync code mới

Sau khi sửa Web code:

```bash
npm run build
npx cap sync android
```

Sau đó Run lại app trong Android Studio.

### PASS khi

```text
UI mới xuất hiện
Camera vẫn hoạt động
Geolocation vẫn hoạt động
```

---

## Bước 2 — Tạo một submission hoàn chỉnh

Ví dụ:

```text
condition = damaged
→ điền form
→ chụp ảnh
→ lấy location
```

Kiểm tra Native Evidence trước khi submit.

### PASS khi

```text
Photo = Có
Location có latitude/longitude
Accuracy có dữ liệu
```

---

## Bước 3 — API không khả dụng

Giữ Android App hoạt động nhưng dừng Mock API.

Ví dụ dừng terminal đang chạy:

```bash
npm run api
```

Sau đó Submit survey.

### Kết quả đúng

```text
Local save vẫn thành công
syncStatus = pending
photo/location vẫn có trong IndexedDB
```

Ghi nhớ:

```text
Camera/GPS hoạt động
≠
API server đang hoạt động
```

---

## Bước 4 — Đóng và mở lại Android App

Đóng app rồi mở lại.

### PASS khi

```text
Local submission vẫn còn
Photo metadata vẫn còn
Location vẫn còn
Status vẫn pending
```

---

## Bước 5 — API hoạt động trở lại

Chạy lại:

```bash
npm run api
```

Nếu project có nút:

```text
Sync pending
```

thì bấm sync.

Hoặc dùng auto-sync hiện có của demo.

### PASS khi

```text
POST /api/submissions
→ thành công
```

và local record:

```text
pending
→ synced
```

---

# 10. Kiểm tra IndexedDB

Inspect WebView bằng Chrome DevTools khi môi trường cho phép.

Mở:

```text
Application
→ IndexedDB
→ vku-field-survey-db
→ submissions
```

Chọn Object Store:

```text
submissions
```

Mỗi record cần giữ được tối thiểu:

```text
id
formId
answers
photo
location
createdAt
syncStatus
syncAttempts
lastError
syncedAt
```

Trong `photo` cần quan sát được:

```text
previewDataUrl
format
capturedAt
```

Trong `location` cần quan sát được:

```text
latitude
longitude
accuracy
capturedAt
```

---

# 11. Kiểm tra Validation Native Evidence

Phải test riêng các tình huống sau.

## Test A — Good nhưng chưa có GPS

```text
condition = good
location = null
```

### PASS khi

```text
không tạo submission
```

---

## Test B — Damaged nhưng chưa có ảnh

```text
condition = damaged
location = có
photo = null
```

### PASS khi

```text
không tạo submission
```

---

## Test C — Damaged đủ dữ liệu

```text
condition = damaged
location = có
photo = có
```

### PASS khi

```text
submission được lưu
```

---

# 12. Lưu ý khi API không gọi được từ Android

Nếu Browser Week 4 gọi được API nhưng Android App không gọi được, kiểm tra theo thứ tự:

```text
1. Mock API có đang chạy?
2. Android đang dùng đúng API host?
3. Emulator có dùng 10.0.2.2 thay localhost chưa?
4. CORS có chặn không?
5. HTTP cleartext có bị Android chặn không?
```

Với Android Emulator, host machine thường được truy cập bằng:

```text
10.0.2.2
```

Ví dụ:

```text
http://10.0.2.2:3001/api/submissions
```

Nếu chạy trên điện thoại thật, cần dùng IP LAN phù hợp của máy chạy Mock API.

---

# 13. Yêu cầu nộp bài

Nộp:

1. Source code project đã chỉnh sửa.
2. `README.md` ngắn mô tả các thay đổi.
3. Các ảnh minh chứng theo yêu cầu bên dưới.

Không cần nộp:

```text
node_modules/
.gradle/
Android build cache
```

Nếu thư mục project quá lớn, có thể loại các thư mục build/cache trước khi nén.

---

# 14. Nội dung README.md

README chỉ cần ngắn gọn, trả lời:

```text
1. Native Evidence đã được chỉnh sửa như thế nào?
2. Rule validation giữa condition và Camera/GPS là gì?
3. Extension đã chọn là gì?
4. Khi API down, dữ liệu được giữ ở đâu và trạng thái gì?
5. Sau khi API hoạt động lại, submission thay đổi như thế nào?
```

---

# 15. Ảnh minh chứng

## Ảnh 1 — Android App

Cho thấy:

```text
Field Survey chạy trong Android Emulator/device
```

---

## Ảnh 2 — Native Evidence

Cho thấy:

```text
Photo preview
Latitude / Longitude
Accuracy
```

---

## Ảnh 3 — Validation

Cho thấy ít nhất một trường hợp bị chặn đúng, ví dụ:

```text
condition = damaged
nhưng chưa có ảnh
→ không submit
```

---

## Ảnh 4 — IndexedDB Pending

Cho thấy record có:

```text
syncStatus = pending
photo
location
```

---

## Ảnh 5 — Local Submission Card

Cho thấy card đã hiển thị:

```text
Photo status / thumbnail
Location
Accuracy
Sync status
```

---

## Ảnh 6 — Synced

Cho thấy:

```text
pending
→ synced
```

và nếu có thể:

```text
POST /api/submissions
→ success
```

---

## Ảnh 7 — Extension

Cho thấy extension đã chọn hoạt động.

---

# 16. Checklist trước khi nộp

- [ ] Project chạy trên Android Emulator/device
- [ ] Native Evidence UI đã được mở rộng
- [ ] Có hiển thị photo status
- [ ] Có hiển thị latitude / longitude
- [ ] Có hiển thị accuracy
- [ ] Good nhưng chưa có location → không submit
- [ ] Damaged nhưng chưa có photo → không submit
- [ ] Damaged + photo + location → submit được
- [ ] Native state reset sau khi lưu
- [ ] Local Submission card hiển thị native data
- [ ] Có một extension hoàn chỉnh
- [ ] API down → local save vẫn thành công
- [ ] `syncStatus = pending`
- [ ] Đóng/mở app → local data vẫn còn
- [ ] API hoạt động lại → sync thành công
- [ ] `pending → synced`
- [ ] README hoàn chỉnh
- [ ] Có đủ ảnh minh chứng

---

# 17. Phần không cần làm lại

Không cần viết lại từ đầu:

```text
Capacitor setup
Android native project
Dynamic Form engine
Skip Logic engine
IndexedDB helper
UUID mechanism
Sync Queue
Retry architecture
Mock API architecture
Camera Plugin integration cơ bản
Geolocation Plugin integration cơ bản
```

Các phần này đã có trong Demo Complete Week 5.

Chỉ chỉnh sửa khi cần để yêu cầu Lab hoạt động.

---

# 18. Kết quả mong đợi

Sau Lab 05, sinh viên phải giải thích được:

```text
Web Form State
+
Native Data State
        ↓
Validation
        ↓
Submission
        ↓
IndexedDB
        ↓
pending
        ↓
API available
        ↓
synced
```

Và phân biệt được:

```text
Capacitor
→ native shell + bridge

Camera / Geolocation
→ native capability

IndexedDB
→ local application data

Sync Engine
→ đưa local pending data lên server
```

Điểm quan trọng nhất:

> **Native capability là phần mở rộng của ứng dụng; nó không thay thế kiến trúc offline-first.**

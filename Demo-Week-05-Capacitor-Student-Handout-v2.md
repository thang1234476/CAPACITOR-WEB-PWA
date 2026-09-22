# DEMO TUẦN 5 — CAPACITOR: WEB/PWA TRONG NATIVE SHELL
## Tài liệu thực hành dành cho sinh viên

> Tuần 4 trả lời: **“Làm sao để Field Survey vẫn lưu được dữ liệu khi mất mạng và tự đồng bộ khi có mạng trở lại?”**
>
> Tuần 5 trả lời tiếp: **“Làm sao đưa chính Web/PWA đó vào một app Android và truy cập Camera/GPS qua native plugin?”**

> **Cách sử dụng tài liệu:** thực hiện lần lượt từng phần. Không viết lại Field Survey từ đầu. Week 5 tái sử dụng project Week 4, đóng gói bằng Capacitor, sau đó bổ sung Camera và Geolocation nhưng vẫn giữ workflow offline-first.

---

# 1. Mục tiêu demo

Sau khi hoàn thành demo, cần hiểu và kiểm tra được luồng:

```text
Field Survey PWA Week 4
        ↓
Capacitor Native Shell
        ↓
Android App / WebView
        ↓
Camera + Geolocation Plugins
        ↓
Submission có photo + location
        ↓
IndexedDB
        ↓
syncStatus = pending
        ↓
API hoạt động
        ↓
POST /api/submissions
        ↓
syncStatus = synced
```

Các ý chính:

1. Capacitor **không thay thế Web App/PWA**.
2. HTML/CSS/JavaScript vẫn là phần giao diện chính và chạy trong **WebView**.
3. Capacitor Plugin giúp JavaScript gọi native capability.
4. Dynamic Form, IndexedDB và Sync Engine của Week 4 vẫn được tái sử dụng.
5. Camera và Geolocation chỉ bổ sung native data cho submission.
6. `npm run build` tạo web assets; `npx cap sync android` cập nhật web assets và plugin vào Android project.
7. Android Emulator/device là runtime khác Browser.
8. Camera/GPS hoạt động không có nghĩa API chắc chắn đang hoạt động.

---

# 2. Nối kiến thức từ Week 4

Week 4:

```text
Schema
  ↓
Dynamic Form
  ↓
Skip Logic
  ↓
IndexedDB
  ↓
pending
  ↓
Sync Engine
  ↓
Server
```

Week 5 bổ sung:

```text
Web/PWA
  ↓
Capacitor Native Shell
  ↓
WebView
  ↓
Capacitor Plugins
  ├─ Camera
  └─ Geolocation
```

Ghi nhớ:

> **Capacitor không yêu cầu viết lại Dynamic Form, IndexedDB hay Sync Queue.**

---

# 3. Kiến trúc Week 5

```text
┌──────────────────────────────────┐
│ Android App                      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ WebView                    │  │
│  │                            │  │
│  │ Dynamic Form               │  │
│  │ IndexedDB                  │  │
│  │ Sync Engine                │  │
│  └─────────────┬──────────────┘  │
│                │                 │
│        Capacitor Bridge          │
│         ┌──────┴──────┐          │
│         ▼             ▼          │
│      Camera       Geolocation    │
└──────────────────────────────────┘
                 │
                 │ POST API
                 ▼
           Mock API Server
```

Phần web vẫn là phần chính của ứng dụng.

Capacitor bổ sung:

```text
Native Shell
+ Android Project
+ Bridge
+ Plugins
```

---

# 4. Project bắt đầu

Sử dụng **project demo hoàn chỉnh Week 4**.

Project Week 4 đã có:

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
Service Worker
Cache API
```

Không tạo một Field Survey mới.

---

# 5. Kiểm tra project Week 4 trước khi migration

Trong project:

```bash
npm install
```

Terminal 1:

```bash
npm run api
```

Terminal 2:

```bash
npm run dev
```

PASS khi:

```text
Form render được
Offline/API down → submission vẫn lưu local
IndexedDB có record
Online/API hoạt động → pending chuyển synced
```

Chỉ khi project Week 4 đang chạy đúng mới chuyển sang Capacitor.

---

# 6. Cài và khởi tạo Capacitor

Cài Capacitor:

```bash
npm install @capacitor/core @capacitor/cli
```

Khởi tạo:

```bash
npx cap init
```

Thông tin dùng trong demo:

```text
App name:
VKU Field Survey

App ID:
vn.vku.fieldsurvey
```

Capacitor tạo file cấu hình:

```text
capacitor.config.*
```

Vì project dùng Vite, cần kiểm tra:

```text
webDir = dist
```

Ví dụ:

```javascript
const config = {
  appId: "vn.vku.fieldsurvey",
  appName: "VKU Field Survey",
  webDir: "dist"
};
```

---

# 7. Thêm Android Platform

Cài platform Android:

```bash
npm install @capacitor/android
```

Tạo Android native project:

```bash
npx cap add android
```

Sau lệnh này project có thêm:

```text
android/
```

Ví dụ:

```text
week5-field-survey/
├── src/
├── public/
├── package.json
├── capacitor.config.js
└── android/
```

Ghi nhớ:

> `android/` là **native Android project** được kết nối với Web App hiện có.

Không cần viết lại giao diện Field Survey trong Android Studio.

---

# 8. Build → Sync → Open

## 8.1. Build Web App

```bash
npm run build
```

Vite tạo:

```text
dist/
```

## 8.2. Sync với Android

```bash
npx cap sync android
```

`sync` cập nhật:

```text
Web assets trong dist/
+
Capacitor plugins/dependencies
        ↓
Android project
```

## 8.3. Mở Android Studio

```bash
npx cap open android
```

Android Studio mở project:

```text
android/
```

Chờ **Gradle Sync** hoàn tất, chọn Emulator/device rồi bấm **Run**.

---

# 9. Checkpoint — Field Survey chạy trong Android

PASS khi:

```text
App cài được lên Android Emulator/device
Field Survey UI xuất hiện
Dynamic Form render được
Có thể nhập dữ liệu
```

Quan sát phần trạng thái của demo:

```text
Platform: ANDROID / Capacitor
```

Khác với bản Web:

```text
Platform: WEB / PWA
```

Ý chính:

```text
Web code gần như giữ nguyên
        ↓
runtime thay đổi
        ↓
Browser → Android WebView
```

---

# 10. Workflow khi sửa Web code

Sau khi sửa HTML/CSS/JavaScript:

```text
Sửa Web Code
     ↓
npm run build
     ↓
npx cap sync android
     ↓
Run lại Android App
```

Nếu sửa source nhưng Android App không thay đổi, hãy kiểm tra:

```text
đã build chưa?
đã sync chưa?
```

Không chạy lại:

```bash
npx cap add android
```

nếu thư mục `android/` đã tồn tại.

---

# 11. Cài Camera và Geolocation Plugins

```bash
npm install @capacitor/camera @capacitor/geolocation
```

Sau đó:

```bash
npx cap sync android
```

Trong JavaScript:

```javascript
import { Camera } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
```

---

# 12. Permission Geolocation trên Android

Mở:

```text
android/app/src/main/AndroidManifest.xml
```

Thêm bên trong `<manifest ...>` và trước `<application ...>`:

```xml
<!-- Geolocation Plugin -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" />
```

Sau khi chỉnh native project:

```bash
npx cap sync android
```

rồi Run lại app.

Trong project demo này Camera được dùng với:

```text
saveToGallery: false
```

nên phần demo không thêm quyền lưu ảnh vào Gallery.

---

# 13. Native Evidence UI

`index.html` có khu vực:

```html
<section class="panel">
  <h2>Native Evidence</h2>

  <button id="camera-button" type="button">
    Chụp ảnh hiện trường
  </button>

  <button id="location-button" type="button">
    Lấy vị trí hiện tại
  </button>

  <p id="photo-status">Chưa có ảnh.</p>

  <img
    id="photo-preview"
    alt="Ảnh hiện trường"
    hidden
  />

  <p id="location-status">
    Chưa có vị trí.
  </p>

  <p
    id="location-coordinates"
    hidden
  ></p>
</section>
```

Hai state mới của Week 5:

```javascript
let currentPhoto = null;
let currentLocation = null;
```

Đây là native data của **survey đang nhập**.

---

# 14. Camera Plugin

Hàm demo:

```javascript
async function takeEvidencePhoto() {
  try {
    const result = await Camera.takePhoto({
      quality: 70,
      targetWidth: 1280,
      targetHeight: 960,
      includeMetadata: true,
      saveToGallery: false
    });

    const format =
      result.metadata?.format ?? "jpeg";

    const previewDataUrl =
      result.thumbnail
        ? `data:image/${format};base64,${result.thumbnail}`
        : result.webPath;

    currentPhoto = {
      previewDataUrl,
      format,
      capturedAt:
        new Date().toISOString()
    };

    renderNativeEvidence();
  } catch (error) {
    console.error(
      "Camera failed:",
      error
    );
  }
}
```

Trong demo, `currentPhoto` có dạng:

```javascript
{
  previewDataUrl,
  format,
  capturedAt
}
```

Ý chính:

```text
Camera Plugin
→ trả kết quả
→ chuyển thành native state
→ preview trên UI
→ sau đó mới đưa vào submission
```

---

# 15. Checkpoint — Camera

Bấm:

```text
Chụp ảnh hiện trường
```

PASS khi:

```text
Camera mở
→ chụp/xác nhận ảnh
→ preview xuất hiện
→ trạng thái đổi thành "Đã có ảnh hiện trường."
```

Nếu người dùng hủy Camera hoặc plugin lỗi, app phải xử lý lỗi thay vì crash.

---

# 16. Geolocation Plugin

Trước khi lấy GPS, demo kiểm tra permission:

```javascript
async function ensureNativeLocationPermission() {
  const permission =
    await Geolocation.checkPermissions();

  if (permission.location === "granted") {
    return;
  }

  const requested =
    await Geolocation.requestPermissions({
      permissions: ["location"]
    });

  if (requested.location !== "granted") {
    throw new Error(
      "Location permission was not granted"
    );
  }
}
```

Sau đó lấy vị trí:

```javascript
async function captureCurrentLocation() {
  try {
    await ensureNativeLocationPermission();

    const position =
      await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });

    currentLocation = {
      latitude:
        position.coords.latitude,

      longitude:
        position.coords.longitude,

      accuracy:
        position.coords.accuracy,

      capturedAt:
        new Date().toISOString()
    };

    renderNativeEvidence();
  } catch (error) {
    console.error(
      "Geolocation failed:",
      error
    );
  }
}
```

---

# 17. Checkpoint — Geolocation

Bấm:

```text
Lấy vị trí hiện tại
```

Lần đầu Android có thể hỏi permission.

PASS khi:

```text
Allow permission
→ GPS trả kết quả
→ latitude / longitude xuất hiện
```

`currentLocation` có dạng:

```javascript
{
  latitude,
  longitude,
  accuracy,
  capturedAt
}
```

---

# 18. Render Native Evidence

Một hàm chung cập nhật UI từ native state:

```javascript
function renderNativeEvidence() {
  if (currentPhoto) {
    photoStatusEl.textContent =
      "Đã có ảnh hiện trường.";

    photoPreviewEl.src =
      currentPhoto.previewDataUrl;

    photoPreviewEl.hidden = false;
  } else {
    photoStatusEl.textContent =
      "Chưa có ảnh.";

    photoPreviewEl.hidden = true;
  }

  if (currentLocation) {
    locationStatusEl.textContent =
      "Đã lấy vị trí hiện tại.";

    locationCoordinatesEl.textContent =
      `${currentLocation.latitude.toFixed(6)}, `
      + `${currentLocation.longitude.toFixed(6)}`;

    locationCoordinatesEl.hidden = false;
  } else {
    locationStatusEl.textContent =
      "Chưa có vị trí.";

    locationCoordinatesEl.hidden = true;
  }
}
```

Pattern cần nhớ:

```text
Native Plugin
→ Native State
→ renderNativeEvidence()
→ UI
```

---

# 19. Mở rộng Submission Model

Week 4:

```javascript
{
  id,
  formId,
  answers,
  createdAt,
  syncStatus,
  syncAttempts,
  lastError,
  syncedAt
}
```

Week 5:

```javascript
{
  id,
  formId,
  answers,

  photo: {
    previewDataUrl,
    format,
    capturedAt
  },

  location: {
    latitude,
    longitude,
    accuracy,
    capturedAt
  },

  createdAt,
  syncStatus,
  syncAttempts,
  lastError,
  syncedAt
}
```

Khi chưa chụp ảnh/lấy vị trí:

```javascript
photo: null
location: null
```

Ghi nhớ:

> Camera/GPS làm payload giàu hơn; UUID, IndexedDB và sync lifecycle vẫn giữ nguyên.

---

# 20. Gắn native data vào submission

Trong submit handler:

```javascript
const submission = {
  id: crypto.randomUUID(),

  formId:
    facilitySurveySchema.id,

  answers: {
    ...answers
  },

  photo:
    currentPhoto
      ? { ...currentPhoto }
      : null,

  location:
    currentLocation
      ? { ...currentLocation }
      : null,

  createdAt:
    new Date().toISOString(),

  syncStatus: "pending",
  syncAttempts: 0,
  lastError: null,
  syncedAt: null
};
```

Sau đó vẫn dùng helper Week 4:

```javascript
await saveSubmission(submission);
```

---

# 21. IndexedDB vẫn là nguồn dữ liệu local

Luồng mới:

```text
Dynamic Form
+ Camera
+ Geolocation
        ↓
Submission
        ↓
IndexedDB
        ↓
pending
```

Trong WebView DevTools, kiểm tra:

```text
Application
→ IndexedDB
→ vku-field-survey-db
→ submissions
```

Record cần có thêm:

```text
photo.previewDataUrl
photo.format
location.latitude
location.longitude
location.accuracy
```

---

# 22. API khác nhau giữa Browser và Android Emulator

Bản Web vẫn dùng Vite proxy:

```text
Browser
→ /api/submissions
→ Vite Proxy
→ localhost:3001
```

Android Emulator gọi máy host qua:

```text
10.0.2.2
```

Demo dùng:

```javascript
const API_BASE_URL =
  Capacitor.isNativePlatform()
    ? "http://10.0.2.2:3001"
    : "";

const API_SUBMISSIONS_URL =
  `${API_BASE_URL}/api/submissions`;
```

Do đó:

```text
Browser
→ /api/submissions

Android Emulator
→ http://10.0.2.2:3001/api/submissions
```

Ghi nhớ:

> `localhost` bên trong Android Emulator là chính Emulator, không phải máy tính đang chạy `server.js`.

Nếu chạy điện thoại thật, cần thay `10.0.2.2` bằng IP LAN của máy chạy Mock API.

---

# 23. Mock API và HTTP local trong project demo

`server.js` của demo đã cho phép request từ Capacitor WebView bằng CORS header.

`capacitor.config.js` của demo cũng đã bật cấu hình development để gọi Mock API HTTP local:

```javascript
android: {
  allowMixedContent: true
},

server: {
  cleartext: true
}
```

Đây là cấu hình phục vụ bài thực hành local.

Workflow cần nhớ:

```text
Android App
→ http://10.0.2.2:3001
→ Mock API trên máy phát triển
```

---

# 24. Sync payload

Sync Engine gửi business data:

```javascript
{
  id,
  formId,
  answers,
  photo,
  location,
  createdAt
}
```

Các field:

```text
syncStatus
syncAttempts
lastError
syncedAt
```

vẫn là local sync metadata.

Luồng không đổi:

```text
IndexedDB pending
      ↓
POST API
      ↓
server trả 2xx
      ↓
local record → synced
```

---

# 25. Checkpoint chính — Android → Native Data → Pending → Synced

## Bước A — chạy Mock API

```bash
npm run api
```

## Bước B — build và sync

```bash
npm run build
npx cap sync android
npx cap open android
```

## Bước C — Run app

Trong Android Studio:

```text
Chọn Emulator/device
→ Run
```

## Bước D — lấy native data

```text
Chụp ảnh
→ preview xuất hiện

Lấy vị trí
→ latitude / longitude xuất hiện
```

## Bước E — test local-first

Dừng Mock API.

Điền form và lưu khảo sát.

PASS khi:

```text
submission vẫn lưu vào IndexedDB
syncStatus = pending
photo vẫn còn trong record
location vẫn còn trong record
```

## Bước F — đóng/mở app

PASS khi:

```text
submission local vẫn còn
IndexedDB vẫn có record
photo/location vẫn còn
status vẫn pending
```

## Bước G — API hoạt động trở lại

Chạy:

```bash
npm run api
```

Bấm:

```text
Sync pending
```

PASS khi:

```text
POST thành công
pending → synced
```

Đây là checkpoint trung tâm của Week 5.

---

# 26. Debug

## Web layer

Dùng DevTools của WebView khi môi trường cho phép để xem:

```text
Console
Network
IndexedDB
JavaScript errors
```

Các log cần quan sát:

```text
Saved locally
Camera failed
Geolocation failed
Sync failed
Synced
```

## Native layer

Trong Android Studio:

```text
Logcat
```

Dùng khi:

```text
App crash
Plugin lỗi
Permission lỗi
Native configuration lỗi
```

Tư duy debug:

```text
Web UI / IndexedDB?
→ WebView DevTools

Native plugin / permission?
→ Android Studio / Logcat

API?
→ Network + terminal chạy server.js
```

---

# 27. Lỗi thường gặp

## Android App không cập nhật code mới

Chạy lại:

```bash
npm run build
npx cap sync android
```

## Chưa có thư mục `android/`

Chạy một lần:

```bash
npx cap add android
```

## Cài plugin nhưng Android chưa nhận

```bash
npx cap sync android
```

## Geolocation không hoạt động

Kiểm tra:

```text
AndroidManifest.xml đã có location permissions?
User đã Allow?
GPS/emulator location có hoạt động?
```

## Sync không được trên Emulator

Kiểm tra:

```text
npm run api có đang chạy?
API URL có dùng 10.0.2.2?
Network request có lỗi?
```

## Camera/GPS chạy nhưng submission mất sau restart

Kiểm tra:

```text
saveSubmission()
IndexedDB
submission.photo
submission.location
```

Camera/GPS không thay thế local storage.

---

# 28. Những phần Week 4 không viết lại

Không viết lại:

```text
Dynamic Form engine
Skip Logic
Validation form
UUID mechanism
IndexedDB helper
Sync Queue
Retry architecture
Append-only model
```

Week 5 tập trung vào:

```text
Capacitor Shell
Android Workflow
Camera
Geolocation
Native Data Integration
```

---

# 29. Các plugin khác

Capacitor còn có thể bổ sung các native capability khác.

Trong Week 5 chỉ tập trung vào:

```text
Camera
Geolocation
```

Pattern cần nhớ:

```text
Web JavaScript
    ↓
Capacitor Plugin
    ↓
Native Capability
    ↓
Result
    ↓
Web State / Business Data
```

---

# 30. Checklist demo cuối

- [ ] Week 4 project chạy đúng trước khi migration
- [ ] Capacitor init thành công
- [ ] Android platform được thêm
- [ ] `npm run build` tạo `dist/`
- [ ] `npx cap sync android` thành công
- [ ] App chạy trên Android Emulator/device
- [ ] Dynamic Form vẫn render
- [ ] Geolocation permission được cấu hình
- [ ] Camera Plugin hoạt động
- [ ] Photo preview hoạt động
- [ ] Geolocation Plugin hoạt động
- [ ] Latitude/longitude hiển thị được
- [ ] Submission có `photo` và `location`
- [ ] API down vẫn lưu IndexedDB
- [ ] `syncStatus = pending`
- [ ] Đóng/mở app dữ liệu local vẫn còn
- [ ] API hoạt động lại → POST thành công
- [ ] Local record chuyển sang `synced`
- [ ] Biết kiểm tra Web layer bằng DevTools
- [ ] Biết xem lỗi native bằng Android Studio/Logcat

Nếu đủ:

```text
Week 5 Demo: PASS
```

---

# Tổng kết

Sau Week 5 cần giải thích được chuỗi:

```text
Web/PWA Week 4
→ Capacitor
→ Android Native Shell
→ WebView
→ Camera / Geolocation Plugins
→ photo + location
→ Submission
→ IndexedDB
→ pending
→ API available
→ synced
```

Ba ý cần nhớ:

```text
1. Capacitor giúp tái sử dụng Web/PWA trong native shell.

2. Native Plugins bổ sung Camera/GPS mà không cần viết lại toàn bộ app.

3. Native capability không thay thế offline-first architecture:
   IndexedDB + pending + sync vẫn là workflow chính.
```

Tuần tiếp theo:

```text
Week 6 — React Native + Expo
```

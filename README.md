# Week 4 — Offline-First Field Survey Demo

Project demo hoàn chỉnh cho các nội dung:

- Schema-driven Dynamic Form
- Skip Logic
- IndexedDB
- UUID
- Local-first submission
- Pending / Synced
- Mock API bằng Express
- Sync Queue
- Retry + Exponential Backoff
- Server-side dedupe theo UUID
- Service Worker + Cache API

## 1. Cài dependencies

```bash
npm install
```

## 2. Chạy Mock API

Mở Terminal 1:

```bash
npm run api
```

Kết quả mong đợi:

```text
Mock API running at http://localhost:3001
```

## 3. Chạy frontend

Mở Terminal 2:

```bash
npm run dev
```

Mở URL Vite cung cấp, thường là:

```text
http://localhost:5173
```

## 4. Demo Offline-first

1. Mở app khi Online ít nhất một lần.
2. DevTools → Application → Service Workers: kiểm tra worker đã activated.
3. DevTools → Application → IndexedDB.
4. Network → Offline.
5. Điền form và bấm **Lưu khảo sát**.
6. Quan sát record có `syncStatus = pending`.
7. Reload khi vẫn Offline: record vẫn tồn tại.
8. Network → No throttling.
9. Quan sát Terminal API nhận `POST`.
10. IndexedDB/local UI chuyển từ `pending` → `synced`.

## 5. Demo “Online nhưng API down”

1. Giữ browser Online.
2. Dừng Terminal `npm run api`.
3. Submit survey.
4. Local save vẫn thành công.
5. Sync fail → record vẫn `pending`, `syncAttempts` tăng, `lastError` có dữ liệu.
6. Chạy lại `npm run api`.
7. Bấm **Sync pending** hoặc chờ retry.

## 6. Xem dữ liệu đã lên server

Khi API và Vite đang chạy:

```text
http://localhost:5173/api/submissions
```

Lưu ý: Mock API dùng RAM nên dữ liệu server mất khi restart `npm run api`.
IndexedDB ở browser vẫn còn cho tới khi bạn xóa site data/database.

## 7. Production build

```bash
npm run build
npm run preview
```

`vite.config.js` đã cấu hình proxy cho cả `dev` và `preview`.


## 8. Lưu ý quan trọng khi test production Offline

Vite production bundle có tên hash, ví dụ:

```text
/assets/index-P2Xu9kJm.js
```

Service Worker v5 dùng **runtime caching** cho static resource chưa có trong precache.

Quy trình test chính xác:

```text
1. npm run build
2. npm run preview
3. Mở http://localhost:4173 khi Online
4. Application → Service Workers → kiểm tra activated
5. F5 thêm 1 lần khi vẫn Online
6. Cache Storage → vku-field-survey-v5
7. Kiểm tra đã có /assets/index-....js
8. Network → Offline
9. F5
```

Sau bước 5, production bundle có hash đã được Service Worker runtime-cache.
Khi Offline + F5, Dynamic Form vẫn phải render bình thường.
# CAPACITOR-WEB-PWA

// Chức năng: khai báo tên database, version và object store dùng cho IndexedDB.
const DB_NAME = "vku-field-survey-db";
const DB_VERSION = 1;
const STORE_NAME = "submissions";

// Chức năng: chuyển IndexedDB request dạng event callback thành Promise để code async/await dễ đọc hơn.
function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Chức năng: mở database và tạo object store/index ở lần đầu hoặc khi DB_VERSION tăng.
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Quan trọng: onupgradeneeded là nơi tạo schema của IndexedDB.
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });

        // Quan trọng: index giúp Sync Engine tìm nhanh tất cả record đang pending.
        store.createIndex("syncStatus", "syncStatus", {
          unique: false
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Chức năng: lưu mới hoặc cập nhật một submission trong IndexedDB.
export async function saveSubmission(submission) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  await requestToPromise(store.put(submission));
}

// Chức năng: đọc toàn bộ submissions để hiển thị lên giao diện.
export async function getAllSubmissions() {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return requestToPromise(store.getAll());
}

// Chức năng: chỉ đọc những submission có syncStatus = pending.
export async function getPendingSubmissions() {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index("syncStatus");

  return requestToPromise(index.getAll("pending"));
}

// Chức năng: cập nhật local sync metadata như syncStatus, syncedAt, syncAttempts và lastError.
export async function updateSubmission(id, changes) {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  const current = await requestToPromise(store.get(id));

  if (!current) {
    throw new Error(`Submission not found: ${id}`);
  }

  const updated = {
    ...current,
    ...changes
  };

  await requestToPromise(store.put(updated));

  return updated;
}

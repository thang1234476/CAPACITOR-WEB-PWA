// Chức năng: đặt version cho App Shell cache.
// Quan trọng: đổi version khi thay đổi logic Service Worker hoặc danh sách precache.
const CACHE_NAME = "vku-field-survey-v6";

// Chức năng: precache các file có URL ổn định.
// Lưu ý: Vite production tạo bundle có tên hash như /assets/index-ABC123.js,
// nên bundle production sẽ được runtime-cache ở fetch handler bên dưới.
const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/db.js",
  "/survey-schema.js",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Chức năng: precache App Shell ngay khi Service Worker install.
self.addEventListener("install", (event) => {
  console.log("[SW] install");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] precache app shell");
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

// Chức năng: xóa cache version cũ khi Service Worker mới activate.
self.addEventListener("activate", (event) => {
  console.log("[SW] activate");

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("[SW] delete old cache:", key);
            return caches.delete(key);
          })
      );
    })
  );

  // Quan trọng: cho Service Worker mới control các tab hiện có sớm nhất có thể.
  self.clients.claim();
});

// Chức năng: Cache First cho static resources, nhưng bỏ qua API.
// Nếu cache miss và network thành công, response sẽ được runtime-cache.
// Nhờ vậy bundle production có tên hash của Vite cũng được cache sau một lần reload Online.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Không cache API bằng Cache First.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      // Quan trọng:
      // Vite có thể trả response với Vary: Origin.
      const cachedResponse = await caches.match(request, {
        ignoreVary: true
      });

      if (cachedResponse) {
        console.log("[SW] cache hit:", url.pathname);
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);

        // Runtime-cache static asset lấy thành công từ network.
        if (
          networkResponse.ok &&
          url.origin === self.location.origin
        ) {
          const cache = await caches.open(CACHE_NAME);

          await cache.put(
            request,
            networkResponse.clone()
          );

          console.log(
            "[SW] runtime cached:",
            url.pathname
          );
        }

        return networkResponse;
      } catch (error) {
        if (request.mode === "navigate") {
          return caches.match("/offline.html", {
            ignoreVary: true
          });
        }

        throw error;
      }
    })()
  );
});

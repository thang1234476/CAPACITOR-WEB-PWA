import { defineConfig } from "vite";

// Chức năng: gom cấu hình proxy để cả dev server và preview server đều gọi được Mock API.
const proxyConfig = {
  "/api": {
    target: "http://localhost:3001",
    changeOrigin: true
  }
};

export default defineConfig({
  // Chức năng: proxy /api khi chạy `npm run dev`.
  server: {
    proxy: proxyConfig
  },

  // Chức năng: proxy /api khi chạy `npm run preview`.
  preview: {
    proxy: proxyConfig
  }
});

import { defineConfig, loadEnv } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  // Đọc .env để lấy CORS_ORIGINS (Vite chỉ expose prefix VITE_ cho client).
  const env = loadEnv(mode, process.cwd(), '');

  const corsOrigins = (env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 4000,
      // strictPort: fail ngay nếu port bị chiếm, thay vì lặng lẽ chuyển sang
      // 4001 (frontend vẫn gọi 4000 -> CORS/network error khó truy).
      strictPort: true,
      // Vite có sẵn middleware CORS chạy TRƯỚC TanStack Start và tự trả lời
      // preflight OPTIONS. Nếu không bật `credentials: true`, browser sẽ chặn
      // request vì thiếu header 'Access-Control-Allow-Credentials: true'
      // (frontend dùng `credentials: 'include'` để gửi cookie refresh token).
      cors: {
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        maxAge: 86400,
      },
    },
    plugins: [
      // TanStack Start plugin MUST come before react()
      tanstackStart(),
      viteReact(),
    ],
  };
});

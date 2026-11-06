import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `loadEnv` đọc file `.env` theo `envDir`. Mặc định `envDir` = `process.cwd()`,
  // mà Render chạy build command từ **repo root** -> `.env` của frontend không
  // được load, và các biến `VITE_*` set trong Render Dashboard cũng bị bỏ qua
  // (Render không ghi file .env xuống disk).
  //
  // Vì vậy chỉ định rõ `envDir` là thư mục chứa file này -> luôn là thư mục
  // gốc của frontend, bất kể build command chạy từ đâu.
  const envDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, envDir, '')

  // ─── Base path ────────────────────────────────────────────────────────────
  // Dev: mặc định '/henzo_store/' (app chạy dưới sub-path).
  // Prod (Render Static Site): đặt VITE_BASE_PATH=/ để phục vụ ở domain gốc.
  //   → Render Static Site luôn phục vụ ở domain gốc, nên base phải là '/'.
  const base = env.VITE_BASE_PATH ?? '/henzo_store/'

  return {
    base,
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
  }
})

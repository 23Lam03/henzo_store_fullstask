import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

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

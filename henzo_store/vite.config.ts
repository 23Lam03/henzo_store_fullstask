import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ mode }) => {

  const envDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, envDir, '')

  const base = env.VITE_BASE_PATH ?? '/henzo_store/'

  return {
    base,
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
  }
})

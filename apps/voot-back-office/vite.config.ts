import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @vooth/shared 를 빌드 산출물(dist) 대신 소스로 직접 해석한다.
      // 공유 패키지를 수정해도 별도 build / .vite 캐시 삭제 없이 HMR 로 즉시 반영된다.
      '@vooth/shared': fileURLToPath(
        new URL('../../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },
})

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    __VUE_OPTIONS_API__: true, // Set to true if you use Options API, false if purely Composition API for better tree-shaking.
    __VUE_PROD_DEVTOOLS__: false, // Disable devtools in production builds.
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true // Provide hydration mismatch details in production. Set to false to reduce bundle size if not needed.
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7777',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
})

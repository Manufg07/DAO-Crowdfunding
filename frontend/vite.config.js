import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'  // ✅ Use this for compatibility

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)), // ✅ Correct alias setup
    },
  },
})

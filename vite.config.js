import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  // This ensures VITE_GEMINI_API_KEY is loaded from .env
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Make process.env.API_KEY available for Gemini SDK, sourced from VITE_GEMINI_API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      // You can define other process.env variables here if needed by other libraries
      // adhering to similar strict guidelines. For typical Vite usage, import.meta.env is preferred.
    },
    server: {
      port: 5173, // Default port
      // proxy: { // Optional: if you want to proxy backend requests through Vite dev server
      //   '/api': {
      //     target: 'http://localhost:3001', // Your backend URL
      //     changeOrigin: true,
      //     // rewrite: (path) => path.replace(/^\/api/, '') // if your backend routes don't start with /api
      //   }
      // }
    }
  }
})

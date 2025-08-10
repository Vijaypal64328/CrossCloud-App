import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Default API URL based on environment
  const defaultApiUrl = mode === 'development' 
    ? 'http://localhost:5000' 
    : 'https://crosscloud-app-backend.onrender.com';
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || defaultApiUrl),
    },
    server: {
      // This ensures development server properly reloads on changes
      watch: {
        usePolling: true,
      },
      // Automatically open browser on start
      open: true
    }
  }
})

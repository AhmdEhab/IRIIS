import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  server: {
    // When previewing through an HTTPS tunnel/proxy, set
    // VITE_ALLOWED_HOSTS=".example.com,other.host" to let Vite accept
    // those Host headers. Empty by default — no domain is baked into the repo.
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',')
      : [],
    // Same proxy as `preview` below. A dev session reached through a tunnel
    // serves the app from an https origin, where the default VITE_API_URL
    // (http://localhost:5000/api) points at the *visitor's* machine and every
    // auth call dies. With this proxy, `VITE_API_URL=/api` keeps calls
    // same-origin, so a shared preview behaves like the deployment.
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
  // P65: `vite preview` mirrors the dev proxy so a production-style build
  // can be exercised against the local API (scripts/qa-chunk-recovery.mjs).
  preview: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})

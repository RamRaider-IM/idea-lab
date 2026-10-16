import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built site works at any URL or sub-path (GitHub Pages, Netlify, Cloudflare).
  base: './',
  plugins: [react()],
})

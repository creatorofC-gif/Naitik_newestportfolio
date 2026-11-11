import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site under /<repo>/; Vercel (which sets VERCEL=1 when building) serves it at /.
  base: process.env.VERCEL ? '/' : '/Naitik_newestportfolio/',
})

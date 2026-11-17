import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Clean URLs (BrowserRouter) need absolute asset paths, otherwise opening a deep link such as
// /admin/fees requests /admin/assets/*.js and renders a blank page.
// Hash/memory routers always load from the page's own folder, so they can use './' and run
// from any sub-path (GitHub Pages project sites, sandboxed previews).
// BASE_PATH overrides both, e.g. BASE_PATH=/eats/ for clean URLs under a sub-path.
const base = process.env.BASE_PATH ?? (process.env.VITE_ROUTER ? './' : '/')

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})

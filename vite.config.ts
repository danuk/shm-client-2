import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'auto',
      manifest: {
        name: process.env.APP_NAME || 'SHM Client',
        short_name: process.env.APP_NAME || 'SHM',
        description: process.env.APP_DESCRIPTION || 'SHM Client',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        id: '/',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        screenshots: [
          { src: 'screenshot-desktop.png', sizes: '3410x1872', type: 'image/png', form_factor: 'wide', label: 'App' },
          { src: 'screenshot-mobile.png', sizes: '1154x1868', type: 'image/png', form_factor: 'narrow', label: 'App' },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})

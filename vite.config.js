import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pulsar',
        short_name: 'Pulsar',
        description: 'Pulsar - o‘quvchilar va to‘lovlarni boshqarish tizimi',
        theme_color: '#111827',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/pulsar-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pulsar-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
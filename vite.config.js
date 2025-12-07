import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/arrws/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['192.png', '512.png'],
      manifest: {
        name: 'ARROWS',
        short_name: 'ARROWS',
        description: 'ARROWS - PWA mobile app',
        theme_color: '#9a8a76',
        background_color: '#9a8a76',
        display: 'standalone',
        orientation: 'any',
        start_url: '/arrws/',
        scope: '/arrws/',
        icons: [
          {
            src: '/arrws/192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/arrws/512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ozlphrt\.github\.io\/arrws\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'arrws-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  }
});



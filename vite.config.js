import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base path can be set via VITE_BASE_PATH env var, defaults to /arrws/ for production
const getBasePath = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  return process.env.NODE_ENV === 'production' ? '/arrws/' : '/';
};

const base = getBasePath();

export default defineConfig({
  base,
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
        start_url: base === '/' ? '/' : base,
        scope: base === '/' ? '/' : base,
        icons: [
          {
            src: `${base}192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${base}512.png`,
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
              cacheName: base.includes('v2') ? 'arrws-v2-cache' : 'arrws-cache',
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



import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: ['apple-touch-icon.png', 'icon.svg', 'screenshot-tv.png'],
        manifest: {
          id: '/',
          name: 'TV Kiosk Display',
          short_name: 'TV Kiosk',
          description: 'Modo kiosco profesional para TV y pantallas con auto-recarga, pantalla siempre activa y arranque automático.',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'fullscreen',
          display_override: ['fullscreen', 'standalone'],
          start_url: '/',
          scope: '/',
          orientation: 'any',
          categories: ['utilities', 'business', 'productivity'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshot-tv.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'TV Kiosk Display en pantalla completa',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

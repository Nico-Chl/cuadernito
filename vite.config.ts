import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// base './' + HashRouter: l'app fonctionne sous n'importe quel sous-chemin
// (GitHub Pages, Cloudflare Pages, etc.).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Cuadernito',
        short_name: 'Cuadernito',
        description: 'Vocabulaire et conjugaison, hors ligne.',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#faf6ee',
        theme_color: '#c2410c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
      },
    }),
  ],
})

import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

const icon = (size: number) => ({
  src: `/icon-${size}.png`,
  sizes: `${size}x${size}`,
  type: 'image/png',
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' keeps the running session intact and lets the in-app toast
      // decide when to apply the update.
      registerType: 'prompt',
      includeAssets: [
        'icon.svg',
        'icon-maskable.svg',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        id: '/',
        name: 'HifzFlow — حفظ القرآن',
        short_name: 'HifzFlow',
        description: 'تطبيق محلي أولاً لحفظ القرآن ومراجعته بالتثبيت والتكرار المتباعد. يعمل دون إنترنت.',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        background_color: '#f5f7f2',
        theme_color: '#2a7055',
        categories: ['education', 'productivity'],
        icons: [
          icon(192),
          icon(512),
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        shortcuts: [
          { name: 'مراجعة اليوم', short_name: 'المراجعة', url: '/#revision', icons: [icon(192)] },
          { name: 'المصحف', short_name: 'المصحف', url: '/#reader', icons: [icon(192)] },
          { name: 'ضبط المتشابهات', short_name: 'المتشابهات', url: '/#mutashabihat', icons: [icon(192)] },
          { name: 'تسجيل محفوظ', short_name: 'الحفظ', url: '/#memorization', icons: [icon(192)] },
          { name: 'جلسة تركيز', short_name: 'التركيز', url: '/#focus', icons: [icon(192)] },
        ],
      },
      workbox: {
        // App shell + bundled Quran text. User data lives in IndexedDB and is
        // never cached by the service worker.
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: { enabled: true },
            includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png'],
            manifest: {
                name: 'Shiksha Setu',
                short_name: 'Shiksha Setu',
                description: 'Five-minute assessment. Next-day teaching action.',
                theme_color: '#0b6e69',
                background_color: '#f6f8f7',
                display: 'standalone',
                start_url: '/login',
                icons: [
                    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
                    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,ico,png}'],
                navigateFallback: '/index.html',
                cleanupOutdatedCaches: true,
            },
        }),
    ],
});

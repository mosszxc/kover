import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const host = process.env.TAURI_DEV_HOST
const isTauri = !!process.env.TAURI_ENV_PLATFORM
const isDebug = process.env.TAURI_ENV_DEBUG === "true"

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  build: {
    // Windows 11 WebView2 = Edge 120+ (Chromium 120)
    target: isTauri ? "chrome125" : undefined,
    sourcemap: isTauri && isDebug,
  },
  plugins: [
    react(),
    tailwindcss(),
    // PWA is web-only — not needed inside Tauri's native window
    ...(!isTauri
      ? [
          VitePWA({
            registerType: "autoUpdate",
            manifest: {
              name: "Kover — Управление маршрутами",
              short_name: "Kover",
              description:
                "Система управления маршрутами обслуживания клиентов",
              theme_color: "#1a1a2e",
              background_color: "#1a1a2e",
              display: "standalone",
              start_url: "/",
              icons: [
                {
                  src: "/pwa-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "/pwa-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
                {
                  src: "/pwa-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any maskable",
                },
              ],
            },
            workbox: {
              navigateFallback: "/index.html",
              globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

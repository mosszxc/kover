import fs from "fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import pkg from "./package.json"

const host = process.env.TAURI_DEV_HOST
const isTauri = !!process.env.TAURI_ENV_PLATFORM
const isDebug = process.env.TAURI_ENV_DEBUG === "true"

function parseChangelog(md: string) {
  const releases: { version: string; date: string; items: { type: string; text: string }[] }[] = []
  const sectionRe = /^## v(.+?) \((\d{4}-\d{2}-\d{2})\)/
  const categoryMap: Record<string, string> = {
    "Новое": "feature",
    "Исправления": "fix",
    "Прочее": "improvement",
  }

  let current: (typeof releases)[number] | null = null
  let currentType = "improvement"

  for (const line of md.split("\n")) {
    const sectionMatch = line.match(sectionRe)
    if (sectionMatch) {
      current = { version: sectionMatch[1], date: sectionMatch[2], items: [] }
      releases.push(current)
      continue
    }
    if (line.startsWith("### ")) {
      const category = line.replace("### ", "").trim()
      currentType = categoryMap[category] ?? "improvement"
      continue
    }
    if (current && line.startsWith("- ")) {
      const text = line
        .slice(2)
        .replace(/\s*\(#\d+\)/g, "")
        .trim()
      if (text) {
        current.items.push({ type: currentType, text })
      }
    }
  }
  return releases
}

function changelogPlugin(): Plugin {
  const virtualId = "virtual:changelog"
  const resolvedId = "\0" + virtualId
  const changelogPath = path.resolve(__dirname, "../../CHANGELOG.md")

  return {
    name: "vite-plugin-changelog",
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id === resolvedId) {
        const md = fs.existsSync(changelogPath)
          ? fs.readFileSync(changelogPath, "utf-8")
          : ""
        const releases = parseChangelog(md)
        return `export const releases = ${JSON.stringify(releases)};`
      }
    },
    handleHotUpdate({ file, server }) {
      if (file === changelogPath) {
        const mod = server.moduleGraph.getModuleById(resolvedId)
        if (mod) return [mod]
      }
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
    changelogPlugin(),
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

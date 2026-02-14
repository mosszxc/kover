import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[proxy] ${req.method} ${req.url} -> ${proxyReq.path}`)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[proxy] ${req.method} ${req.url} <- ${proxyRes.statusCode}`)
          })
          proxy.on('error', (err, req) => {
            console.log(`[proxy] ERROR ${req.method} ${req.url}: ${err.message}`)
          })
        },
      },
      '/_': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

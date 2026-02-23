import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { App } from "./app/App"

// After deploy, old JS chunks no longer exist on the server.
// Vercel rewrite returns index.html (text/html) instead → MIME type error.
// Auto-reload fetches the new index.html with correct chunk references.
window.addEventListener("vite:preloadError", () => {
  window.location.reload()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

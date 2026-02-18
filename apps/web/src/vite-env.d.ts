/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module "virtual:changelog" {
  export const releases: {
    version: string
    date: string
    items: { type: "feature" | "fix" | "improvement"; text: string }[]
  }[]
}

interface ImportMetaEnv {
  readonly TAURI_ENV_PLATFORM?: string
  readonly TAURI_ENV_ARCH?: string
  readonly TAURI_ENV_FAMILY?: string
  readonly TAURI_ENV_DEBUG?: string
  readonly TAURI_ENV_TARGET_TRIPLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

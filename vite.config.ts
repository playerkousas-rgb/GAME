import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()]
  try {
    // @ts-expect-error optional local dev-only plugin, not present in repo
    const m = await import('./.vite-source-tags.js')
    plugins.push(m.sourceTags())
  } catch {
    /* optional */
  }
  return {
    plugins,
    server: {
      host: true,
      allowedHosts: true as const,
    },
    preview: {
      host: true,
      allowedHosts: true as const,
    },
  }
})

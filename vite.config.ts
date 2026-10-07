import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// The poster ships as a single file opened straight from disk, where Chrome and Firefox both
// refuse to run `<script type="module">`. Dropping the attribute leaves a classic script with no
// module semantics to object to — but it also drops the implicit defer, and Vite emits the entry
// into <head>, so the script would run before #root exists. Inline scripts ignore `defer`, so the
// tag has to move to the end of <body> instead. vite-plugin-singlefile inlines it in place later.
function classicScript(): Plugin {
  return {
    name: 'classic-script',
    // Build only. In dev the entry is a real module served over http, where module semantics
    // both work and are required — stripping them there leaves a blank page.
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const tags: string[] = []
        const stripped = html.replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g, (tag) => {
          tags.push(tag.replace(/\s+type="module"/g, '').replace(/\s+crossorigin(="[^"]*")?/g, ''))
          return ''
        })
        return tags.length ? stripped.replace('</body>', `  ${tags.join('\n  ')}\n  </body>`) : html
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), classicScript()],
  build: {
    rollupOptions: { output: { format: 'iife' } },
    modulePreload: false,
  },
})

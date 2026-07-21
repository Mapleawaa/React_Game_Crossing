import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { compileStory } from './scripts/compile-story.mjs'

function inkStoryPlugin(): Plugin {
  const inkRoot = resolve(import.meta.dirname, 'src/story/ink')

  return {
    name: 'ink-story',
    buildStart() {
      compileStory()
    },
    configureServer(server) {
      server.watcher.add(`${inkRoot}/**/*.ink`)
      server.watcher.on('change', (path) => {
        if (!path.endsWith('.ink')) {
          return
        }

        try {
          compileStory()
          server.ws.send({ type: 'full-reload' })
        } catch (error) {
          server.config.logger.error(error instanceof Error ? error.message : String(error))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [inkStoryPlugin(), react(), tailwindcss()],
})

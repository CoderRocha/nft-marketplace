import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const ENTRY_ROUTES = new Set(['__root__', '/_shop', '/_shop/'])

const preloadMocks = (): Plugin => ({
  name: 'kurio:preload-mocks',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html, context) => {
      const mocksChunk = Object.values(context.bundle ?? {}).find(
        (output) => output.type === 'chunk' && output.facadeModuleId?.endsWith('src/mocks/browser.ts'),
      )
      if (!mocksChunk) return html
      return [{ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: '', href: `/${mocksChunk.fileName}` }, injectTo: 'head' }]
    },
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [
    devtools(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      codeSplittingOptions: {
        splitBehavior: ({ routeId }) => (ENTRY_ROUTES.has(routeId) ? [] : undefined),
      },
    }),
    react(),
    tailwindcss(),
    loadEnv(mode, process.cwd()).VITE_MOCKS === 'true' && preloadMocks(),
  ],
  resolve: { tsconfigPaths: true },
  preview: { host: '127.0.0.1', port: 4173 },
}))

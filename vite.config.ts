import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleApiRequest } from './server/groqProxy.ts'

function groqApiPlugin(): Plugin {
  return {
    name: 'groq-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res);
        if (!handled) next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res);
        if (!handled) next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), groqApiPlugin()],
})

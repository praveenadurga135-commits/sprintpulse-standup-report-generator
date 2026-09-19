import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleGenerateSummary, handleGenerateReport, handleLlmStatus } from './server/groqProxy.ts'

function groqApiPlugin(): Plugin {
  return {
    name: 'groq-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/generate-summary') {
          await handleGenerateSummary(req, res);
          return;
        }
        if (req.method === 'POST' && req.url === '/api/generate-report') {
          await handleGenerateReport(req, res);
          return;
        }
        if (req.method === 'GET' && req.url === '/api/llm-status') {
          await handleLlmStatus(req, res);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/generate-summary') {
          await handleGenerateSummary(req, res);
          return;
        }
        if (req.method === 'POST' && req.url === '/api/generate-report') {
          await handleGenerateReport(req, res);
          return;
        }
        if (req.method === 'GET' && req.url === '/api/llm-status') {
          await handleLlmStatus(req, res);
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), groqApiPlugin()],
})

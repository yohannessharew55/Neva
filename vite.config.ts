import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env for API routes during local dev
  if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
  if (env.POSTGRES_URL) process.env.POSTGRES_URL = env.POSTGRES_URL;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'dev-api-serverless-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/sync')) {
              try {
                const apiModule = await server.ssrLoadModule('/api/sync.js');
                const handler = apiModule.default;
                
                // Polyfill status and json methods on res for Express-like compatibility
                const originalEnd = res.end.bind(res);
                (res as any).status = function (code: number) {
                  this.statusCode = code;
                  return this;
                };
                (res as any).json = function (data: any) {
                  this.setHeader('Content-Type', 'application/json');
                  return originalEnd(JSON.stringify(data));
                };

                // Read POST body if present
                if (req.method === 'POST') {
                  let body = '';
                  req.on('data', chunk => { body += chunk; });
                  req.on('end', async () => {
                    try {
                      (req as any).body = body ? JSON.parse(body) : {};
                    } catch (e) {
                      (req as any).body = body;
                    }
                    await handler(req, res);
                  });
                } else {
                  await handler(req, res);
                }
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            } else if (req.url?.startsWith('/api/health')) {
              try {
                const apiModule = await server.ssrLoadModule('/api/health.js');
                const handler = apiModule.default;
                (res as any).status = function (code: number) {
                  this.statusCode = code;
                  return this;
                };
                (res as any).json = function (data: any) {
                  this.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify(data));
                };
                await handler(req, res);
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            } else {
              next();
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});

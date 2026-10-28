import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import routeHandler from './api/route.ts';
import geocodeHandler from './api/geocode.ts';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'distances.bin'],
      manifest: {
        name: 'FairRide Tamil Nadu Auto Fare Calculator',
        short_name: 'FairRide',
        description: 'Legal Auto-Rickshaw Fare Calculator for Tamil Nadu (2026 Tariff & 2013 G.O. 611)',
        theme_color: '#f59e0b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛺</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛺</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,bin,json}']
      }
    }),
    {
      name: 'local-api-endpoints',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/route')) {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', async () => {
              const mockReq = {
                method: req.method,
                body: body ? JSON.parse(body) : {},
                url: req.url
              };
              const mockRes = {
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => ({
                  json: (data: any) => {
                    res.statusCode = code;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  end: () => res.end()
                })
              };
              await routeHandler(mockReq, mockRes);
            });
            return;
          }

          if (req.url?.startsWith('/api/geocode')) {
            const mockReq = {
              method: req.method,
              url: req.url
            };
            const mockRes = {
              setHeader: (k: string, v: string) => res.setHeader(k, v),
              status: (code: number) => ({
                json: (data: any) => {
                  res.statusCode = code;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => res.end()
              })
            };
            await geocodeHandler(mockReq, mockRes);
            return;
          }

          next();
        });
      }
    }
  ]
});

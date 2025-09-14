import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        boats: resolve(__dirname, 'boats.html'),
        boats_detail: resolve(__dirname, 'boats_detail.html'),
        contact: resolve(__dirname, 'contact.html'),
        services: resolve(__dirname, 'services.html'),
        'boat-management': resolve(__dirname, 'boat-management.html'),
        experience: resolve(__dirname, 'experience.html'),
        test: resolve(__dirname, 'test-navigation.html'),
        'test-simple-boat': resolve(__dirname, 'test-simple-boat.html'),
        'test-api-direct': resolve(__dirname, 'test-api-direct.html'),
        'debug-boats': resolve(__dirname, 'debug-boats.html'),
        'test-boat-card': resolve(__dirname, 'test-boat-card.html'),
        'clear-cache': resolve(__dirname, 'clear-cache.html'),
        'test-index': resolve(__dirname, 'test-index.html')
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
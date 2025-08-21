import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://sailingloc.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Erreur proxy:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📡 Requête vers:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📦 Réponse reçue:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
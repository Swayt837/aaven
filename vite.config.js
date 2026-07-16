import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Client sur 5180 (port dédié — évite le conflit avec d'autres projets sur 5173),
// API Express sur 3001. On proxifie /api vers le backend.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vendors stables dans des chunks séparés : ils restent en cache
        // navigateur entre deux déploiements (seul le chunk applicatif change).
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5180,
    strictPort: true, // échoue clairement si 5180 est pris, plutôt que de dériver silencieusement
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})

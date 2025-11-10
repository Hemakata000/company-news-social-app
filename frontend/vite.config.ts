import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      watch: {
        usePolling: true,
        interval: 100,
      },
      hmr: {
        overlay: true,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // Performance optimizations
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for React and related libraries
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // API utilities chunk
            api: ['axios'],
          },
        },
      },
      // Enable tree shaking
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      target: 'es2015',
    },
    // Performance optimizations for development
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    },
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
      __GIT_COMMIT__: JSON.stringify(process.env.GIT_COMMIT || 'unknown'),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  }
})
/// <reference types="node" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '', '');

  return {
    plugins: [react()],
    base: '/', // Changed for root deployment on Netlify
    build: {
      outDir: 'dist',
      assetsDir: '', // Place assets directly in outDir (dist)
      rollupOptions: {
        output: {
          // Ensure generated names don't add an 'assets' prefix if assetsDir is empty
          assetFileNames: `[name]-[hash][extname]`,
          chunkFileNames: `[name]-[hash].js`,
          entryFileNames: `[name]-[hash].js`,
        },
      },
    },
    // Expose environment variables to the client
    define: {
      // Per strict instructions, `process.env.API_KEY` is used for the Gemini API key.
      // Vite's `define` performs a direct text replacement, making the env var available in client-side code.
      // Using VITE_GEMINI_API_KEY aligns with Vite's standards for environment variables.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
    // Proxy for local development with Netlify Functions
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8888', // Default port for `netlify dev`
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions'),
        },
      },
    },
  }
})
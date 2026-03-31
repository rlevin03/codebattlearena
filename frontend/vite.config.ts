import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
});

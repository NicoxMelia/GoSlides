import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** El config corre en Node, pero el proyecto no depende de @types/node: declaramos
 *  sólo lo que usamos en vez de sumar la dependencia entera. */
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  publicDir: '.generated-public',
  build: {
    outDir: 'dist-studio',
    emptyOutDir: true,
    rollupOptions: { input: 'studio.html' },
  },
});

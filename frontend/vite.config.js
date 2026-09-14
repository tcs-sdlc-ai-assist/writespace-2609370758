import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Configure the Vite runtime and browser-like Vitest environment. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['src/__tests__/**/*.test.jsx'],
  }
});

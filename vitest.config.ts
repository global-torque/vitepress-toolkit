import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@global-torque/content-toolkit': fileURLToPath(new URL('../content-toolkit/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
  },
});

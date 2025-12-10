import { defineConfig } from 'vitest/config';
import { webcrypto } from 'crypto';

// Ensure crypto is available during Vite config resolution
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setupVitest.js'],
  },
});

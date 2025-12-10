import { webcrypto } from 'crypto';

// Provide a Node-compatible crypto for Vite/Vitest startup
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

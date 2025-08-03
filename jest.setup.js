import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-32-bytes'
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto')
  globalThis.crypto = {
    getRandomValues: (arr) => crypto.randomFillSync(arr),
    subtle: crypto.webcrypto?.subtle,
  }
}
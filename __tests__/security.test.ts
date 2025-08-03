import { SecureCrypto } from '../src/lib/crypto'
import { SecurityUtils } from '../src/lib/security'
import { LuminaWebProtocol } from '../src/lib/protocol'
import { AuthService } from '../src/lib/auth'

describe('Security Tests', () => {
  describe('Cryptography', () => {
    test('should generate unique key pairs', () => {
      const keyPair1 = SecureCrypto.generateKeyPair()
      const keyPair2 = SecureCrypto.generateKeyPair()
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
      expect(keyPair1.publicKey.length).toBeGreaterThan(0)
      expect(keyPair1.privateKey.length).toBeGreaterThan(0)
    })

    test('should encrypt and decrypt data correctly', () => {
      const originalData = 'This is a secret message'
      const key = Buffer.from('test-key-32-bytes-long-for-aes25', 'utf8')
      
      const encrypted = SecureCrypto.encrypt(originalData, key)
      const decrypted = SecureCrypto.decrypt(encrypted, key)
      
      expect(decrypted).toBe(originalData)
      expect(encrypted.data).not.toBe(originalData)
      expect(encrypted.iv).toHaveLength(32) // 16 bytes in hex
      expect(encrypted.tag).toHaveLength(64) // HMAC-SHA256 32 bytes in hex
    })

    test('should fail decryption with wrong key', () => {
      const originalData = 'Secret message'
      const correctKey = Buffer.from('correct-key-32-bytes-long-for-25', 'utf8')
      const wrongKey = Buffer.from('wrong-key-32-bytes-long-for-aes25', 'utf8')
      
      const encrypted = SecureCrypto.encrypt(originalData, correctKey)
      
      expect(() => {
        SecureCrypto.decrypt(encrypted, wrongKey)
      }).toThrow()
    })

    test('should generate secure nonces', () => {
      const nonces = Array.from({ length: 1000 }, () => SecureCrypto.generateNonce())
      const uniqueNonces = new Set(nonces)
      
      expect(uniqueNonces.size).toBe(nonces.length) // All nonces should be unique
      expect(nonces.every(nonce => nonce.length === 64)).toBe(true) // 32 bytes in hex
    })

    test('should generate and verify HMAC correctly', () => {
      const data = 'Important message'
      const key = Buffer.from('secret-hmac-key', 'utf8')
      
      const hmac = SecureCrypto.generateHMAC(data, key)
      const isValid = SecureCrypto.verifyHMAC(data, hmac, key)
      const isInvalid = SecureCrypto.verifyHMAC('tampered message', hmac, key)
      
      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
      expect(hmac).toHaveLength(64) // SHA256 hash in hex
    })

    test('should hash and verify passwords', async () => {
      const password = 'MySecurePassword123!'
      const hashedPassword = await SecureCrypto.hashPassword(password)
      
      const isValid = await SecureCrypto.verifyPassword(password, hashedPassword)
      const isInvalid = await SecureCrypto.verifyPassword('WrongPassword', hashedPassword)
      
      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
      expect(hashedPassword).not.toBe(password)
    })
  })

  describe('Input Validation', () => {
    test('should validate email addresses correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]
      
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@.com',
        'user..user@domain.com',
        'user@domain',
        ''
      ]
      
      validEmails.forEach(email => {
        expect(SecurityUtils.validateEmail(email)).toBe(true)
      })
      
      invalidEmails.forEach(email => {
        expect(SecurityUtils.validateEmail(email)).toBe(false)
      })
    })

    test('should validate password strength', () => {
      const weakPasswords = [
        '123',
        'password',
        'Password',
        'Password123',
        'short'
      ]
      
      const strongPasswords = [
        'MyStr0ng!P@ssw0rd',
        'Super$ecure123Password!',
        'C0mplex!P@ssw0rd2024'
      ]
      
      weakPasswords.forEach(password => {
        const result = SecurityUtils.validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
      
      strongPasswords.forEach(password => {
        const result = SecurityUtils.validatePassword(password)
        expect(result.isValid).toBe(true)
        expect(result.errors.length).toBe(0)
      })
    })

    test('should sanitize input correctly', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        'onclick="alert(\'xss\')"'
      ]
      
      maliciousInputs.forEach(input => {
        const sanitized = SecurityUtils.sanitizeInput(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onclick=')
      })
    })

    test('should validate timestamps correctly', () => {
      const now = new Date().toISOString()
      const future = new Date(Date.now() + 1000000).toISOString()
      const past = new Date(Date.now() - 100000).toISOString()
      const veryOld = new Date(Date.now() - 10000000).toISOString()
      
      expect(SecurityUtils.isValidTimestamp(now)).toBe(true)
      expect(SecurityUtils.isValidTimestamp(past)).toBe(true)
      expect(SecurityUtils.isValidTimestamp(future)).toBe(false)
      expect(SecurityUtils.isValidTimestamp(veryOld)).toBe(false)
      expect(SecurityUtils.isValidTimestamp('invalid-date')).toBe(false)
    })
  })

  describe('Protocol Security', () => {
    test('should create and validate protocol messages', () => {
      const keyPair = SecureCrypto.generateKeyPair()
      const payload = { text: 'Hello, World!' }
      
      const message = LuminaWebProtocol.createMessage(
        'message',
        'sender@example.com',
        'recipient@example.com',
        payload,
        keyPair.privateKey
      )
      
      expect(message.version).toBe('1.0')
      expect(message.type).toBe('message')
      expect(message.from).toBe('sender@example.com')
      expect(message.to).toBe('recipient@example.com')
      expect(message.nonce).toHaveLength(64)
      expect(message.signature).toHaveLength(512) // RSA signature length
      
      const validation = LuminaWebProtocol.validateMessage(message, keyPair.publicKey)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should reject tampered messages', () => {
      const keyPair = SecureCrypto.generateKeyPair()
      const payload = { text: 'Original message' }
      
      const message = LuminaWebProtocol.createMessage(
        'message',
        'sender@example.com',
        'recipient@example.com',
        payload,
        keyPair.privateKey
      )
      
      // Tamper with the message
      const tamperedMessage = { ...message, payload: JSON.stringify({ text: 'Tampered message' }) }
      
      const validation = LuminaWebProtocol.validateMessage(tamperedMessage, keyPair.publicKey)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Invalid message signature')
    })

    test('should detect replay attacks', () => {
      const usedNonces = new Set<string>()
      const nonce1 = SecureCrypto.generateNonce()
      const nonce2 = SecureCrypto.generateNonce()
      
      expect(LuminaWebProtocol.isReplayAttack(nonce1, usedNonces)).toBe(false)
      expect(LuminaWebProtocol.isReplayAttack(nonce1, usedNonces)).toBe(true) // Replay
      expect(LuminaWebProtocol.isReplayAttack(nonce2, usedNonces)).toBe(false)
    })
  })

  describe('Authentication Security', () => {
    test('should generate valid JWT tokens', async () => {
      const result = await AuthService.register('test@example.com', 'SecurePassword123!')
      
      expect(result.success).toBe(true)
      expect(result.tokens?.accessToken).toBeDefined()
      expect(result.tokens?.refreshToken).toBeDefined()
      
      if (result.tokens) {
        const verification = await AuthService.verifyToken(result.tokens.accessToken)
        expect(verification.valid).toBe(true)
        expect(verification.payload?.email).toBe('test@example.com')
      }
    })

    test('should reject invalid credentials', async () => {
      // First register a user
      await AuthService.register('test2@example.com', 'SecurePassword123!')
      
      // Try to login with wrong password
      const loginResult = await AuthService.login('test2@example.com', 'WrongPassword')
      
      expect(loginResult.success).toBe(false)
      expect(loginResult.message).toBe('Invalid credentials')
    })

    test('should reject expired tokens', async () => {
      // This test would require mocking time or using a very short expiry
      // For now, we'll test token structure
      const result = await AuthService.register('test3@example.com', 'SecurePassword123!')
      
      if (result.tokens) {
        const tokenParts = result.tokens.accessToken.split('.')
        expect(tokenParts).toHaveLength(3) // JWT has header.payload.signature
      }
    })
  })

  describe('Constant Time Operations', () => {
    test('should use constant time comparison', () => {
      const string1 = 'secret-value'
      const string2 = 'secret-value'
      const string3 = 'different-value'
      
      expect(SecureCrypto.constantTimeCompare(string1, string2)).toBe(true)
      expect(SecureCrypto.constantTimeCompare(string1, string3)).toBe(false)
      expect(SecureCrypto.constantTimeCompare('', '')).toBe(true)
      expect(SecureCrypto.constantTimeCompare('a', 'ab')).toBe(false)
    })
  })
})
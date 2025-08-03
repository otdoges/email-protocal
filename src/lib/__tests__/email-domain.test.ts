import { EmailDomainService } from '../email-domain';

describe('EmailDomainService', () => {
  beforeEach(() => {
    // Reset environment variable for consistent testing
    process.env.LUMINAWEB_DOMAIN = 'luminaweb.app';
  });

  describe('generateEmail', () => {
    it('should generate email with correct domain', () => {
      const email = EmailDomainService.generateEmail('testuser');
      expect(email).toBe('testuser&luminaweb.app');
    });

    it('should sanitize username', () => {
      const email = EmailDomainService.generateEmail('Test User!@#');
      expect(email).toBe('testuser&luminaweb.app');
    });

    it('should handle special characters', () => {
      const email = EmailDomainService.generateEmail('test.user_123');
      expect(email).toBe('test.user_123&luminaweb.app');
    });
  });

  describe('extractUsername', () => {
    it('should extract username from LuminaWeb email', () => {
      const username = EmailDomainService.extractUsername('testuser&luminaweb.app');
      expect(username).toBe('testuser');
    });

    it('should return null for non-LuminaWeb email', () => {
      const username = EmailDomainService.extractUsername('testuser@gmail.com');
      expect(username).toBeNull();
    });
  });

  describe('isLuminaWebEmail', () => {
    it('should return true for LuminaWeb emails', () => {
      expect(EmailDomainService.isLuminaWebEmail('test&luminaweb.app')).toBe(true);
    });

    it('should return false for external emails', () => {
      expect(EmailDomainService.isLuminaWebEmail('test@gmail.com')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const result = EmailDomainService.validateUsername('testuser');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short usernames', () => {
      const result = EmailDomainService.validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be at least 3 characters long');
    });

    it('should reject long usernames', () => {
      const result = EmailDomainService.validateUsername('a'.repeat(25));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be no more than 20 characters long');
    });

    it('should reject reserved usernames', () => {
      const result = EmailDomainService.validateUsername('admin');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This username is reserved and cannot be used');
    });

    it('should reject usernames with invalid characters', () => {
      const result = EmailDomainService.validateUsername('test@user');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username can only contain lowercase letters, numbers, dots, underscores, and hyphens');
    });
  });

  describe('generateUniqueUsername', () => {
    it('should generate unique username when base is taken', async () => {
      const checkAvailability = jest.fn()
        .mockResolvedValueOnce(false) // First attempt fails
        .mockResolvedValueOnce(true);  // Second attempt succeeds

      const username = await EmailDomainService.generateUniqueUsername(
        'testuser',
        checkAvailability
      );

      expect(username).not.toBe('testuser');
      expect(username).toMatch(/^testuser\./);
    });

    it('should return base username if available', async () => {
      const checkAvailability = jest.fn().mockResolvedValue(true);

      const username = await EmailDomainService.generateUniqueUsername(
        'availableuser',
        checkAvailability
      );

      expect(username).toBe('availableuser');
    });
  });

  describe('getDomain', () => {
    it('should return the configured domain', () => {
      expect(EmailDomainService.getDomain()).toBe('luminaweb.app');
    });
  });
});
/**
 * Email domain configuration for LuminaWeb
 */

export class EmailDomainService {
  private static readonly DOMAIN = process.env.LUMINAWEB_DOMAIN || 'luminaweb.app';
  private static readonly RESERVED_USERNAMES = new Set([
    'admin', 'root', 'support', 'help', 'info', 'contact', 'security',
    'abuse', 'postmaster', 'noreply', 'no-reply', 'system', 'api',
    'www', 'mail', 'email', 'luminaweb', 'app', 'service'
  ]);

  /**
   * Generate a LuminaWeb email address from a username
   */
  static generateEmail(username: string): string {
    const cleanUsername = this.sanitizeUsername(username);
    return `${cleanUsername}@${this.DOMAIN}`;
  }

  /**
   * Extract username from a LuminaWeb email
   */
  static extractUsername(email: string): string | null {
    const emailRegex = new RegExp(`^(.+)@${this.DOMAIN.replace('.', '\\.')}$`);
    const match = email.match(emailRegex);
    return match ? match[1] : null;
  }

  /**
   * Check if an email is a LuminaWeb email
   */
  static isLuminaWebEmail(email: string): boolean {
    return email.endsWith(`@${this.DOMAIN}`);
  }

  /**
   * Sanitize and validate username
   */
  private static sanitizeUsername(username: string): string {
    // Convert to lowercase and remove special characters
    let sanitized = username.toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing dots, underscores, hyphens
      .replace(/[._-]{2,}/g, '.'); // Replace multiple consecutive special chars with single dot

    // Ensure it starts and ends with alphanumeric
    sanitized = sanitized.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');

    // Ensure minimum length
    if (sanitized.length < 3) {
      sanitized = sanitized.padEnd(3, Math.random().toString(36).substr(2, 1));
    }

    // Ensure maximum length
    if (sanitized.length > 20) {
      sanitized = sanitized.substring(0, 20);
    }

    return sanitized;
  }

  /**
   * Generate a unique username from a desired username
   */
  static async generateUniqueUsername(
    desiredUsername: string,
    checkAvailability: (email: string) => Promise<boolean>
  ): Promise<string> {
    let baseUsername = this.sanitizeUsername(desiredUsername);
    
    // Check if the base username is reserved
    if (this.RESERVED_USERNAMES.has(baseUsername)) {
      baseUsername = `user.${baseUsername}`;
    }

    let username = baseUsername;
    let email = this.generateEmail(username);
    let counter = 1;

    // Keep trying until we find an available username
    while (!(await checkAvailability(email))) {
      if (counter === 1) {
        username = `${baseUsername}.${Math.random().toString(36).substr(2, 4)}`;
      } else {
        username = `${baseUsername}.${counter}`;
      }
      email = this.generateEmail(username);
      counter++;

      // Prevent infinite loops
      if (counter > 1000) {
        username = `user.${Date.now().toString(36)}`;
        email = this.generateEmail(username);
        break;
      }
    }

    return username;
  }

  /**
   * Validate username format
   */
  static validateUsername(username: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!username || username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username.length > 20) {
      errors.push('Username must be no more than 20 characters long');
    }

    if (!/^[a-z0-9._-]+$/.test(username)) {
      errors.push('Username can only contain lowercase letters, numbers, dots, underscores, and hyphens');
    }

    if (/^[._-]/.test(username) || /[._-]$/.test(username)) {
      errors.push('Username cannot start or end with dots, underscores, or hyphens');
    }

    if (/[._-]{2,}/.test(username)) {
      errors.push('Username cannot contain consecutive special characters');
    }

    if (this.RESERVED_USERNAMES.has(username)) {
      errors.push('This username is reserved and cannot be used');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get the domain for LuminaWeb emails
   */
  static getDomain(): string {
    return this.DOMAIN;
  }
}
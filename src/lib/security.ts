import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as crypto from 'crypto';

export class SecurityUtils {
  private static rateLimiters: Map<string, RateLimiterMemory> = new Map();

  static createRateLimiter(key: string, options: {
    points: number;
    duration: number;
    blockDuration?: number;
  }): RateLimiterMemory {
    const limiter = new RateLimiterMemory({
      points: options.points,
      duration: options.duration,
      blockDuration: options.blockDuration || options.duration
    });
    
    this.rateLimiters.set(key, limiter);
    return limiter;
  }

  static async checkRateLimit(key: string, identifier: string): Promise<boolean> {
    const limiter = this.rateLimiters.get(key);
    if (!limiter) return true;

    try {
      await limiter.consume(identifier);
      return true;
    } catch {
      return false;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email) && email.length <= 320 && email.length >= 5 && !email.includes('..');
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  static isValidTimestamp(timestamp: string, maxAgeMs: number = 300000): boolean {
    try {
      const messageTime = new Date(timestamp).getTime();
      const currentTime = Date.now();
      const age = currentTime - messageTime;
      
      return age >= 0 && age <= maxAgeMs;
    } catch {
      return false;
    }
  }

  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static validateCSRFToken(token: string, expected: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expected)
    );
  }

  static hashSHA256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static encodeBase64Url(data: Buffer): string {
    return data
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static decodeBase64Url(data: string): Buffer {
    let base64 = data
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return Buffer.from(base64, 'base64');
  }

  static isValidPublicKey(publicKey: string): boolean {
    try {
      crypto.createPublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  static checkPasswordStrength(password: string): number {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;
    
    return Math.min(score, 5);
  }
}
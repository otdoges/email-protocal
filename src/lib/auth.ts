import * as jwt from 'jsonwebtoken';
import { SecureCrypto } from './crypto';
import { SecurityUtils } from './security';
import { SecureStorage } from './storage';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  publicKey: string;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.BETTER_AUTH_SECRET || 'secure-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  static async register(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: any;
    tokens?: { accessToken: string; refreshToken: string };
  }> {
    try {
      if (!SecurityUtils.validateEmail(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      const passwordValidation = SecurityUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { 
          success: false, 
          message: passwordValidation.errors.join(', ') 
        };
      }

      const existingUser = await SecureStorage.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      const keyPair = SecureCrypto.generateKeyPair();
      const passwordHash = await SecureCrypto.hashPassword(password);

      const userId = await SecureStorage.storeUser({
        email,
        passwordHash,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        password
      });

      const { tokens, jti } = await this.generateTokens(userId, email);
      
      SecureStorage.storeSession(jti, {
        userId,
        email,
        publicKey: keyPair.publicKey,
        sessionId: jti,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return {
        success: true,
        message: 'User registered successfully',
        user: {
          id: userId,
          email,
          publicKey: keyPair.publicKey
        },
        tokens
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Registration failed' 
      };
    }
  }

  static async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: any;
    tokens?: { accessToken: string; refreshToken: string };
    encryptedPrivateKey?: string;
  }> {
    try {
      const user = await SecureStorage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      const isValidPassword = await SecureCrypto.verifyPassword(
        password,
        user.passwordHash
      );

      if (!isValidPassword) {
        return { success: false, message: 'Invalid credentials' };
      }

      await SecureStorage.updateUserPresence(user.id, true);

      const { tokens, jti } = await this.generateTokens(user.id, email);
      
      SecureStorage.storeSession(jti, {
        userId: user.id,
        email,
        publicKey: user.publicKey,
        sessionId: jti,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          publicKey: user.publicKey,
          lastSeen: user.lastSeen
        },
        tokens,
        encryptedPrivateKey: JSON.stringify(user.encryptedPrivateKey)
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Login failed' 
      };
    }
  }

  static async verifyToken(token: string): Promise<{
    valid: boolean;
    payload?: JWTPayload;
    message?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      
      const session = SecureStorage.getSession(decoded.jti);
      if (!session || session.expiresAt < Date.now()) {
        return { valid: false, message: 'Session expired' };
      }

      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, message: 'Invalid token' };
    }
  }

  static async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    tokens?: { accessToken: string; refreshToken: string };
    message?: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as JWTPayload;
      
      const session = SecureStorage.getSession(decoded.jti);
      if (!session || session.expiresAt < Date.now()) {
        return { success: false, message: 'Session expired' };
      }

      const { tokens: newTokens, jti } = await this.generateTokens(decoded.userId, decoded.email);
      
      SecureStorage.storeSession(jti, {
        ...session,
        sessionId: jti,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

      return { success: true, tokens: newTokens };
    } catch (error) {
      return { success: false, message: 'Token refresh failed' };
    }
  }

  static async logout(sessionId: string): Promise<{ success: boolean }> {
    try {
      SecureStorage.deleteSession(sessionId);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  static async validateSession(sessionId: string): Promise<AuthSession | null> {
    try {
      const session = SecureStorage.getSession(sessionId);
      
      if (!session || session.expiresAt < Date.now()) {
        if (session) {
          SecureStorage.deleteSession(sessionId);
        }
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  private static async generateTokens(
    userId: string,
    email: string
  ): Promise<{ tokens: { accessToken: string; refreshToken: string }; jti: string }> {
    const jti = SecureCrypto.generateSecureToken();
    
    const accessTokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId,
      email,
      jti
    };

    const accessToken = jwt.sign(accessTokenPayload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'smp-protocol',
      audience: 'smp-client'
    });

    const refreshToken = jwt.sign(accessTokenPayload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'smp-protocol',
      audience: 'smp-client'
    });

    return { tokens: { accessToken, refreshToken }, jti };
  }

  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await SecureStorage.getUserById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const isValidOldPassword = await SecureCrypto.verifyPassword(
        oldPassword,
        user.passwordHash
      );

      if (!isValidOldPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      const passwordValidation = SecurityUtils.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return { 
          success: false, 
          message: passwordValidation.errors.join(', ') 
        };
      }

      const newPasswordHash = await SecureCrypto.hashPassword(newPassword);
      
      user.passwordHash = newPasswordHash;
      
      return { success: true, message: 'Password changed successfully' };
    } catch {
      return { success: false, message: 'Password change failed' };
    }
  }

  static async extractUserFromToken(authHeader: string): Promise<JWTPayload | null> {
    try {
      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      const verification = await this.verifyToken(token);
      
      return verification.valid ? (jwt.decode(token) as JWTPayload) : null;
    } catch {
      return null;
    }
  }
}
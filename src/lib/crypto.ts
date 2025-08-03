import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { KeyPair, EncryptedData } from '../types/protocol';

export class SecureCrypto {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_SIZE = 32; // 256 bits
  private static readonly IV_SIZE = 16; // 128 bits for CBC
  private static readonly TAG_SIZE = 16; // 128 bits
  private static readonly SALT_ROUNDS = 12;

  static generateKeyPair(): KeyPair {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };
  }

  static generateEphemeralKeyPair(): KeyPair {
    return this.generateKeyPair();
  }

  static deriveSharedSecret(privateKey: string, publicKey: string): Buffer {
    const sharedSecret = crypto.diffieHellman({
      privateKey: crypto.createPrivateKey(privateKey),
      publicKey: crypto.createPublicKey(publicKey)
    });
    
    return crypto.scryptSync(sharedSecret, 'smp-protocol', this.KEY_SIZE);
  }

  static encrypt(data: string, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(this.IV_SIZE);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encrypted + iv.toString('hex'));
    const tag = hmac.digest('hex');

    return {
      iv: iv.toString('hex'),
      data: encrypted,
      tag: tag
    };
  }

  static decrypt(encryptedData: EncryptedData, key: Buffer): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    // Verify HMAC first
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encryptedData.data + encryptedData.iv);
    const expectedTag = hmac.digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(encryptedData.tag, 'hex'), Buffer.from(expectedTag, 'hex'))) {
      throw new Error('Invalid authentication tag');
    }
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static encryptWithPassword(data: string, password: string): EncryptedData {
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, this.KEY_SIZE);
    const iv = crypto.randomBytes(this.IV_SIZE);
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encrypted + salt.toString('hex') + iv.toString('hex'));
    const tag = hmac.digest('hex');
    
    return {
      iv: salt.toString('hex') + iv.toString('hex'),
      data: encrypted,
      tag: tag
    };
  }

  static decryptWithPassword(encryptedData: EncryptedData, password: string): string {
    const saltAndIv = Buffer.from(encryptedData.iv, 'hex');
    const salt = saltAndIv.slice(0, 16);
    const iv = saltAndIv.slice(16);
    
    const key = crypto.scryptSync(password, salt, this.KEY_SIZE);
    
    // Verify HMAC first
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encryptedData.data + salt.toString('hex') + iv.toString('hex'));
    const expectedTag = hmac.digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(encryptedData.tag, 'hex'), Buffer.from(expectedTag, 'hex'))) {
      throw new Error('Invalid authentication tag');
    }
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static generateHMAC(data: string, key: Buffer): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  static verifyHMAC(data: string, hmac: string, key: Buffer): boolean {
    const expectedHmac = this.generateHMAC(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  static sign(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  }

  static verify(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'hex');
    } catch {
      return false;
    }
  }

  static generateMessageId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
import { MessagePayload, User, EncryptedData } from '../types/protocol';
import { SecureCrypto } from './crypto';

export interface StoredMessage {
  id: string;
  from: string;
  to: string;
  encryptedSubject: EncryptedData;
  encryptedBody: EncryptedData;
  encryptedAttachments?: EncryptedData;
  timestamp: string;
  isRead: boolean;
  threadId?: string;
  replyTo?: string;
}

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  publicKey: string;
  encryptedPrivateKey: EncryptedData;
  createdAt: string;
  lastSeen: string;
  isOnline: boolean;
  emailVerified: boolean;
}

export class SecureStorage {
  private static storageKey: Buffer;
  private static messages: Map<string, StoredMessage> = new Map();
  private static users: Map<string, StoredUser> = new Map();
  private static sessions: Map<string, any> = new Map();
  private static usedNonces: Set<string> = new Set();

  static initialize(encryptionKey: string) {
    this.storageKey = Buffer.from(encryptionKey, 'hex');
  }

  static async storeMessage(
    from: string,
    to: string,
    messagePayload: MessagePayload
  ): Promise<string> {
    const messageId = SecureCrypto.generateMessageId();
    
    const encryptedSubject = SecureCrypto.encrypt(
      messagePayload.subject,
      this.storageKey
    );
    
    const encryptedBody = SecureCrypto.encrypt(
      messagePayload.body,
      this.storageKey
    );
    
    let encryptedAttachments;
    if (messagePayload.attachments) {
      encryptedAttachments = SecureCrypto.encrypt(
        JSON.stringify(messagePayload.attachments),
        this.storageKey
      );
    }

    const storedMessage: StoredMessage = {
      id: messageId,
      from,
      to,
      encryptedSubject,
      encryptedBody,
      encryptedAttachments,
      timestamp: new Date().toISOString(),
      isRead: false,
      threadId: messagePayload.threadId,
      replyTo: messagePayload.replyTo
    };

    this.messages.set(messageId, storedMessage);
    return messageId;
  }

  static async getMessage(messageId: string): Promise<MessagePayload | null> {
    const storedMessage = this.messages.get(messageId);
    if (!storedMessage) return null;

    try {
      const subject = SecureCrypto.decrypt(
        storedMessage.encryptedSubject,
        this.storageKey
      );
      
      const body = SecureCrypto.decrypt(
        storedMessage.encryptedBody,
        this.storageKey
      );
      
      let attachments;
      if (storedMessage.encryptedAttachments) {
        const attachmentsJson = SecureCrypto.decrypt(
          storedMessage.encryptedAttachments,
          this.storageKey
        );
        attachments = JSON.parse(attachmentsJson);
      }

      return {
        subject,
        body,
        attachments,
        threadId: storedMessage.threadId,
        replyTo: storedMessage.replyTo
      };
    } catch {
      return null;
    }
  }

  static async getInbox(userEmail: string, limit: number = 50): Promise<{
    messages: any[];
    totalCount: number;
    unreadCount: number;
  }> {
    const userMessages = Array.from(this.messages.values())
      .filter(msg => msg.to === userEmail)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    const totalCount = Array.from(this.messages.values())
      .filter(msg => msg.to === userEmail).length;

    const unreadCount = Array.from(this.messages.values())
      .filter(msg => msg.to === userEmail && !msg.isRead).length;

    const decryptedMessages = await Promise.all(
      userMessages.map(async (msg) => {
        const messagePayload = await this.getMessage(msg.id);
        return {
          id: msg.id,
          from: msg.from,
          to: msg.to,
          subject: messagePayload?.subject || '[Encrypted]',
          body: messagePayload?.body || '[Encrypted]',
          timestamp: msg.timestamp,
          isRead: msg.isRead,
          threadId: msg.threadId,
          attachments: messagePayload?.attachments
        };
      })
    );

    return {
      messages: decryptedMessages,
      totalCount,
      unreadCount
    };
  }

  static async markAsRead(messageId: string): Promise<boolean> {
    const message = this.messages.get(messageId);
    if (!message) return false;

    message.isRead = true;
    this.messages.set(messageId, message);
    return true;
  }

  static async deleteMessage(messageId: string): Promise<boolean> {
    return this.messages.delete(messageId);
  }

  static async storeUser(user: {
    email: string;
    passwordHash: string;
    publicKey: string;
    privateKey: string;
    password: string;
  }): Promise<string> {
    const userId = SecureCrypto.generateMessageId();
    
    const encryptedPrivateKey = SecureCrypto.encryptWithPassword(
      user.privateKey,
      user.password
    );

    const storedUser: StoredUser = {
      id: userId,
      email: user.email,
      passwordHash: user.passwordHash,
      publicKey: user.publicKey,
      encryptedPrivateKey,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: false,
      emailVerified: false
    };

    this.users.set(userId, storedUser);
    return userId;
  }

  static async getUserByEmail(email: string): Promise<StoredUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  static async getUserById(userId: string): Promise<StoredUser | null> {
    return this.users.get(userId) || null;
  }

  static async updateUserPresence(userId: string, isOnline: boolean): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    user.isOnline = isOnline;
    user.lastSeen = new Date().toISOString();
    this.users.set(userId, user);
    return true;
  }

  static async getUserPublicKey(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    return user?.publicKey || null;
  }

  static storeSession(sessionId: string, sessionData: any): void {
    this.sessions.set(sessionId, {
      ...sessionData,
      createdAt: Date.now()
    });
  }

  static getSession(sessionId: string): any {
    return this.sessions.get(sessionId);
  }

  static deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  static addUsedNonce(nonce: string): void {
    this.usedNonces.add(nonce);
    
    if (this.usedNonces.size > 10000) {
      const noncesArray = Array.from(this.usedNonces);
      this.usedNonces = new Set(noncesArray.slice(-5000));
    }
  }

  static isNonceUsed(nonce: string): boolean {
    return this.usedNonces.has(nonce);
  }

  static cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [sessionId, session] of this.sessions) {
      if (session.createdAt < oneHourAgo) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
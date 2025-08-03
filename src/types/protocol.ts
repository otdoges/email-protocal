export interface LWPMessage {
  version: "1.0";
  type: "auth" | "handshake" | "message" | "ack" | "presence";
  from: string;
  to: string;
  timestamp: string;
  nonce: string;
  signature: string;
  payload: string;
}

export interface MessagePayload {
  subject: string;
  body: string;
  attachments?: Attachment[];
  replyTo?: string;
  threadId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
}

export interface User {
  id: string;
  email: string;
  publicKey: string;
  createdAt: string;
  lastSeen: string;
  isOnline: boolean;
}

export interface AuthPayload {
  email: string;
  password?: string;
  publicKey: string;
  challenge?: string;
}

export interface HandshakePayload {
  publicKey: string;
  ephemeralKey: string;
  challenge: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

export interface SessionData {
  userId: string;
  sessionKey: string;
  expiresAt: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}
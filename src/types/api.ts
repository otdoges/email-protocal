import { LWPMessage, User, MessagePayload } from './protocol';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  publicKey: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  encryptedPrivateKey: string;
}

export interface SendMessageRequest {
  to: string;
  subject: string;
  body: string;
  attachments?: any[];
}

export interface MessageResponse {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  threadId?: string;
  attachments?: any[];
}

export interface InboxResponse {
  messages: MessageResponse[];
  totalCount: number;
  unreadCount: number;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  publicKey: string;
  createdAt: string;
  lastSeen: string;
}

export interface PublicKeyResponse {
  email: string;
  publicKey: string;
}
import { SecureCrypto } from './crypto';
import { SecurityUtils } from './security';
import { 
  LWPMessage, 
  MessagePayload, 
  KeyPair, 
  EncryptedData 
} from '../types/protocol';
import { 
  APIResponse, 
  LoginRequest, 
  RegisterRequest, 
  SendMessageRequest,
  MessageResponse,
  InboxResponse,
  UserProfileResponse 
} from '../types/api';

export interface ClientConfig {
  baseURL: string;
  timeout?: number;
  enableEncryption?: boolean;
}

export interface ClientSession {
  accessToken: string;
  refreshToken: string;
  user: any;
  encryptedPrivateKey?: string;
  privateKey?: string;
}

export class LuminaWebClient {
  private config: ClientConfig;
  private session: ClientSession | null = null;
  private keyPair: KeyPair | null = null;
  private sharedKeys: Map<string, Buffer> = new Map();

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 30000,
      enableEncryption: true,
      ...config
    };
  }

  async register(email: string, password: string): Promise<APIResponse<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }>> {
    try {
      const response = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: { email, password }
      });

      if (response.success && response.data) {
        this.session = {
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
          user: response.data.user
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  async login(email: string, password: string): Promise<APIResponse<{
    user: any;
    tokens: { accessToken: string; refreshToken: string };
    encryptedPrivateKey: string;
  }>> {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (response.success && response.data) {
        this.session = {
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
          user: response.data.user,
          encryptedPrivateKey: response.data.encryptedPrivateKey
        };

        if (this.config.enableEncryption && response.data.encryptedPrivateKey) {
          try {
            const encryptedData = JSON.parse(response.data.encryptedPrivateKey);
            this.session.privateKey = SecureCrypto.decryptWithPassword(
              encryptedData,
              password
            );
          } catch (error) {
            console.warn('Failed to decrypt private key');
          }
        }
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  async refreshToken(): Promise<APIResponse<{
    tokens: { accessToken: string; refreshToken: string };
  }>> {
    try {
      if (!this.session?.refreshToken) {
        return {
          success: false,
          error: 'No refresh token available'
        };
      }

      const response = await this.makeRequest('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.session.refreshToken }
      });

      if (response.success && response.data) {
        this.session.accessToken = response.data.tokens.accessToken;
        this.session.refreshToken = response.data.tokens.refreshToken;
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  async sendMessage(
    to: string,
    subject: string,
    body: string,
    attachments?: any[]
  ): Promise<APIResponse<{ messageId: string; timestamp: string }>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const messageData: SendMessageRequest = {
        to,
        subject,
        body,
        attachments
      };

      const response = await this.makeRequest('/api/messages/send', {
        method: 'POST',
        body: messageData,
        authenticated: true
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send message'
      };
    }
  }

  async getInbox(limit?: number): Promise<APIResponse<InboxResponse>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const url = `/api/messages/inbox${limit ? `?limit=${limit}` : ''}`;
      const response = await this.makeRequest(url, {
        method: 'GET',
        authenticated: true
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get inbox'
      };
    }
  }

  async getMessage(messageId: string): Promise<APIResponse<MessageResponse>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const response = await this.makeRequest(`/api/messages/${messageId}`, {
        method: 'GET',
        authenticated: true
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get message'
      };
    }
  }

  async deleteMessage(messageId: string): Promise<APIResponse<void>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const response = await this.makeRequest(`/api/messages/${messageId}`, {
        method: 'DELETE',
        authenticated: true
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete message'
      };
    }
  }

  async getUserProfile(): Promise<APIResponse<UserProfileResponse>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const response = await this.makeRequest('/api/users/profile', {
        method: 'GET',
        authenticated: true
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user profile'
      };
    }
  }

  async getUserPublicKey(email: string): Promise<APIResponse<{
    email: string;
    publicKey: string;
  }>> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      const response = await this.makeRequest(`/api/users/public-key/${encodeURIComponent(email)}`, {
        method: 'GET',
        authenticated: true
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get user public key'
      };
    }
  }

  async logout(): Promise<void> {
    this.session = null;
    this.keyPair = null;
    this.sharedKeys.clear();
  }

  isAuthenticated(): boolean {
    return !!(this.session?.accessToken);
  }

  getCurrentUser(): any {
    return this.session?.user;
  }

  private async makeRequest(
    endpoint: string,
    options: {
      method: string;
      body?: any;
      authenticated?: boolean;
      headers?: Record<string, string>;
    }
  ): Promise<APIResponse> {
    try {
      const url = `${this.config.baseURL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (options.authenticated && this.session?.accessToken) {
        headers.Authorization = `Bearer ${this.session.accessToken}`;
      }

      const requestOptions: RequestInit = {
        method: options.method,
        headers,
        ...(this.config.timeout && { signal: AbortSignal.timeout(this.config.timeout) })
      };

      if (options.body) {
        requestOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (response.status === 401 && this.session?.refreshToken) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          headers.Authorization = `Bearer ${this.session.accessToken}`;
          const retryResponse = await fetch(url, { ...requestOptions, headers });
          return retryResponse.json();
        }
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  generateKeyPair(): KeyPair {
    this.keyPair = SecureCrypto.generateKeyPair();
    return this.keyPair;
  }

  encryptMessage(message: string, recipientPublicKey: string): EncryptedData | null {
    try {
      if (!this.keyPair) {
        this.generateKeyPair();
      }

      const sharedSecret = SecureCrypto.deriveSharedSecret(
        this.keyPair!.privateKey,
        recipientPublicKey
      );

      return SecureCrypto.encrypt(message, sharedSecret);
    } catch {
      return null;
    }
  }

  decryptMessage(encryptedData: EncryptedData, senderPublicKey: string): string | null {
    try {
      if (!this.keyPair) {
        return null;
      }

      const sharedSecret = SecureCrypto.deriveSharedSecret(
        this.keyPair.privateKey,
        senderPublicKey
      );

      return SecureCrypto.decrypt(encryptedData, sharedSecret);
    } catch {
      return null;
    }
  }
}
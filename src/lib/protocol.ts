import { LWPMessage, MessagePayload, HandshakePayload } from '../types/protocol';
import { SecureCrypto } from './crypto';
import { SecurityUtils } from './security';

export class LuminaWebProtocol {
  private static readonly VERSION = "1.0";
  private static readonly MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB

  static createMessage(
    type: LWPMessage['type'],
    from: string,
    to: string,
    payload: any,
    privateKey: string
  ): LWPMessage {
    const timestamp = new Date().toISOString();
    const nonce = SecureCrypto.generateNonce();
    const payloadString = JSON.stringify(payload);
    
    const signatureData = `${this.VERSION}${type}${from}${to}${timestamp}${nonce}${payloadString}`;
    const signature = SecureCrypto.sign(signatureData, privateKey);

    return {
      version: this.VERSION,
      type,
      from,
      to,
      timestamp,
      nonce,
      signature,
      payload: payloadString
    };
  }

  static validateMessage(message: LWPMessage, publicKey: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (message.version !== this.VERSION) {
      errors.push('Invalid protocol version');
    }

    if (!['auth', 'handshake', 'message', 'ack', 'presence'].includes(message.type)) {
      errors.push('Invalid message type');
    }

    if (!SecurityUtils.validateEmail(message.from)) {
      errors.push('Invalid sender email');
    }

    if (!SecurityUtils.validateEmail(message.to)) {
      errors.push('Invalid recipient email');
    }

    if (!SecurityUtils.isValidTimestamp(message.timestamp)) {
      errors.push('Invalid or expired timestamp');
    }

    if (!message.nonce || message.nonce.length !== 64) {
      errors.push('Invalid nonce');
    }

    if (message.payload.length > this.MAX_MESSAGE_SIZE) {
      errors.push('Message payload too large');
    }

    const signatureData = `${message.version}${message.type}${message.from}${message.to}${message.timestamp}${message.nonce}${message.payload}`;
    if (!SecureCrypto.verify(signatureData, message.signature, publicKey)) {
      errors.push('Invalid message signature');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static parsePayload<T = any>(message: LWPMessage): T {
    try {
      return JSON.parse(message.payload);
    } catch {
      throw new Error('Invalid payload format');
    }
  }

  static createHandshakeMessage(
    from: string,
    to: string,
    ephemeralPublicKey: string,
    challenge: string,
    privateKey: string
  ): LWPMessage {
    const payload: HandshakePayload = {
      publicKey: ephemeralPublicKey,
      ephemeralKey: ephemeralPublicKey,
      challenge
    };

    return this.createMessage('handshake', from, to, payload, privateKey);
  }

  static createSecureMessage(
    from: string,
    to: string,
    messagePayload: MessagePayload,
    sharedKey: Buffer,
    privateKey: string
  ): LWPMessage {
    const encryptedPayload = SecureCrypto.encrypt(
      JSON.stringify(messagePayload),
      sharedKey
    );

    return this.createMessage('message', from, to, encryptedPayload, privateKey);
  }

  static decryptMessage(
    message: LWPMessage,
    sharedKey: Buffer
  ): MessagePayload {
    try {
      const encryptedData = this.parsePayload(message);
      const decryptedPayload = SecureCrypto.decrypt(encryptedData, sharedKey);
      return JSON.parse(decryptedPayload);
    } catch {
      throw new Error('Failed to decrypt message');
    }
  }

  static createAckMessage(
    from: string,
    to: string,
    originalMessageId: string,
    privateKey: string
  ): LWPMessage {
    const payload = {
      messageId: originalMessageId,
      status: 'received'
    };

    return this.createMessage('ack', from, to, payload, privateKey);
  }

  static createPresenceMessage(
    from: string,
    status: 'online' | 'offline' | 'away',
    privateKey: string
  ): LWPMessage {
    const payload = {
      status,
      lastSeen: new Date().toISOString()
    };

    return this.createMessage('presence', from, 'broadcast', payload, privateKey);
  }

  static validateMessageIntegrity(
    message: LWPMessage,
    expectedFrom: string,
    expectedTo: string
  ): boolean {
    return (
      message.from === expectedFrom &&
      message.to === expectedTo &&
      SecurityUtils.isValidTimestamp(message.timestamp)
    );
  }

  static generateMessageId(): string {
    return SecureCrypto.generateMessageId();
  }

  static isReplayAttack(nonce: string, usedNonces: Set<string>): boolean {
    if (usedNonces.has(nonce)) {
      return true;
    }
    usedNonces.add(nonce);
    return false;
  }
}
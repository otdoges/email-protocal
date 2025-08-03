# LuminaWeb Protocol (LWP) v1.0

## Overview
LWP is a custom email protocol designed for maximum security, using hybrid cryptography and modern web standards.

## Security Features
- End-to-end encryption (ECDH + AES-256-GCM)
- Perfect forward secrecy with ephemeral keys
- Message authentication (HMAC-SHA256)
- Anti-replay protection (timestamps + nonces)
- Rate limiting and DDoS protection
- Zero-knowledge architecture

## Transport
- Primary: HTTPS (REST API)
- Real-time: WebSocket Secure (WSS)
- Format: JSON

## Message Structure
```typescript
interface LWPMessage {
  version: "1.0";
  type: "auth" | "handshake" | "message" | "ack" | "presence";
  from: string;
  to: string;
  timestamp: string; // ISO8601
  nonce: string; // 32-byte random
  signature: string; // HMAC-SHA256
  payload: string; // Encrypted JSON
}
```

## Cryptographic Operations

### Key Exchange (ECDH)
1. Client generates ephemeral key pair
2. Server responds with public key
3. Both derive shared secret using ECDH
4. Shared secret used for AES-256-GCM encryption

### Message Encryption
1. Generate random IV (12 bytes)
2. Encrypt message with AES-256-GCM
3. Compute HMAC of encrypted data
4. Include IV and tag in payload

### Authentication
1. User registers with email/password
2. Server returns JWT with encrypted private key
3. Client decrypts private key with password
4. All requests signed with private key

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `POST /api/auth/refresh` - Token refresh

### Messaging
- `POST /api/messages/send` - Send message
- `GET /api/messages/inbox` - Get inbox
- `GET /api/messages/:id` - Get specific message
- `DELETE /api/messages/:id` - Delete message

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/public-key/:email` - Get user's public key

## WebSocket Events
- `message:new` - New message received
- `message:read` - Message read receipt
- `user:online` - User presence
- `user:offline` - User disconnected
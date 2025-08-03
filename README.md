# LuminaWeb Protocol (LWP)

A custom, ultra-secure email protocol built with TypeScript, featuring end-to-end encryption, zero-knowledge architecture, and real-time messaging.

## Features

🔐 **End-to-End Encryption**: Messages encrypted with AES-256-GCM and ECDH key exchange
🛡️ **Zero-Knowledge Architecture**: Server cannot read your messages
⚡ **Real-Time Messaging**: WebSocket support for instant message delivery
🔒 **Strong Authentication**: JWT-based auth with rate limiting
🚀 **Vercel Ready**: Optimized for serverless deployment

## Security Features

- **Hybrid Cryptography**: RSA + AES encryption
- **Perfect Forward Secrecy**: Ephemeral key exchange
- **Message Authentication**: HMAC-SHA256 integrity verification
- **Anti-Replay Protection**: Timestamp and nonce validation
- **Rate Limiting**: DDoS protection with configurable limits
- **Secure Headers**: HSTS, CSP, X-Frame-Options, etc.

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd email-protocal
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `BETTER_AUTH_SECRET`: 256-bit random key for better-auth
- `ENCRYPTION_KEY`: 32-byte hex key for storage encryption
- `DATABASE_URL`: Your database connection string
- `BETTER_AUTH_URL`: Your application URL (http://localhost:3000 for development)

### 3. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Production Build

```bash
npm run build
npm start
```

## Vercel Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/luminaweb)

### Manual Deploy

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add BETTER_AUTH_SECRET
   vercel env add ENCRYPTION_KEY
   vercel env add DATABASE_URL
   ```

### Environment Variables (Vercel)

Set these in your Vercel project settings:

- `BETTER_AUTH_SECRET`: Your better-auth signing key (256-bit)
- `ENCRYPTION_KEY`: Storage encryption key (32-byte hex)  
- `DATABASE_URL`: Your database connection string
- `BETTER_AUTH_URL`: Your deployed URL
- `NEXT_PUBLIC_API_URL`: Your deployed URL
- `NEXT_PUBLIC_APP_URL`: Your deployed URL

## Protocol Specification

### Message Format

```typescript
interface LWPMessage {
  version: "1.0";
  type: "auth" | "handshake" | "message" | "ack" | "presence";
  from: string;
  to: string;
  timestamp: string;
  nonce: string;
  signature: string;
  payload: string; // Encrypted
}
```

### Encryption Flow

1. **Key Exchange**: ECDH with ephemeral keys
2. **Message Encryption**: AES-256-GCM with derived shared secret
3. **Authentication**: HMAC-SHA256 message signing
4. **Transport**: HTTPS/WSS with additional encryption layer

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/messages/send` - Send encrypted message
- `GET /api/messages/inbox` - Retrieve messages
- `GET /api/users/public-key/:email` - Get user's public key

## Security Considerations

### Client-Side
- Private keys never leave the client
- Messages encrypted before transmission
- Secure key derivation (PBKDF2/scrypt)

### Server-Side
- Zero-knowledge message storage
- Rate limiting on all endpoints
- Secure session management
- Input validation and sanitization

### Transport
- HTTPS/WSS only in production
- Certificate pinning recommended
- Secure WebSocket authentication

## Development

### Project Structure

```
src/
├── app/                # Next.js app directory
├── components/         # React components
│   ├── auth/          # Authentication components
│   ├── chat/          # Chat interface components
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── lib/               # Core libraries
│   ├── auth.ts        # Authentication service
│   ├── client.ts      # API client
│   ├── crypto.ts      # Cryptography functions
│   ├── protocol.ts    # Protocol implementation
│   ├── security.ts    # Security utilities
│   └── storage.ts     # Encrypted storage
├── pages/api/         # API routes
└── types/             # TypeScript definitions
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Performance

- **Serverless Functions**: Sub-100ms response times
- **Edge Caching**: Static assets cached globally
- **WebSocket**: < 50ms message delivery
- **Encryption**: Hardware-accelerated crypto operations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file

## Security Disclosure

Report security vulnerabilities to: security@yourdomain.com

## Roadmap

- [ ] Mobile app (React Native)
- [ ] File attachments with encryption
- [ ] Group messaging
- [ ] Message threading
- [ ] Push notifications
- [ ] Desktop client (Electron)
- [ ] Federation protocol
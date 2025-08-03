# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LuminaWeb (LWP) is an ultra-secure custom email protocol built with TypeScript, featuring end-to-end encryption, zero-knowledge architecture, and real-time messaging. It uses Next.js for the frontend and API routes, with WebSocket support for real-time communication.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm test` - Run Jest test suite
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

### Testing
- `pnpm test` - Run all tests
- `pnpm test -- --watch` - Run tests in watch mode
- `pnpm test -- __tests__/security.test.ts` - Run specific test file

## Architecture Overview

### Core Security Architecture
This is a **defensive security project** built around cryptographic primitives:

- **LuminaWebProtocol** (`src/lib/protocol.ts`): Core protocol implementation handling message creation, validation, signing, and encryption
- **SecureCrypto** (`src/lib/crypto.ts`): Cryptographic operations including AES-256-GCM encryption, ECDH key exchange, HMAC, digital signatures, and password hashing
- **AuthService** (`src/lib/auth.ts`): JWT-based authentication with secure session management
- **SecurityUtils** (`src/lib/security.ts`): Input validation, email validation, timestamp validation, and security utilities
- **SecureStorage** (`src/lib/storage.ts`): Encrypted storage layer for users, messages, and sessions

### Key Architectural Concepts

1. **Zero-Knowledge Architecture**: Server cannot decrypt user messages - all encryption/decryption happens client-side
2. **Hybrid Cryptography**: Combines ECDH key exchange with AES-256-GCM encryption for perfect forward secrecy
3. **Message Authentication**: All messages signed with HMAC-SHA256 and include nonces for replay protection
4. **Transport Security**: HTTPS/WSS with additional encryption layer

### Core Data Flow
1. **Key Exchange**: Ephemeral ECDH keys establish shared secrets
2. **Message Creation**: Messages encrypted client-side before transmission
3. **Protocol Validation**: All messages validated for integrity, timestamp, and signature
4. **Real-time Delivery**: WebSocket connections for instant message delivery

## File Structure Guide

### Core Libraries (`src/lib/`)
- `protocol.ts` - LWP protocol implementation and message handling
- `crypto.ts` - All cryptographic operations (encryption, signing, hashing)
- `auth.ts` - Authentication service with JWT and session management
- `security.ts` - Security utilities and input validation
- `storage.ts` - Encrypted storage abstraction layer
- `client.ts` - API client with authentication
- `middleware.ts` - Security middleware for API routes

### API Routes (`src/pages/api/`)
- `auth/` - Registration, login, token refresh endpoints
- `messages/` - Send, inbox, and individual message endpoints
- `users/` - User profile and public key lookup endpoints
- `ws.ts` - WebSocket connection handler

### Components (`src/components/`)
- `auth/` - Authentication forms (LoginForm)
- `chat/` - Real-time chat interface components
- `ui/` - Reusable UI components

### Types (`src/types/`)
- `protocol.ts` - Core protocol interfaces (LWPMessage, KeyPair, EncryptedData)
- `api.ts` - API request/response types

## Configuration

### Environment Variables
Required for development and production:
- `JWT_SECRET` - 256-bit secret for JWT signing
- `ENCRYPTION_KEY` - 32-byte hex key for storage encryption

### TypeScript Paths
The project uses path aliases configured in `tsconfig.json`:
- `@/*` → `./src/*`
- `@/types/*` → `./src/types/*`
- `@/lib/*` → `./src/lib/*`
- `@/components/*` → `./src/components/*`
- `@/pages/*` → `./src/pages/*`

### Testing Setup
- Jest configuration in `jest.config.js` with Next.js integration
- Test setup in `jest.setup.js` with mocked environment variables and WebSocket/fetch globals
- Security tests in `__tests__/security.test.ts` covering cryptography, validation, and protocol security

## Security Considerations

This codebase implements defensive security measures only. When working with this code:

1. **Cryptography**: Uses established algorithms (AES-256-GCM, ECDH, HMAC-SHA256)
2. **Input Validation**: All user inputs validated before processing
3. **Rate Limiting**: API endpoints protected against abuse
4. **Session Security**: Secure JWT implementation with proper expiration
5. **Anti-Replay**: Nonce-based protection against message replay attacks

All cryptographic operations are handled by the `SecureCrypto` class which provides secure defaults and proper implementation of cryptographic primitives.
# Environment Variables Configuration

This file documents all the environment variables needed for LuminaWeb Protocol.

## Required Environment Variables

Create a `.env.local` file in the root directory with these variables:

```bash
# Convex Database Configuration
CONVEX_DEPLOYMENT="your-convex-deployment-name"
NEXT_PUBLIC_CONVEX_URL="https://your-convex-deployment.convex.cloud"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-256-bit-better-auth-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="your-32-byte-encryption-key-in-hex"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# LuminaWeb Domain Configuration
LUMINAWEB_DOMAIN="luminaweb.app"

# Development Environment
NODE_ENV="development"
```

## Environment Variable Details

### `BETTER_AUTH_SECRET`
- **Purpose**: Used for better-auth and JWT token signing
- **Format**: 256-bit random string (64 hex characters)
- **Example**: Generate with `openssl rand -hex 32`

### `ENCRYPTION_KEY`
- **Purpose**: Used for encrypting stored data and private keys
- **Format**: 32-byte hex string (64 hex characters)
- **Example**: Generate with `openssl rand -hex 32`

### `CONVEX_DEPLOYMENT`
- **Purpose**: Convex deployment name
- **Format**: String identifier for your Convex deployment
- **Example**: `luminaweb-production-123`

### `NEXT_PUBLIC_CONVEX_URL`
- **Purpose**: Public URL for Convex client connection
- **Format**: `https://deployment-name.convex.cloud`
- **Example**: `https://luminaweb-production-123.convex.cloud`

### `BETTER_AUTH_URL`
- **Purpose**: Base URL for better-auth
- **Development**: `http://localhost:3000`
- **Production**: Your deployed domain

### `NEXT_PUBLIC_APP_URL` & `NEXT_PUBLIC_API_URL`
- **Purpose**: Public URLs accessible from the client-side
- **Development**: `http://localhost:3000`
- **Production**: Your deployed domain

### `LUMINAWEB_DOMAIN`
- **Purpose**: Domain used for generating user email addresses
- **Development**: `luminaweb.app`
- **Production**: `luminaweb.app`

### `SENDGRID_API_KEY` (Optional)
- **Purpose**: API key for SendGrid email service
- **Development**: Leave empty to use console logging
- **Production**: Your SendGrid API key for sending actual emails

### `EMAIL_FROM_NAME` (Optional)
- **Purpose**: Display name for outgoing emails
- **Default**: `LuminaWeb`

## Quick Setup

### Development Template
Create `.env.local` with these values for development:
```bash
# Convex Database Configuration
CONVEX_DEPLOYMENT="your-dev-deployment-name"
NEXT_PUBLIC_CONVEX_URL="https://your-dev-deployment.convex.cloud"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-256-bit-better-auth-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="your-32-byte-encryption-key-in-hex"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# LuminaWeb Domain Configuration
LUMINAWEB_DOMAIN="luminaweb.app"

# Development Environment
NODE_ENV="development"
```

### Production Template (for luminaweb.app)
```bash
# Convex Database Configuration
CONVEX_DEPLOYMENT="luminaweb-production"
NEXT_PUBLIC_CONVEX_URL="https://luminaweb-production.convex.cloud"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-256-bit-better-auth-secret-key"
BETTER_AUTH_URL="https://luminaweb.app"

# Encryption
ENCRYPTION_KEY="your-32-byte-encryption-key-in-hex"

# Application URLs
NEXT_PUBLIC_APP_URL="https://luminaweb.app"
NEXT_PUBLIC_API_URL="https://luminaweb.app"

# LuminaWeb Domain Configuration
LUMINAWEB_DOMAIN="luminaweb.app"

# Production Environment
NODE_ENV="production"
```

### Generate Secure Keys
```bash
# Generate BETTER_AUTH_SECRET
openssl rand -hex 32

# Generate ENCRYPTION_KEY  
openssl rand -hex 32
```

## Production Deployment

For Vercel deployment, set these environment variables in your project settings:
- `BETTER_AUTH_SECRET`
- `ENCRYPTION_KEY`
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `LUMINAWEB_DOMAIN`
- `SENDGRID_API_KEY` (optional)

## Security Notes

- Never commit `.env.local` or any environment files to version control
- Use strong, randomly generated values for all secrets
- Rotate keys regularly in production
- Use different keys for development and production environments
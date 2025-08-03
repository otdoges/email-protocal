# Environment Variables Configuration

This file documents all the environment variables needed for LuminaWeb Protocol.

## Required Environment Variables

Create a `.env.local` file in the root directory with these variables:

```bash
# Database Configuration
DATABASE_URL="your-database-connection-string"

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

### `DATABASE_URL`
- **Purpose**: Database connection string
- **Format**: Database-specific connection string
- **Examples**: 
  - PostgreSQL: `postgresql://user:password@localhost:5432/luminaweb`
  - SQLite: `file:./luminaweb.db`

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

## Quick Setup

### Development Template
Create `.env.local` with these values for development:
```bash
# Database Configuration
DATABASE_URL="file:./luminaweb.db"

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
# Database Configuration
DATABASE_URL="your-production-database-connection-string"

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
- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `LUMINAWEB_DOMAIN`

## Security Notes

- Never commit `.env.local` or any environment files to version control
- Use strong, randomly generated values for all secrets
- Rotate keys regularly in production
- Use different keys for development and production environments
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService, JWTPayload } from './auth';
import { SecurityUtils } from './security';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
  sessionId?: string;
}

export type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

SecurityUtils.createRateLimiter('auth', {
  points: 5,
  duration: 900 // 15 minutes
});

SecurityUtils.createRateLimiter('api', {
  points: 100,
  duration: 60 // 1 minute
});

SecurityUtils.createRateLimiter('messages', {
  points: 10,
  duration: 60 // 1 minute
});

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Missing or invalid authorization header'
        });
      }

      const token = authHeader.substring(7);
      const verification = await AuthService.verifyToken(token);

      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          error: verification.message || 'Invalid token'
        });
      }

      req.user = verification.payload;
      req.sessionId = verification.payload?.jti;

      return handler(req, res);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };
}

export function withRateLimit(type: 'auth' | 'api' | 'messages' = 'api') {
  return function(handler: ApiHandler): ApiHandler {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        const identifier = getClientIdentifier(req);
        const canProceed = await SecurityUtils.checkRateLimit(type, identifier);

        if (!canProceed) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded'
          });
        }

        return handler(req, res);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Rate limiting error'
        });
      }
    };
  };
}

export function withSecurity(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return handler(req, res);
  };
}

export function withValidation(schema: any) {
  return function(handler: ApiHandler): ApiHandler {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      try {
        const { error } = schema.validate(req.body);
        
        if (error) {
          return res.status(400).json({
            success: false,
            error: error.details[0].message
          });
        }

        return handler(req, res);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation error'
        });
      }
    };
  };
}

export function withCORS(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'https://yourdomain.vercel.app'
    ];

    if (allowedOrigins.includes(origin || '')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return handler(req, res);
  };
}

export function compose(...middlewares: Array<(handler: ApiHandler) => ApiHandler>) {
  return function(handler: ApiHandler): ApiHandler {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

export function sanitizeRequestBody(req: AuthenticatedRequest): void {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = SecurityUtils.sanitizeInput(req.body[key]);
      }
    }
  }
}

export function validateMethodAllowed(allowedMethods: string[]) {
  return function(handler: ApiHandler): ApiHandler {
    return async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!allowedMethods.includes(req.method || '')) {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
      }

      return handler(req, res);
    };
  };
}

function getClientIdentifier(req: AuthenticatedRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.toString().split(',')[0] : req.connection.remoteAddress;
  return ip || 'unknown';
}

export function handleApiError(error: any, res: NextApiResponse): void {
  console.error('API Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
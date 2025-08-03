import { NextApiRequest, NextApiResponse } from 'next';
import { 
  withSecurity, 
  withCORS,
  validateMethodAllowed,
  compose
} from '../../lib/middleware';

async function healthHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { detailed } = req.query;

    if (detailed === 'true') {
      // Return detailed health information
      return res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
          encryption: 'AES-256-CBC + HMAC',
          authentication: 'Better Auth + Legacy JWT',
          transport: 'HTTPS + WSS',
          database: 'Convex + Legacy Storage',
          rateLimit: 'Active',
          validation: 'Comprehensive'
        }
      });
    }

    // Basic health check
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
}

export default compose(
  withSecurity,
  withCORS,
  validateMethodAllowed(['GET'])
)(healthHandler);
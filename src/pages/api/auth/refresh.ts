import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/auth';
import { 
  withSecurity, 
  withRateLimit, 
  withCORS, 
  validateMethodAllowed,
  compose,
  sanitizeRequestBody,
  handleApiError
} from '../../../lib/middleware';

async function refreshHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    sanitizeRequestBody(req);
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await AuthService.refreshToken(refreshToken);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.status(200).json({
      success: true,
      data: {
        tokens: result.tokens
      }
    });
  } catch (error) {
    handleApiError(error, res);
  }
}

export default compose(
  withSecurity,
  withCORS,
  withRateLimit('auth'),
  validateMethodAllowed(['POST'])
)(refreshHandler);
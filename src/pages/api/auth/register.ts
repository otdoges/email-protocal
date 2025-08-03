import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/auth';
import { SecurityUtils } from '../../../lib/security';
import { 
  withSecurity, 
  withRateLimit, 
  withCORS, 
  validateMethodAllowed,
  compose,
  sanitizeRequestBody,
  handleApiError
} from '../../../lib/middleware';

async function registerHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    sanitizeRequestBody(req);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (!SecurityUtils.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const result = await AuthService.register(email, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
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
)(registerHandler);
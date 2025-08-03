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

async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
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

    const result = await AuthService.login(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        tokens: result.tokens,
        encryptedPrivateKey: result.encryptedPrivateKey
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
)(loginHandler);
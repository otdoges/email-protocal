import { NextApiRequest, NextApiResponse } from 'next';
import { SecureStorage } from '../../../../lib/storage';
import { SecurityUtils } from '../../../../lib/security';
import { 
  withAuth,
  withSecurity, 
  withRateLimit, 
  withCORS, 
  validateMethodAllowed,
  compose,
  handleApiError,
  AuthenticatedRequest
} from '../../../../lib/middleware';

async function publicKeyHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!SecurityUtils.validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const publicKey = await SecureStorage.getUserPublicKey(email);
    
    if (!publicKey) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        email,
        publicKey
      }
    });
  } catch (error) {
    handleApiError(error, res);
  }
}

export default compose(
  withSecurity,
  withCORS,
  withAuth,
  withRateLimit('api'),
  validateMethodAllowed(['GET'])
)(publicKeyHandler);
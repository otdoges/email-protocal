import { NextApiRequest, NextApiResponse } from 'next';
import { SecureStorage } from '../../../lib/storage';
import { 
  withAuth,
  withSecurity, 
  withRateLimit, 
  withCORS, 
  validateMethodAllowed,
  compose,
  handleApiError,
  AuthenticatedRequest
} from '../../../lib/middleware';

async function profileHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await SecureStorage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        publicKey: user.publicKey,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        isOnline: user.isOnline
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
)(profileHandler);
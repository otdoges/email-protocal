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

async function inboxHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const inboxData = await SecureStorage.getInbox(userEmail, limit);

    res.status(200).json({
      success: true,
      data: inboxData
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
)(inboxHandler);
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

async function messageHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    const messageId = req.query.id as string;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    if (req.method === 'GET') {
      const message = await SecureStorage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      await SecureStorage.markAsRead(messageId);

      res.status(200).json({
        success: true,
        data: {
          id: messageId,
          ...message
        }
      });
    } else if (req.method === 'DELETE') {
      const deleted = await SecureStorage.deleteMessage(messageId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    }
  } catch (error) {
    handleApiError(error, res);
  }
}

export default compose(
  withSecurity,
  withCORS,
  withAuth,
  withRateLimit('api'),
  validateMethodAllowed(['GET', 'DELETE'])
)(messageHandler);
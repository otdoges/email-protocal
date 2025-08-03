import { NextApiRequest, NextApiResponse } from 'next';
import { SecureStorage } from '../../../lib/storage';
import { LuminaWebProtocol } from '../../../lib/protocol';
import { SecurityUtils } from '../../../lib/security';
import { 
  withAuth,
  withSecurity, 
  withRateLimit, 
  withCORS, 
  validateMethodAllowed,
  compose,
  sanitizeRequestBody,
  handleApiError,
  AuthenticatedRequest
} from '../../../lib/middleware';

async function sendMessageHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    sanitizeRequestBody(req);
    
    const { to, subject, body, attachments } = req.body;
    const fromEmail = req.user?.email;

    if (!fromEmail) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'To, subject, and body are required'
      });
    }

    if (!SecurityUtils.validateEmail(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient email'
      });
    }

    const recipientPublicKey = await SecureStorage.getUserPublicKey(to);
    if (!recipientPublicKey) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    const messagePayload = {
      subject: SecurityUtils.sanitizeInput(subject),
      body: SecurityUtils.sanitizeInput(body),
      attachments: attachments || [],
      threadId: req.body.threadId,
      replyTo: req.body.replyTo
    };

    const messageId = await SecureStorage.storeMessage(fromEmail, to, messagePayload);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId,
        timestamp: new Date().toISOString()
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
  withRateLimit('messages'),
  validateMethodAllowed(['POST'])
)(sendMessageHandler);
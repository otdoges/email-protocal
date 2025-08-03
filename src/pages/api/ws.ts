import { NextApiRequest } from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { AuthService } from '../../lib/auth';
import { SecureStorage } from '../../lib/storage';
import { SecurityUtils } from '../../lib/security';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  email?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'auth' | 'message' | 'presence' | 'ping' | 'pong' | 'error';
  data: any;
  timestamp: string;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  initialize(server: any) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ 
      server,
      path: '/api/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
  }

  private verifyClient(info: any): boolean {
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) return false;

    try {
      AuthService.verifyToken(token);
      return true;
    } catch {
      return false;
    }
  }

  private async handleConnection(ws: ExtendedWebSocket, req: any) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const verification = await AuthService.verifyToken(token);
      
      if (!verification.valid || !verification.payload) {
        ws.close(1008, 'Invalid token');
        return;
      }

      ws.userId = verification.payload.userId;
      ws.email = verification.payload.email;
      ws.isAlive = true;

      this.clients.set(verification.payload.userId, ws);

      await SecureStorage.updateUserPresence(verification.payload.userId, true);

      this.broadcastPresence(verification.payload.email, 'online');

      ws.on('message', (data) => this.handleMessage(ws, data));
      ws.on('close', () => this.handleDisconnection(ws));
      ws.on('pong', () => { ws.isAlive = true; });

      this.sendMessage(ws, {
        type: 'auth',
        data: { status: 'authenticated', userId: ws.userId },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      ws.close(1011, 'Authentication failed');
    }
  }

  private async handleMessage(ws: ExtendedWebSocket, data: any) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      if (!this.validateMessage(message)) {
        this.sendError(ws, 'Invalid message format');
        return;
      }

      switch (message.type) {
        case 'presence':
          await this.handlePresenceUpdate(ws, message.data);
          break;
        case 'ping':
          this.sendMessage(ws, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
          });
          break;
        default:
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      this.sendError(ws, 'Failed to process message');
    }
  }

  private validateMessage(message: any): message is WebSocketMessage {
    return (
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      message.data !== undefined &&
      typeof message.timestamp === 'string' &&
      SecurityUtils.isValidTimestamp(message.timestamp)
    );
  }

  private async handlePresenceUpdate(ws: ExtendedWebSocket, data: any) {
    if (!ws.userId || !ws.email) return;

    const { status } = data;
    if (!['online', 'away', 'busy'].includes(status)) return;

    await SecureStorage.updateUserPresence(ws.userId, status === 'online');
    this.broadcastPresence(ws.email, status);
  }

  private async handleDisconnection(ws: ExtendedWebSocket) {
    if (ws.userId) {
      this.clients.delete(ws.userId);
      await SecureStorage.updateUserPresence(ws.userId, false);
      
      if (ws.email) {
        this.broadcastPresence(ws.email, 'offline');
      }
    }
  }

  private broadcastPresence(email: string, status: string) {
    const presenceMessage: WebSocketMessage = {
      type: 'presence',
      data: { email, status },
      timestamp: new Date().toISOString()
    };

    this.broadcast(presenceMessage);
  }

  private sendMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: ExtendedWebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      data: { error },
      timestamp: new Date().toISOString()
    } as WebSocketMessage);
  }

  public notifyNewMessage(recipientEmail: string, messageData: any) {
    const recipient = Array.from(this.clients.values())
      .find(client => client.email === recipientEmail);

    if (recipient) {
      this.sendMessage(recipient, {
        type: 'message',
        data: messageData,
        timestamp: new Date().toISOString()
      });
    }
  }

  private broadcast(message: WebSocketMessage, excludeUserId?: string) {
    this.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, userId) => {
        if (!client.isAlive) {
          client.terminate();
          this.clients.delete(userId);
          return;
        }

        client.isAlive = false;
        client.ping();
      });
    }, 30000); // 30 seconds
  }

  public stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.close();
    });

    if (this.wss) {
      this.wss.close();
    }
  }
}

export default function handler(req: NextApiRequest, res: any) {
  if (req.method === 'GET') {
    res.status(426).json({
      success: false,
      error: 'Upgrade to WebSocket required'
    });
    return;
  }

  res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

export { WebSocketManager };
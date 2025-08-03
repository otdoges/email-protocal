'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import MessageList from './MessageList';
import ComposeMessage from './ComposeMessage';
import Sidebar from './Sidebar';

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  threadId?: string;
  attachments?: any[];
}

export default function ChatInterface() {
  const { user, client, logout } = useAuth();
  const { isConnected, lastMessage, connectionState } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'message':
        // New message received
        loadMessages(); // Refresh the message list
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `From: ${message.data.from}`,
            icon: '/favicon.ico'
          });
        }
        break;
      case 'presence':
        // User presence update
        const { email, status } = message.data;
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (status === 'online') {
            newSet.add(email);
          } else {
            newSet.delete(email);
          }
          return newSet;
        });
        break;
      case 'auth':
        console.log('WebSocket authenticated');
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await client.getInbox(50);
      
      if (result.success && result.data) {
        setMessages(result.data.messages);
        setUnreadCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (to: string, subject: string, body: string) => {
    try {
      const result = await client.sendMessage(to, subject, body);
      
      if (result.success) {
        setIsComposing(false);
        await loadMessages();
      } else {
        alert('Failed to send message: ' + result.error);
      }
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const result = await client.deleteMessage(messageId);
      
      if (result.success) {
        setMessages(messages.filter(m => m.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        user={user}
        unreadCount={unreadCount}
        isConnected={isConnected}
        connectionState={connectionState}
        onlineUsers={onlineUsers}
        onCompose={() => setIsComposing(true)}
        onRefresh={loadMessages}
        onLogout={logout}
      />
      
      <div className="flex-1 flex">
        <MessageList
          messages={messages}
          selectedMessage={selectedMessage}
          onSelectMessage={setSelectedMessage}
          onDeleteMessage={handleDeleteMessage}
          onRefresh={loadMessages}
        />
        
        <div className="flex-1 flex flex-col">
          {isComposing ? (
            <ComposeMessage
              onSend={handleSendMessage}
              onCancel={() => setIsComposing(false)}
            />
          ) : selectedMessage ? (
            <MessageView
              message={selectedMessage}
              onReply={() => setIsComposing(true)}
              onDelete={() => handleDeleteMessage(selectedMessage.id)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">LuminaWeb</h3>
                <p>Select a message to read or compose a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageView({ 
  message, 
  onReply, 
  onDelete 
}: { 
  message: Message; 
  onReply: () => void; 
  onDelete: () => void; 
}) {
  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{message.subject}</h2>
            <p className="text-sm text-gray-600">
              From: {message.from} • {new Date(message.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onReply}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Reply
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-900">
            {message.body}
          </div>
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
            <div className="space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{attachment.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
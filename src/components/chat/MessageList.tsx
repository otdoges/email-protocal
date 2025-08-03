'use client';

import React from 'react';

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

interface MessageListProps {
  messages: Message[];
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onRefresh: () => void;
}

export default function MessageList({
  messages,
  selectedMessage,
  onSelectMessage,
  onDeleteMessage,
  onRefresh
}: MessageListProps) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p>No messages yet</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => onSelectMessage(message)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedMessage?.id === message.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                } ${!message.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm font-medium text-gray-900 truncate ${
                        !message.isRead ? 'font-bold' : ''
                      }`}>
                        {message.from}
                      </p>
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className={`text-sm text-gray-900 truncate mt-1 ${
                      !message.isRead ? 'font-semibold' : ''
                    }`}>
                      {truncateText(message.subject, 30)}
                    </p>
                    
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {truncateText(message.body, 50)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {formatDate(message.timestamp)}
                      </p>
                      
                      <div className="flex items-center space-x-1">
                        {message.attachments && message.attachments.length > 0 && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMessage(message.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Delete message"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
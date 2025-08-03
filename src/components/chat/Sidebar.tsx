'use client';

import React from 'react';

interface User {
  id: string;
  email: string;
  publicKey: string;
}

interface SidebarProps {
  user: User | null;
  unreadCount: number;
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  onlineUsers: Set<string>;
  onCompose: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  user, 
  unreadCount,
  isConnected,
  connectionState,
  onlineUsers,
  onCompose, 
  onRefresh, 
  onLogout 
}: SidebarProps) {
  return (
    <div className="w-64 bg-indigo-800 text-white flex flex-col">
      <div className="p-4 border-b border-indigo-700">
        <h1 className="text-xl font-bold">LuminaWeb</h1>
        <div className="flex items-center justify-between">
          <p className="text-indigo-200 text-sm">Ultra-secure protocol</p>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 
              connectionState === 'connecting' ? 'bg-yellow-400' : 
              connectionState === 'error' ? 'bg-red-400' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs text-indigo-200">
              {isConnected ? 'Live' : 
               connectionState === 'connecting' ? 'Connecting' : 
               connectionState === 'error' ? 'Error' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={onCompose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Compose</span>
        </button>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={onRefresh}
              className="w-full flex items-center space-x-3 text-indigo-100 hover:text-white hover:bg-indigo-700 rounded-md px-3 py-2 text-sm font-medium text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span>Inbox</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </li>
          
          <li>
            <div className="flex items-center space-x-3 text-indigo-100 px-3 py-2 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sent</span>
            </div>
          </li>
          
          <li>
            <div className="flex items-center space-x-3 text-indigo-100 px-3 py-2 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Trash</span>
            </div>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-indigo-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.email}
            </p>
            <p className="text-xs text-indigo-200">Online</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-xs text-indigo-200">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>End-to-end encrypted</span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-indigo-200">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Zero-knowledge</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 text-indigo-200 hover:text-white hover:bg-indigo-700 rounded-md px-3 py-2 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
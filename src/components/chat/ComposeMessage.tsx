'use client';

import React, { useState } from 'react';

interface ComposeMessageProps {
  onSend: (to: string, subject: string, body: string) => void;
  onCancel: () => void;
  replyTo?: string;
  replySubject?: string;
}

export default function ComposeMessage({ 
  onSend, 
  onCancel, 
  replyTo = '', 
  replySubject = '' 
}: ComposeMessageProps) {
  const [to, setTo] = useState(replyTo);
  const [subject, setSubject] = useState(replySubject);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to.trim() || !subject.trim() || !body.trim()) {
      return;
    }

    setSending(true);
    try {
      await onSend(to.trim(), subject.trim(), body.trim());
    } finally {
      setSending(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = to.trim() && validateEmail(to.trim()) && subject.trim() && body.trim();

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Compose Message</h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="compose-form"
              disabled={!isFormValid || sending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>

      <form id="compose-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="px-6 py-4 space-y-4 border-b">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="email"
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                to && !validateEmail(to) ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="recipient@luminaweb.app"
              required
            />
            {to && !validateEmail(to) && (
              <p className="text-red-600 text-sm mt-1">Please enter a valid email address</p>
            )}
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter subject"
              required
            />
          </div>
        </div>

        <div className="flex-1 px-6 py-4">
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full resize-none border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 p-3"
            placeholder="Type your message here..."
            required
          />
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Characters: {body.length}</span>
              {body.length > 5000 && (
                <span className="text-orange-600">Long message</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-green-600 font-medium">End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
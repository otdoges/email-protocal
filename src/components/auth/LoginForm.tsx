'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  isRegisterMode: boolean;
}

export default function LoginForm({ onToggleMode, isRegisterMode }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login, register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isRegisterMode && password !== confirmPassword) {
      return;
    }

    const success = isRegisterMode 
      ? await register(email, password)
      : await login(email, password);

    if (success) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            LuminaWeb - Ultra-secure email protocol
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
                  isRegisterMode ? '' : 'rounded-b-md'
                } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
              />
            </div>
            
            {isRegisterMode && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm password"
                  />
                </div>
                
                {password && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Password strength:</span>
                      <span className={getStrengthColor(passwordStrength)}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength, true)}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {confirmPassword && password !== confirmPassword && (
                  <div className="mt-2 text-red-600 text-sm">
                    Passwords do not match
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || (isRegisterMode && password !== confirmPassword)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRegisterMode ? 'Creating account...' : 'Signing in...'}
                </div>
              ) : (
                isRegisterMode ? 'Create Account' : 'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              {isRegisterMode 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;
  return Math.min(score, 5);
}

function getStrengthText(strength: number): string {
  switch (strength) {
    case 0: case 1: return 'Very Weak';
    case 2: return 'Weak';
    case 3: return 'Fair';
    case 4: return 'Good';
    case 5: return 'Strong';
    default: return 'Unknown';
  }
}

function getStrengthColor(strength: number, isBackground?: boolean): string {
  const bgColors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const textColors = ['text-red-600', 'text-red-500', 'text-yellow-600', 'text-blue-600', 'text-green-600'];
  
  if (strength === 0) return isBackground ? 'bg-gray-300' : 'text-gray-500';
  return isBackground ? bgColors[strength - 1] : textColors[strength - 1];
}
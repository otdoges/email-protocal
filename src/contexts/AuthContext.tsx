'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LuminaWebClient } from '../lib/client';

interface User {
  id: string;
  email: string;
  publicKey: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  client: LuminaWebClient;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  client: new LuminaWebClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    enableEncryption: true
  })
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const storedUser = localStorage.getItem('luminaweb_user');
    const storedTokens = localStorage.getItem('luminaweb_tokens');
    
    if (storedUser && storedTokens) {
      try {
        const user = JSON.parse(storedUser);
        const tokens = JSON.parse(storedTokens);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch (error) {
        localStorage.removeItem('luminaweb_user');
        localStorage.removeItem('luminaweb_tokens');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const result = await state.client.login(email, password);

      if (result.success && result.data) {
        const user = result.data.user;
        
        localStorage.setItem('luminaweb_user', JSON.stringify(user));
        localStorage.setItem('luminaweb_tokens', JSON.stringify(result.data.tokens));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: result.error || 'Login failed' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Network error' });
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const result = await state.client.register(email, password);

      if (result.success && result.data) {
        const user = result.data.user;
        
        localStorage.setItem('luminaweb_user', JSON.stringify(user));
        localStorage.setItem('luminaweb_tokens', JSON.stringify(result.data.tokens));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: result.error || 'Registration failed' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Network error' });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('luminaweb_user');
    localStorage.removeItem('luminaweb_tokens');
    state.client.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
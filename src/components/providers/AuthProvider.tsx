'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  emailVerified?: boolean;
  image?: string | null;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        const user = session.data?.user;
        if (user) {
          setUser({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toString(),
            emailVerified: user.emailVerified,
            image: user.image,
            updatedAt: user.updatedAt?.toString(),
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signOut = async () => {
    try {
      await authClient.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser() {
  const { user, isLoading } = useAuth();
  return { data: user, isLoading };
}
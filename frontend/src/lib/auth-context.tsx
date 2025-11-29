'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, User } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('capaz_token');
    if (savedToken) {
      auth.me(savedToken)
        .then(({ user }) => {
          setUser(user);
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem('capaz_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { user, token } = await auth.login(email, password);
    localStorage.setItem('capaz_token', token);
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem('capaz_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}


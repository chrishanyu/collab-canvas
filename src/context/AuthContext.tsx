import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import {
  registerUser as register,
  loginUser as login,
  logoutUser as logout,
  onAuthStateChange,
  mapFirebaseUserToUser,
} from '../services/auth.service';
import { AuthContext } from './authContextDefinition';
import type { AuthContextType } from './authContextDefinition';

export { AuthContext };
export type { AuthContextType };

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(mapFirebaseUserToUser(firebaseUser));
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const handleRegister = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await register(email, password, displayName);
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await login(email, password);
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log in';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setError(null);
      await logout();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log out';
      setError(message);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


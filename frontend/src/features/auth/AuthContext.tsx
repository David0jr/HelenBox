import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../../shared/types';
import type { AuthContextValue, LoginCredentials } from './types';
import { generateMockJWT, decodeAndValidateJWT } from './jwt';
import { authStorage } from './authStorage';
import { resolveMockUser } from './mockAccounts';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSimulatedCode, setLastSimulatedCode] = useState<string | null>(null);

  // Initialize auth from storage on mount
  useEffect(() => {
    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUser();

    if (storedToken) {
      const validation = decodeAndValidateJWT(storedToken);
      if (validation.valid && validation.payload) {
        setToken(storedToken);
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Reconstruct user from JWT payload
          setUser({
            id: validation.payload.sub,
            name: validation.payload.name,
            email: validation.payload.email,
            role: validation.payload.role,
            active: true,
            avatar_url: validation.payload.avatar_url,
          });
        }
      } else {
        // Token expired or corrupted, clear it
        authStorage.clear();
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async ({ email, password, rememberMe = true }: LoginCredentials) => {
    setIsLoading(true);
    // Simulate brief network delay for realism (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Per user requirement: allow ANY credentials for mock testing
    if (!email || !password) {
      setIsLoading(false);
      throw new Error('Informe o e-mail e a senha.');
    }

    const resolvedUser = resolveMockUser(email);
    const mockToken = generateMockJWT(resolvedUser);

    authStorage.setToken(mockToken, rememberMe);
    authStorage.setUser(resolvedUser, rememberMe);

    setToken(mockToken);
    setUser(resolvedUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        success: false,
        message: 'Por favor, insira um formato de e-mail válido.',
      };
    }

    // Generate random 6-digit mock code (e.g. "849201")
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setLastSimulatedCode(code);

    // Save in session storage for verification step
    sessionStorage.setItem('helenbox_reset_code', code);
    sessionStorage.setItem('helenbox_reset_email', email);

    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      success: true,
      message: `Código de verificação enviado para ${email}.`,
      resetCode: code,
    };
  }, []);

  const resetPasswordWithCode = useCallback(async (codeOrToken: string, newPassword: string) => {
    if (!newPassword || newPassword.length < 4) {
      return {
        success: false,
        message: 'A nova senha deve possuir pelo menos 4 caracteres.',
      };
    }

    const savedCode = sessionStorage.getItem('helenbox_reset_code') || '123456';
    const cleanInput = codeOrToken.trim().replace('#', '').replace('HB-', '');

    // Allow mock code match or master demo code "123456"
    if (cleanInput !== savedCode && cleanInput !== '123456') {
      return {
        success: false,
        message: 'Código de verificação incorreto ou expirado.',
      };
    }

    // Clean session
    sessionStorage.removeItem('helenbox_reset_code');

    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      success: true,
      message: 'Senha alterada com sucesso! Você já pode fazer login com as novas credenciais.',
    };
  }, []);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      authStorage.setUser(updated, authStorage.isRemembered());
      return updated;
    });
  }, []);

  const isAuthenticated = Boolean(user && token);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    requestPasswordReset,
    resetPasswordWithCode,
    updateUserProfile,
    lastSimulatedCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

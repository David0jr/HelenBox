import type { User, UserRole } from '../../shared/types';

export interface JwtHeader {
  alg: string;
  typ: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordSubmit {
  codeOrToken: string;
  newPassword: string;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; resetCode?: string }>;
  resetPasswordWithCode: (codeOrToken: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (updates: Partial<User>) => void;
  lastSimulatedCode: string | null;
}

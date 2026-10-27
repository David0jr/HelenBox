import type { User } from '../../shared/types';

const TOKEN_KEY = 'helenbox_jwt_token';
const USER_KEY = 'helenbox_auth_user';
const REMEMBER_KEY = 'helenbox_remember_me';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, rememberMe = true): void {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(REMEMBER_KEY);
    }
  },

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setUser(user: User, rememberMe = true): void {
    const serialized = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(USER_KEY, serialized);
    } else {
      sessionStorage.setItem(USER_KEY, serialized);
    }
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  isRemembered(): boolean {
    return localStorage.getItem(REMEMBER_KEY) === 'true';
  },
};

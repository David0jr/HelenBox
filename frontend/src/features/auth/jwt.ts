import type { User } from '../../shared/types';
import type { JwtHeader, JwtPayload } from './types';

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Generates a realistic mock JWT token for HelenBox WMS.
 * Structured as `header.payload.signature` following RFC 7519 standard.
 */
export function generateMockJWT(user: User, expiresInMinutes = 60 * 24): string {
  const header: JwtHeader = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + expiresInMinutes * 60;

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url,
    iss: 'helenbox-auth-service',
    aud: 'helenbox-wms-client',
    iat: nowSeconds,
    exp: expSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Generate a mock signature based on header and payload
  const mockSignatureInput = `${encodedHeader}.${encodedPayload}.helenbox_secret_key_2026`;
  const encodedSignature = base64UrlEncode(mockSignatureInput).slice(0, 43);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Decodes and validates a mock JWT token.
 * Returns decoded payload if valid and not expired, null otherwise.
 */
export function decodeAndValidateJWT(token: string): { valid: boolean; payload: JwtPayload | null; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, payload: null, error: 'Token não fornecido' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, payload: null, error: 'Formato JWT inválido (esperado header.payload.signature)' };
  }

  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload: JwtPayload = JSON.parse(payloadJson);

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      return { valid: false, payload, error: 'Token JWT expirado' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, payload: null, error: 'Erro ao decodificar payload JWT' };
  }
}

import type { User, UserRole } from '../../shared/types';

export interface DemoAccount {
  email: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  description: string;
  avatar_url: string;
  defaultPassword: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@helencolor.com.br',
    name: 'David HelenBox (Admin)',
    role: 'ADMIN',
    roleLabel: 'Administrador Master',
    description: 'Acesso irrestrito a todos os módulos, relatórios fiscais e gestão de equipe',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    defaultPassword: 'admin',
  },
  {
    email: 'operador@helencolor.com.br',
    name: 'Carlos Oliveira',
    role: 'OPERATOR',
    roleLabel: 'Operador de Galpão',
    description: 'Acesso a Bipagem/Picking, Movimentações e Realocação de Paletes',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    defaultPassword: '123',
  },
  {
    email: 'conferente@helencolor.com.br',
    name: 'Mariana Costa',
    role: 'VIEWER',
    roleLabel: 'Conferente & Auditoria',
    description: 'Conferência visual de Invoices CN, Catálogo de Produtos e Logs',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    defaultPassword: '123',
  },
];

/**
 * Resolves or creates a mock user from supplied email.
 * Per user instructions: allows any credentials, perfectly preparing the app for Supabase integration.
 */
export function resolveMockUser(email: string, name?: string): User {
  const normalizedEmail = email.toLowerCase().trim();
  const found = DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalizedEmail);

  if (found) {
    return {
      id: `user-${found.role.toLowerCase()}`,
      name: found.name,
      email: found.email,
      role: found.role,
      active: true,
      avatar_url: found.avatar_url,
      created_at: '2026-01-15T08:00:00Z',
    };
  }

  // Generate a friendly name if not provided
  let generatedName = name;
  if (!generatedName) {
    const userPart = normalizedEmail.split('@')[0] || 'Usuário';
    generatedName = userPart
      .split(/[._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return {
    id: `user-${Date.now()}`,
    name: generatedName,
    email: normalizedEmail,
    role: 'ADMIN', // Default to admin access in mock mode for flexibility
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString(),
  };
}

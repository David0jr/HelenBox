import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  Volume2,
  Moon,
  Sun,
  Lock,
  Check,
  Camera,
} from 'lucide-react';
import type { User } from '../shared/types';
import { BackButton } from '../shared/ui/BackButton';

import { useAuth } from '../features/auth';
import { useApp } from '../app/context/AppContext';

interface SettingsPageProps {
  currentUser?: User;
  onUpdateUser?: (updated: Partial<User>) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onGoBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser: propUser,
  onUpdateUser: propOnUpdateUser,
  theme: propTheme,
  onToggleTheme: propOnToggleTheme,
  onGoBack,
}) => {
  const { user: authUser, updateUserProfile } = useAuth();
  const appContext = useApp();

  const currentUser: User = propUser || authUser || {
    id: 'user-admin',
    name: 'David HelenBox (Admin)',
    email: 'admin@helencolor.com.br',
    role: 'ADMIN',
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  };
  const onUpdateUser = propOnUpdateUser || updateUserProfile;
  const theme = propTheme || appContext.theme;
  const onToggleTheme = propOnToggleTheme || appContext.toggleTheme;

  const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [name, setName] = useState(currentUser.name);

  const [email, setEmail] = useState(currentUser.email);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name,
      email,
      avatar_url: avatarUrl,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('A nova senha e a confirmação não coincidem.');
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onGoBack && <BackButton onClick={onGoBack} />}
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Configurações da Conta
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Gerencie suas informações pessoais, preferências visuais e segurança de acesso.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveSection('profile')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSection === 'profile' ? '2px solid var(--helen-red)' : '2px solid transparent',
            color: activeSection === 'profile' ? 'var(--helen-red)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'profile' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Meu Perfil
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('preferences')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSection === 'preferences' ? '2px solid var(--helen-red)' : '2px solid transparent',
            color: activeSection === 'preferences' ? 'var(--helen-red)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'preferences' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Preferências
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('security')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeSection === 'security' ? '2px solid var(--helen-red)' : '2px solid transparent',
            color: activeSection === 'security' ? 'var(--helen-red)' : 'var(--text-secondary)',
            fontWeight: activeSection === 'security' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Segurança
        </button>
      </div>

      {/* Section 1: Profile */}
      {activeSection === 'profile' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Dados Pessoais</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Essas informações identificam suas operações de estoque e registros de auditoria.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Avatar & Role Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px',
                background: 'var(--bg-surface-hover)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt={name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--helen-red)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newUrl = prompt('Insira o link da foto de perfil:', avatarUrl);
                    if (newUrl !== null) setAvatarUrl(newUrl);
                  }}
                  title="Alterar foto de perfil"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--helen-red)',
                    color: '#ffffff',
                    border: '2px solid var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={11} />
                </button>
              </div>

              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <span className="badge badge-neutral" style={{ color: 'var(--helen-red)', borderColor: 'var(--helen-red-border)' }}>
                    Perfil: {currentUser.role}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Acesso completo ao HelenBox WMS
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  Nome Completo:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  E-mail de Login:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              {saveSuccess && (
                <span style={{ fontSize: '12.5px', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> Dados salvos com sucesso!
                </span>
              )}
              <button type="submit" className="btn btn-primary">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 2: Preferences */}
      {activeSection === 'preferences' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Preferências de Interface</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Personalize o comportamento e a aparência do sistema em seu dispositivo.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Theme Toggle Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Tema Visual
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Alterne entre o visual executivo Claro (Branco & Vermelho) e Escuro.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onToggleTheme}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                {theme === 'dark' ? 'Modo Escuro (Ativo)' : 'Modo Claro (Ativo)'}
              </button>
            </div>

            {/* Sound Toggle Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Bip Sonoro de Leitura Óptica
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Emite retorno auditivo instantâneo no leitor de código de barras durante a separação.
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--helen-red)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Security */}
      {activeSection === 'security' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Segurança de Acesso</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Atualize sua senha de operador para manter sua conta protegida.
            </p>
          </div>

          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '440px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Senha Atual:
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Nova Senha:
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Confirmar Nova Senha:
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <button type="submit" className="btn btn-primary">
                Atualizar Senha
              </button>
              {passwordSuccess && (
                <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ Senha alterada!
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

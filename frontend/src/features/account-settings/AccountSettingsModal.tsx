import React, { useState } from 'react';
import { X, User, Mail, Shield, Check, Volume2, Moon, Sun, Camera } from 'lucide-react';
import type { User as UserType } from '../../shared/types';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onUpdateUser: (updated: Partial<UserType>) => void;
  currentTheme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  currentTheme,
  onToggleTheme,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name,
      email,
      avatar_url: avatarUrl,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--helen-red-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--helen-red)',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                Minha Conta HelenBox
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Gerencie seus dados pessoais, perfil e preferências de uso
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Avatar and Role Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 14px',
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
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--helen-red)',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const newUrl = prompt('Insira o link da imagem do seu avatar:', avatarUrl);
                  if (newUrl !== null) setAvatarUrl(newUrl);
                }}
                title="Alterar foto de perfil"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'var(--helen-red)',
                  color: '#fff',
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
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    background: 'var(--helen-red-light)',
                    color: 'var(--helen-red)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Shield size={12} />
                  Perfil: {currentUser.role}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Acesso Total Autorizado
                </span>
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Nome Completo:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              E-mail de Acesso Corporativo:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            </div>
          </div>

          {/* Preferences Section */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Preferências do Operador:
            </div>

            {/* Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                {currentTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} color="#F59E0B" />}
                <span>Tema Visual do Sistema</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={onToggleTheme}
              >
                {currentTheme === 'dark' ? 'Modo Escuro (Ativo)' : 'Modo Claro (Ativo)'}
              </button>
            </div>

            {/* Sound Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                <Volume2 size={16} />
                <span>Bip Sonoro na Leitura de Código</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--helen-red)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              paddingTop: '14px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaved}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaved}>
              {isSaved ? <Check size={16} /> : null}
              {isSaved ? 'Dados Salvos!' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

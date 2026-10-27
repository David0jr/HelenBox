import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Check,
  Mail,
  User,
  Shield,
  Trash2,
  Edit2,
  Lock,
} from 'lucide-react';
import type { TeamMember, ModulePermissions, UserRole } from '../shared/types';
import { PermissionsMatrixTable } from '../features/user-permissions/PermissionsMatrixTable';
import { SYSTEM_MODULES } from '../shared/mockData';
import { BackButton } from '../shared/ui/BackButton';

import { useApp } from '../app/context/AppContext';

interface TeamPermissionsPageProps {
  teamMembers?: TeamMember[];
  onUpdateMember?: (member: TeamMember) => void;
  onAddMember?: (newMember: TeamMember) => void;
  onGoBack?: () => void;
}

export const TeamPermissionsPage: React.FC<TeamPermissionsPageProps> = ({
  teamMembers: propTeamMembers,
  onUpdateMember: propOnUpdateMember,
  onAddMember: propOnAddMember,
  onGoBack,
}) => {
  const appContext = useApp();
  const teamMembers = propTeamMembers || appContext.teamMembers;
  const onUpdateMember = propOnUpdateMember || appContext.handleUpdateMember;
  const onAddMember = propOnAddMember || appContext.handleAddMember;

  const [selectedMemberId, setSelectedMemberId] = useState<string>(teamMembers[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New member form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('OPERATOR');
  const [newPermissions, setNewPermissions] = useState<Record<string, ModulePermissions>>(() => {
    const initial: Record<string, ModulePermissions> = {};
    SYSTEM_MODULES.forEach((mod) => {
      initial[mod.key] = {
        view: true,
        create: mod.key === 'picking',
        edit_relocate: mod.key === 'warehouse',
        scan_picking: mod.key === 'picking',
        delete: false,
      };
    });
    return initial;
  });

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId) || teamMembers[0];

  const handlePermissionsChange = (updated: Record<string, ModulePermissions>) => {
    if (!selectedMember) return;
    const updatedMember: TeamMember = {
      ...selectedMember,
      permissions: updated,
    };
    onUpdateMember(updatedMember);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    const created: TeamMember = {
      id: `user-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
      active: true,
      last_login: 'Nunca',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      permissions: newPermissions,
    };

    onAddMember(created);
    setSelectedMemberId(created.id);
    setIsModalOpen(false);
    setNewName('');
    setNewEmail('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onGoBack && <BackButton onClick={onGoBack} />}
            <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Gestão de Equipe & Matriz de Permissões
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--helen-red-light)',
                color: 'var(--helen-red)',
              }}
            >
              Controle Granular RBAC
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Configure na tabela de caixas de seleção (checkboxes) exatamente o que cada operador pode visualizar, editar ou bipar.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} />
          Cadastrar Novo Operador
        </button>
      </div>

      {/* Main Two-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left: Team Members List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Membros da Equipe ({teamMembers.length})</h3>
            <Users size={17} color="var(--text-muted)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {teamMembers.map((member) => {
              const isSelected = member.id === selectedMemberId;
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--helen-red)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--helen-red-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.email}
                    </div>
                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: member.role === 'ADMIN' ? 'var(--helen-red)' : 'var(--bg-surface-hover)',
                          color: member.role === 'ADMIN' ? '#fff' : 'var(--text-secondary)',
                        }}
                      >
                        {member.role}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Último acesso: {member.last_login}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Checkbox Matrix Table for Selected Member */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--helen-red)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                  Permissões de: <span style={{ color: 'var(--helen-red)' }}>{selectedMember?.name}</span>
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Altere as caixas de seleção abaixo para atualizar instantaneamente o perfil de acesso do colaborador.
              </p>
            </div>

            {saveSuccess && (
              <span style={{ fontSize: '12.5px', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> Alterações salvas com sucesso!
              </span>
            )}
          </div>

          {/* Interactive Matrix Component */}
          {selectedMember && (
            <PermissionsMatrixTable
              permissions={selectedMember.permissions}
              onChange={handlePermissionsChange}
              disabled={selectedMember.role === 'ADMIN' && selectedMember.id === 'user-admin'} // Protect primary admin from self-lockout
            />
          )}
        </div>
      </div>

      {/* Modal: Cadastrar Novo Operador */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="var(--helen-red)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Cadastrar Novo Membro com Permissões Personalizadas</h3>
              </div>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '6px' }}>✕</button>
            </div>

            <form onSubmit={handleCreateMember} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Nome do Colaborador:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    E-mail de Login:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="joao.silva@helencolor.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Função / Cargo:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}
                  >
                    <option value="OPERATOR">OPERATOR - Operador de Estoque / Bipagem</option>
                    <option value="VIEWER">VIEWER - Visualizador / Vendas WhatsApp</option>
                    <option value="ADMIN">ADMIN - Administrador do Sistema</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Matrix Table inside modal */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                  Matriz de Acesso do Novo Usuário (Checkboxes Granulares):
                </div>
                <PermissionsMatrixTable
                  permissions={newPermissions}
                  onChange={setNewPermissions}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={16} />
                  Criar Usuário no Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

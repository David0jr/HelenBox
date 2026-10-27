import React from 'react';
import type { ModulePermissions } from '../../shared/types';
import { SYSTEM_MODULES } from '../../shared/mockData';
import { Check, ShieldAlert, UserCheck, Shield, CheckSquare, Square } from 'lucide-react';

interface PermissionsMatrixTableProps {
  permissions: Record<string, ModulePermissions>;
  onChange: (updated: Record<string, ModulePermissions>) => void;
  disabled?: boolean;
}

export const PermissionsMatrixTable: React.FC<PermissionsMatrixTableProps> = ({
  permissions,
  onChange,
  disabled = false,
}) => {
  const handleToggle = (moduleKey: string, action: keyof ModulePermissions) => {
    if (disabled) return;
    const current = permissions[moduleKey] || {
      view: false,
      create: false,
      edit_relocate: false,
      scan_picking: false,
      delete: false,
    };
    onChange({
      ...permissions,
      [moduleKey]: {
        ...current,
        [action]: !current[action],
      },
    });
  };

  const applyPreset = (preset: 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'ALL' | 'CLEAR') => {
    if (disabled) return;
    const next: Record<string, ModulePermissions> = {};

    SYSTEM_MODULES.forEach((mod) => {
      if (preset === 'ADMIN' || preset === 'ALL') {
        next[mod.key] = { view: true, create: true, edit_relocate: true, scan_picking: true, delete: true };
      } else if (preset === 'OPERATOR') {
        // Warehouse Operator: can view catalog, move stock, scan/pick orders
        next[mod.key] = {
          view: true,
          create: mod.key === 'picking' || mod.key === 'warehouse',
          edit_relocate: mod.key === 'warehouse' || mod.key === 'picking',
          scan_picking: mod.key === 'picking' || mod.key === 'products',
          delete: false,
        };
      } else if (preset === 'VIEWER') {
        // Sales/Viewer: only view products and orders
        next[mod.key] = {
          view: mod.key === 'products' || mod.key === 'orders' || mod.key === 'warehouse',
          create: false,
          edit_relocate: false,
          scan_picking: false,
          delete: false,
        };
      } else {
        // Clear
        next[mod.key] = { view: false, create: false, edit_relocate: false, scan_picking: false, delete: false };
      }
    });

    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Preset Action Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={16} color="var(--helen-red)" />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Modelos de Permissão Rápidos:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => applyPreset('OPERATOR')}
            disabled={disabled}
            title="Concede permissões para operador de galpão (Bipagem + Realocação)"
          >
            <UserCheck size={14} color="#10B981" />
            Operador de Galpão
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => applyPreset('VIEWER')}
            disabled={disabled}
            title="Apenas visualização de catálogo e pedidos"
          >
            Vendedor / Consulta
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => applyPreset('ADMIN')}
            disabled={disabled}
            style={{ borderColor: 'var(--helen-red)' }}
          >
            <CheckSquare size={14} color="var(--helen-red)" />
            Acesso Total (Admin)
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => applyPreset('CLEAR')}
            disabled={disabled}
          >
            <Square size={14} />
            Limpar
          </button>
        </div>
      </div>

      {/* Permissions Matrix Box Table */}
      <div className="table-container" style={{ border: '1px solid var(--border-light)' }}>
        <table className="hb-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Módulo do Sistema</th>
              <th style={{ textAlign: 'center' }}>Visualizar</th>
              <th style={{ textAlign: 'center' }}>Cadastrar</th>
              <th style={{ textAlign: 'center' }}>Editar / Realocar</th>
              <th style={{ textAlign: 'center' }}>Bipar / Baixar</th>
              <th style={{ textAlign: 'center' }}>Excluir</th>
            </tr>
          </thead>
          <tbody>
            {SYSTEM_MODULES.map((mod) => {
              const p = permissions[mod.key] || {
                view: false,
                create: false,
                edit_relocate: false,
                scan_picking: false,
                delete: false,
              };

              return (
                <tr key={mod.key}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {mod.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {mod.description}
                    </div>
                  </td>

                  {/* Visualizar */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!p.view}
                      onChange={() => handleToggle(mod.key, 'view')}
                      disabled={disabled}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--helen-red)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </td>

                  {/* Cadastrar */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!p.create}
                      onChange={() => handleToggle(mod.key, 'create')}
                      disabled={disabled}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--helen-red)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </td>

                  {/* Editar / Realocar */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!p.edit_relocate}
                      onChange={() => handleToggle(mod.key, 'edit_relocate')}
                      disabled={disabled}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--helen-red)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </td>

                  {/* Bipar / Baixar */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!p.scan_picking}
                      onChange={() => handleToggle(mod.key, 'scan_picking')}
                      disabled={disabled}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--helen-red)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </td>

                  {/* Excluir */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!p.delete}
                      onChange={() => handleToggle(mod.key, 'delete')}
                      disabled={disabled}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--color-danger)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

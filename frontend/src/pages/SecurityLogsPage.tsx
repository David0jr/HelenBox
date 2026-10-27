import React, { useState } from 'react';
import {
  History,
  Shield,
  Search,
  Filter,
  Barcode,
  ArrowRightLeft,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';
import type { ActionAuditLog } from '../shared/types';
import { BackButton } from '../shared/ui/BackButton';

import { useApp } from '../app/context/AppContext';

interface SecurityLogsPageProps {
  logs?: ActionAuditLog[];
  onGoBack?: () => void;
}

export const SecurityLogsPage: React.FC<SecurityLogsPageProps> = ({ logs: propLogs, onGoBack }) => {
  const appContext = useApp();
  const logs = propLogs || appContext.logs;

  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.user_name.toLowerCase().includes(q) ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      (l.query_term && l.query_term.toLowerCase().includes(q));

    const matchesAction = filterAction === 'ALL' || l.action_type === filterAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SCAN_OUT':
        return <span className="badge badge-success"><Barcode size={12} /> Bipagem Saída</span>;
      case 'RELOCATE':
        return <span className="badge badge-info"><ArrowRightLeft size={12} /> Realocação</span>;
      case 'SEARCH':
        return <span className="badge badge-warning"><Search size={12} /> Consulta Saldo</span>;
      case 'INVOICE_IMPORT':
        return <span className="badge" style={{ background: '#8B5CF6', color: '#fff' }}><FileSpreadsheet size={12} /> Importação CN</span>;
      case 'LOGIN':
      default:
        return <span className="badge badge-secondary"><UserCheck size={12} /> Sessão</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onGoBack && <BackButton onClick={onGoBack} />}
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Logs de Auditoria & Segurança Operacional
          </h1>
          <span className="badge badge-info">
            Rastreabilidade 100%
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Registro imutável de todas as ações de colaboradores: quem bipou, quem consultou saldos e quem movimentou caixas.
        </p>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            <option value="ALL">Todas as Ações</option>
            <option value="SCAN_OUT">Bipagem de Saída (SCAN_OUT)</option>
            <option value="RELOCATE">Realocação de Carga (RELOCATE)</option>
            <option value="SEARCH">Consultas de Estoque (SEARCH)</option>
            <option value="INVOICE_IMPORT">Importação de Invoice (INVOICE_IMPORT)</option>
          </select>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Filtrar por operador, termo ou detalhe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
            }}
          />
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '10px' }} />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-container">
        <table className="hb-table">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Data & Hora</th>
              <th style={{ width: '18%' }}>Operador / Usuário</th>
              <th style={{ width: '16%' }}>Tipo de Ação</th>
              <th style={{ width: '16%' }}>Localização / Ref</th>
              <th>Detalhes da Operação</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {log.created_at}
                  </span>
                </td>

                <td>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {log.user_name}
                  </span>
                </td>

                <td>{getActionBadge(log.action_type)}</td>

                <td>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {log.location || log.target_id || '—'}
                  </span>
                </td>

                <td>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                    {log.details || (log.query_term ? `Termo pesquisado: "${log.query_term}"` : '—')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

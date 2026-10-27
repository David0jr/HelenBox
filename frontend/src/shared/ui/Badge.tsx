import React from 'react';
import type { UomType } from '../types';

interface UomBadgeProps {
  uom: UomType;
  label?: string;
  size?: 'sm' | 'md';
}

export const UomBadge: React.FC<UomBadgeProps> = ({ uom, label, size = 'sm' }) => {
  return (
    <span
      className="uom-badge"
      style={{
        fontSize: size === 'sm' ? '11px' : '12px',
        padding: size === 'sm' ? '1px 5px' : '3px 7px',
      }}
    >
      <span>{uom}</span>
      {label && <span style={{ opacity: 0.75, marginLeft: '3px' }}>{label}</span>}
    </span>
  );
};

interface StatusPillProps {
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'FEFO_ALERT' | 'PENDING' | 'PICKING' | 'CHECKED' | 'DISPATCHED';
  customLabel?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, customLabel }) => {
  switch (status) {
    case 'IN_STOCK':
      return <span className="badge badge-success">{customLabel || 'Em Estoque'}</span>;
    case 'LOW_STOCK':
      return <span className="badge badge-warning">{customLabel || 'Estoque Baixo'}</span>;
    case 'OUT_OF_STOCK':
      return <span className="badge badge-danger">{customLabel || 'Esgotado'}</span>;
    case 'FEFO_ALERT':
      return <span className="badge badge-warning">{customLabel || 'FEFO: Vence em Breve'}</span>;
    case 'PICKING':
      return <span className="badge badge-neutral" style={{ color: 'var(--helen-red)', borderColor: 'var(--helen-red-border)' }}>{customLabel || 'Em Separação'}</span>;
    case 'CHECKED':
      return <span className="badge badge-success">{customLabel || 'Conferido 100%'}</span>;
    case 'DISPATCHED':
      return <span className="badge badge-neutral">{customLabel || 'Despachado'}</span>;
    case 'PENDING':
    default:
      return <span className="badge badge-neutral">{customLabel || 'Pendente'}</span>;
  }
};

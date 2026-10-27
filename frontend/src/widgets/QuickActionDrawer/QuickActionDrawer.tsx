import React from 'react';
import {
  X,
  PlusCircle,
  Barcode,
  ArrowRightLeft,
  Printer,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { NavTab } from '../Sidebar/Sidebar';

interface QuickActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenRelocate: () => void;
}

export const QuickActionDrawer: React.FC<QuickActionDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenRelocate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '360px',
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            height: '70px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--helen-red)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Ações Rápidas WMS</h3>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Action Shortcuts */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Operações de Estoque
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => {
                  onNavigate('picking');
                  onClose();
                }}
              >
                <Barcode size={17} color="var(--helen-red)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Terminal de Bipagem</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bipar pedidos com leitor óptico</div>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => {
                  onOpenRelocate();
                  onClose();
                }}
              >
                <ArrowRightLeft size={17} color="#3B82F6" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Realocar Carga de Rua</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mover caixas sem travar vendas</div>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => {
                  onNavigate('invoices');
                  onClose();
                }}
              >
                <Layers size={17} color="#10B981" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Importar Invoice CN</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tradução & conferência de caixas</div>
                </div>
              </button>
            </div>
          </div>

          {/* FEFO Alerts Box */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', fontWeight: 700, fontSize: '12.5px' }}>
              <AlertTriangle size={16} />
              <span>Atenção FEFO (Validades)</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
              O sistema prioriza automaticamente nos pedidos os lotes mais antigos.
            </p>
            <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600 }}>Lote: 2026-08 (#861 #50)</div>
              <div style={{ fontSize: '11px', color: 'var(--helen-red)' }}>Vence em 18 dias • Rua B-01</div>
            </div>
          </div>

          {/* Warehouse Occupancy Info */}
          <div
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Ocupação do Galpão 1:
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>68%</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>340 / 500 Posições</span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: 'var(--border-light)', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', background: 'var(--helen-red)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

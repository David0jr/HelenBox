import React, { useState } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import type { ProductVariant } from '../../shared/types';

interface QuickRelocateModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: ProductVariant;
  productName: string;
  onRelocateSuccess: (newLocation: string, qty: number) => void;
}

export const QuickRelocateModal: React.FC<QuickRelocateModalProps> = ({
  isOpen,
  onClose,
  variant,
  productName,
  onRelocateSuccess,
}) => {
  const [destWarehouse, setDestWarehouse] = useState<'DEP1' | 'DEP2'>('DEP1');
  const [destAisle, setDestAisle] = useState('B');
  const [destShelf, setDestShelf] = useState('02');
  const [destLevel, setDestLevel] = useState('N1');
  const [qty, setQty] = useState(10);
  const [uom, setUom] = useState('CXM');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const currentLoc = `${variant?.warehouse_code || 'DEP1'}-Rua ${variant?.aisle || 'A'}-P${variant?.shelf || '02'} (${variant?.level || 'N1'})`;
  const newLocStr = `${destWarehouse}-Rua ${destAisle}-P${destShelf} (${destLevel})`;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      onRelocateSuccess(newLocStr, qty);
      setIsSuccess(false);
      onClose();
    }, 1200);
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
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                Realocação Ágil de Estoque
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Transferência física sem bloqueio de vendas (Estoque Disponível 24/7)
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Product Summary */}
          <div
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Produto Selecionado
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {productName}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>SKU: <strong style={{ fontFamily: 'var(--font-mono)' }}>{variant?.variant_sku || 'HB-SKU'}</strong></span>
              <span>•</span>
              <span>Local Atual: <strong style={{ color: 'var(--helen-red)' }}>{currentLoc}</strong></span>
            </div>
          </div>

          {/* Non-blocking Notice */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '12px',
              color: 'var(--color-info)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Regra HelenBox:</strong> As mercadorias em trânsito entre ruas continuam ativas para separação. Qualquer bipagem de pedido dará baixa imediata.
            </span>
          </div>

          {/* Destination Warehouse */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Galpão de Destino:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${destWarehouse === 'DEP1' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDestWarehouse('DEP1')}
              >
                🏢 Galpão 1 (Matriz SP)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${destWarehouse === 'DEP2' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDestWarehouse('DEP2')}
              >
                🏢 Galpão 2 (Filial Shopee)
              </button>
            </div>
          </div>

          {/* Coordinates grid (Aisle, Shelf, Level) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                Rua / Corredor:
              </label>
              <select
                value={destAisle}
                onChange={(e) => setDestAisle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                <option value="A">Rua A (Óleos & Cuidado)</option>
                <option value="B">Rua B (Esmaltes em Gel)</option>
                <option value="C">Rua C (Géis Construtores)</option>
                <option value="D">Rua D (Acessórios & Cabines)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                Prateleira:
              </label>
              <select
                value={destShelf}
                onChange={(e) => setDestShelf(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                <option value="01">Prateleira 01 (Baixa)</option>
                <option value="02">Prateleira 02 (Média)</option>
                <option value="03">Prateleira 03 (Média)</option>
                <option value="04">Prateleira 04 (Alta / Pulmão)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                Nível / Andar:
              </label>
              <select
                value={destLevel}
                onChange={(e) => setDestLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                <option value="N1">Nível 1 (Picking Fácil)</option>
                <option value="N2">Nível 2 (Intermediário)</option>
                <option value="N3">Nível 3 (Palete Superior)</option>
              </select>
            </div>
          </div>

          {/* Qty and UoM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                Quantidade a Mover:
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '4px' }}>
                Unidade (UoM):
              </label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                <option value="CXM">
                  CXM - Caixa Master ({variant?.units_per_box ? `${variant.units_per_box} un` : 'Master'})
                </option>
                <option value="DZ">DZ - Dúzia (12 un)</option>
                <option value="UN">UN - Unidade Avulsa (1 un)</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSuccess}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSuccess}>
              {isSuccess ? <Check size={16} /> : <ArrowRightLeft size={16} />}
              {isSuccess ? 'Realocado com Sucesso!' : 'Confirmar Transferência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

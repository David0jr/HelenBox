import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Boxes,
  Search,
} from 'lucide-react';
import type { SupplierInvoice } from '../shared/types';
import { INITIAL_INVOICES } from '../shared/mockData';
import { BackButton } from '../shared/ui/BackButton';

interface InvoicesPageProps {
  onGoBack?: () => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onGoBack }) => {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>(INITIAL_INVOICES);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(invoices[0]?.id || '');
  const [filterQuery, setFilterQuery] = useState('');

  const currentInvoice = invoices.find((inv) => inv.id === selectedInvoiceId) || invoices[0];

  const handleSimulateCheck = (itemId: string) => {
    if (!currentInvoice) return;
    const updatedItems = currentInvoice.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          physical_checked_qty: it.quantity_pcs,
        };
      }
      return it;
    });

    const isAllChecked = updatedItems.every((it) => it.physical_checked_qty >= it.quantity_pcs);

    const updatedInvoice: SupplierInvoice = {
      ...currentInvoice,
      status: isAllChecked ? 'RECONCILED' : 'PROCESSED',
      items: updatedItems,
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
  };

  const filteredItems = currentInvoice?.items.filter((it) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      it.supplier_code.toLowerCase().includes(q) ||
      it.translated_name_pt.toLowerCase().includes(q) ||
      (it.box_numbers && it.box_numbers.toLowerCase().includes(q)) ||
      (it.description_pt && it.description_pt.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Clean Single-Row Top Bar: Container Selector Pills + Search + Upload */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {onGoBack && <BackButton onClick={onGoBack} />}

          {/* Container Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-hover)',
              padding: '4px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
              gap: '2px',
            }}
          >
            {invoices.map((inv) => {
              const isSelected = inv.id === currentInvoice?.id;
              return (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: isSelected ? 'var(--helen-black)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span
                    style={{
                      width: '6.5px',
                      height: '6.5px',
                      borderRadius: '50%',
                      backgroundColor: inv.status === 'RECONCILED' ? '#10B981' : '#F59E0B',
                    }}
                  />
                  <span>Container {inv.upload_date}</span>
                  <span style={{ opacity: 0.7, fontSize: '12px' }}>{inv.container_type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Search & Import Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '330px', minWidth: '180px' }}>
            <input
              type="text"
              placeholder="Buscar código ou nº da caixa..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 14px 0 36px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              alert('Importar Packing List (.xlsx): Selecione a planilha de container para processar.')
            }
            style={{
              height: '38px',
              padding: '0 18px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Upload size={14} />
            <span>Importar Planilha</span>
          </button>
        </div>
      </div>

      {/* Container Summary Card (No Yuan Prices) */}
      <div className="card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(229, 30, 43, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--helen-red)',
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentInvoice.invoice_number}
                </span>
                <span className={`badge ${currentInvoice.status === 'RECONCILED' ? 'badge-success' : 'badge-warning'}`}>
                  {currentInvoice.status === 'RECONCILED' ? 'Conferido 100%' : 'Conferência Pendente'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {currentInvoice.origin_agent || currentInvoice.file_name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total de Caixas
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentInvoice.total_boxes} cx{' '}
                {currentInvoice.mixed_boxes ? (
                  <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 600 }}>
                    ({currentInvoice.mixed_boxes} mista)
                  </span>
                ) : null}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total em Peças
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentInvoice.total_pieces.toLocaleString('pt-BR')} pç
              </div>
            </div>

            {currentInvoice.gross_weight_kg && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Peso / Cubagem
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {currentInvoice.gross_weight_kg.toLocaleString('pt-BR')} kg • {currentInvoice.volume_cbm} m³
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container Items Table */}
      <div className="table-container">
        <table className="hb-table">
          <thead>
            <tr>
              <th style={{ width: '58px' }}>Foto</th>
              <th style={{ width: '13%' }}>Código</th>
              <th style={{ width: '32%' }}>Produto & Descrição</th>
              <th style={{ width: '22%' }}>Embalagem & Caixas</th>
              <th style={{ width: '15%' }}>Nº das Caixas</th>
              <th style={{ width: '13%', textAlign: 'right' }}>Conferência</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const isChecked = item.physical_checked_qty >= item.quantity_pcs;
              return (
                <tr key={item.id}>
                  <td>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-surface-hover)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.supplier_code}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.supplier_code}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.translated_name_pt}
                    </div>
                    {item.description_pt && (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.description_pt}
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.quantity_pcs.toLocaleString('pt-BR')} pç{' '}
                      <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '11.5px' }}>
                        ({item.master_boxes} cx{item.units_per_box ? ` × ${item.units_per_box}` : ''})
                      </span>
                    </div>
                    {item.packaging_info && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.packaging_info}
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <Boxes size={13} color="var(--helen-red)" />
                        {item.box_numbers || '–'}
                      </span>
                      {item.is_mixed_box && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.14)',
                            color: '#D97706',
                          }}
                        >
                          + 1 mista
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {isChecked ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Conferido
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleSimulateCheck(item.id)}
                        style={{ borderRadius: 'var(--radius-pill)', fontSize: '11px', padding: '5px 12px' }}
                      >
                        Conferir
                      </button>
                    )}
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

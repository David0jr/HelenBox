import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Languages,
  Package,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import type { SupplierInvoice, InvoiceItem } from '../shared/types';
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
          physical_checked_qty: it.quantity_pcs, // mark 100% checked
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
              Invoices & Packing Lists da China
            </h1>
            <span className="badge badge-info">
              Tradução Automática CN ⇄ PT
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Recebimento de contêineres, tradução dos nomes chineses de fábrica e conferência física de caixas master.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => alert('Simulação de Upload: Selecione uma planilha Excel (.xlsx) ou Packing List PDF da fábrica em Guangzhou para processar.')}
        >
          <Upload size={16} />
          Importar Packing List (.xlsx)
        </button>
      </div>

      {/* Invoice Overview Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(229, 30, 43, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--helen-red)',
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentInvoice.invoice_number}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Arquivo: {currentInvoice.file_name} • Importado em {currentInvoice.upload_date}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Caixas Master</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--helen-red)' }}>
                {currentInvoice.total_boxes} CXM
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Peças</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>
                {currentInvoice.total_pieces.toLocaleString('pt-BR')} un
              </div>
            </div>

            <span className={`badge ${currentInvoice.status === 'RECONCILED' ? 'badge-success' : 'badge-warning'}`}>
              {currentInvoice.status === 'RECONCILED' ? '✓ Conferido 100%' : '⏳ Conferência Parcial'}
            </span>
          </div>
        </div>
      </div>

      {/* Translated Items Table */}
      <div className="table-container">
        <table className="hb-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Código da Fábrica China</th>
              <th style={{ width: '30%' }}>Nome Original em Chinês (Raw CN)</th>
              <th style={{ width: '30%' }}>Tradução Validada (PT-BR)</th>
              <th>Caixas / Peças</th>
              <th style={{ textAlign: 'right' }}>Conferência Física</th>
            </tr>
          </thead>
          <tbody>
            {currentInvoice.items.map((item) => {
              const isChecked = item.physical_checked_qty >= item.quantity_pcs;
              return (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12.5px', color: 'var(--helen-red)' }}>
                      {item.supplier_code}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
                      {item.raw_name_cn}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.translated_name_pt}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '12.5px', fontWeight: 700 }}>
                      {item.master_boxes} CXM ({item.quantity_pcs.toLocaleString('pt-BR')} un)
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {isChecked ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={13} /> {item.physical_checked_qty.toLocaleString('pt-BR')} un OK
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleSimulateCheck(item.id)}
                      >
                        Conferir Caixas ({item.physical_checked_qty} / {item.quantity_pcs})
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

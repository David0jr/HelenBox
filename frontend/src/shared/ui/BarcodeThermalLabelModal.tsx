import React, { useState } from 'react';
import { X, Printer, Check, Copy } from 'lucide-react';
import type { ProductVariant, ProductUom } from '../types';

interface BarcodeThermalLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  variant?: ProductVariant;
  selectedUom?: ProductUom;
}

export const BarcodeThermalLabelModal: React.FC<BarcodeThermalLabelModalProps> = ({
  isOpen,
  onClose,
  productName,
  variant,
  selectedUom,
}) => {
  const [copied, setCopied] = useState(false);
  const [labelSize, setLabelSize] = useState<'100x50' | '50x30'>('100x50');

  if (!isOpen) return null;

  const currentUom = selectedUom || variant?.uoms?.[0] || {
    id: 'sample',
    variant_id: variant?.id || '',
    uom_type: 'UN',
    description: 'Unidade Avulsa',
    multiplier: 1,
    barcode: variant?.variant_sku ? `UN-${variant.variant_sku}` : 'UN-7890011001',
    is_default_sale: true,
  };

  const barcodeText = currentUom.barcode;

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '540px' }}
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
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
              🏷️ Etiqueta Térmica de Código de Barras
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Impressão padrão para impressoras térmicas (Zebra / Argox / Elgin)
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Format Selector */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Tamanho do Rolo:
            </span>
            <button
              className={`btn btn-sm ${labelSize === '100x50' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLabelSize('100x50')}
            >
              100 x 50 mm (Caixas / Master)
            </button>
            <button
              className={`btn btn-sm ${labelSize === '50x30' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLabelSize('50x30')}
            >
              50 x 30 mm (Frasco / Unidade)
            </button>
          </div>

          {/* Thermal Label Simulation Card */}
          <div
            style={{
              background: '#FFFFFF',
              color: '#000000',
              borderRadius: '8px',
              border: '2px dashed #999',
              padding: labelSize === '100x50' ? '24px' : '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-sans)',
              minHeight: labelSize === '100x50' ? '240px' : '180px',
            }}
          >
            {/* Top row: Brand & UOM */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #000', paddingBottom: '6px' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                  HELEN<span style={{ color: '#E51E2B' }}>COLOR</span>
                </span>
                <span style={{ fontSize: '10px', color: '#555', display: 'block' }}>
                  WMS HELENBOX • IMPORTAÇÃO OFICIAL
                </span>
              </div>
              <div
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {currentUom.uom_type} • {currentUom.description}
              </div>
            </div>

            {/* Middle: Product & Variant info */}
            <div style={{ margin: '10px 0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.3 }}>
                {productName}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                {variant?.collection_code && (
                  <span style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                    {variant.collection_code} {variant.color_code}
                  </span>
                )}
                {variant?.aroma_flavor && (
                  <span style={{ fontSize: '11px', color: '#333', fontWeight: 600 }}>
                    Aroma: {variant.aroma_flavor}
                  </span>
                )}
                {variant?.color_name && (
                  <span style={{ fontSize: '11px', color: '#333' }}>
                    {variant.color_name}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: '#555' }}>
                  Vol: {variant?.volume || '10ml'}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                Local: {variant?.warehouse_code || 'DEP1'} - Rua {variant?.aisle || 'A'}-P{variant?.shelf || '01'} (Nível {variant?.level || 'N1'})
              </div>
            </div>

            {/* Barcode Simulation Graphic */}
            <div style={{ textAlign: 'center', margin: '4px 0' }}>
              {/* CSS barcode lines */}
              <div
                style={{
                  height: labelSize === '100x50' ? '50px' : '36px',
                  width: '90%',
                  margin: '0 auto',
                  background: 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px, #000 9px, #000 13px, #fff 13px, #fff 16px)',
                }}
              />
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  marginTop: '4px',
                }}
              >
                *{barcodeText}*
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
              <span>LOTE: 202610-01 (FEFO)</span>
              <span>VALIDADE: 10/2028</span>
              <span>EMBALAGEM PADRONIZADA</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button className="btn btn-secondary" onClick={handleCopyBarcode}>
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
            {copied ? 'Código Copiado!' : 'Copiar Código'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} />
              Imprimir Etiqueta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

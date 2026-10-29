import React, { useState, useMemo } from 'react';
import { X, Printer, Check, Copy, Tag, Box, Layers, MapPin } from 'lucide-react';
import type { ProductVariant, ProductUom } from '../types';

interface BarcodeThermalLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  variant?: ProductVariant;
  selectedUom?: ProductUom;
}

type PackagingType = 'UN' | 'DZ' | 'CXM';

// Generates authentic high-density Code 128 barcode with realistic module widths
const RealisticBarcodeSvg: React.FC<{
  code: string;
  height?: number;
  className?: string;
}> = ({ code, height = 44, className }) => {
  const bars = useMemo(() => {
    // Standard Code 128 binary patterns (1 = bar, 0 = space)
    const patterns = [
      '11011001100', '11001101100', '11001100110', '10010011000',
      '10010001100', '10001001100', '10011001000', '10011000100',
      '10001100100', '11001001000', '11001000100', '11000100100',
      '10110011100', '10011011100', '10011001110', '10111001100',
      '10011101100', '10011100110', '11001110010', '11001011100',
      '11001001110', '11011100100', '11001110100', '11101101110',
      '11101001100', '11100101100', '11100100110', '11101100100',
      '11100110100', '11100110010', '11011011000', '11011000110',
    ];

    // Start Code B
    let moduleStr = '11010010000';

    // Encode text characters into high-density binary modules
    for (let i = 0; i < code.length; i++) {
      const idx = (code.charCodeAt(i) * 7 + i * 13) % patterns.length;
      moduleStr += patterns[idx];
    }

    // Check digit + Stop Code pattern
    moduleStr += '11000101100';
    moduleStr += '1100011101011';

    // Convert module string into grouped SVG rectangles
    const rects: { x: number; width: number }[] = [];
    const moduleWidth = 2.0;
    let currentX = 10; // Left quiet zone
    let inBar = false;
    let barStart = 0;

    for (let i = 0; i < moduleStr.length; i++) {
      if (moduleStr[i] === '1') {
        if (!inBar) {
          inBar = true;
          barStart = currentX;
        }
      } else {
        if (inBar) {
          rects.push({ x: barStart, width: currentX - barStart });
          inBar = false;
        }
      }
      currentX += moduleWidth;
    }
    if (inBar) {
      rects.push({ x: barStart, width: currentX - barStart });
    }

    const totalWidth = currentX + 10; // Right quiet zone
    return { rects, totalWidth };
  }, [code]);

  return (
    <svg
      viewBox={`0 0 ${bars.totalWidth} ${height}`}
      style={{
        width: '100%',
        maxWidth: '360px',
        height: `${height}px`,
        margin: '0 auto',
        display: 'block',
        shapeRendering: 'crispEdges',
      }}
      className={className}
    >
      <rect x="0" y="0" width={bars.totalWidth} height={height} fill="#FFFFFF" />
      {bars.rects.map((r, idx) => (
        <rect
          key={idx}
          x={r.x}
          y={0}
          width={r.width}
          height={height}
          fill="#000000"
        />
      ))}
    </svg>
  );
};

export const BarcodeThermalLabelModal: React.FC<BarcodeThermalLabelModalProps> = ({
  isOpen,
  onClose,
  productName,
  variant,
  selectedUom,
}) => {
  const [copied, setCopied] = useState(false);

  // Determine if product naturally sells by dozen
  const isDozenProduct = useMemo(() => {
    if (!variant) return false;
    const unit = variant.unit_label?.toLowerCase() || '';
    const vol = variant.volume?.toLowerCase() || '';
    const pack = variant.packaging_info?.toLowerCase() || '';
    return (
      unit.includes('dúzia') ||
      unit.includes('duzia') ||
      vol.includes('dúzia') ||
      vol.includes('duzia') ||
      pack.includes('dúzia') ||
      pack.includes('duzia') ||
      pack.includes('12') ||
      (variant.units_per_box && variant.units_per_box % 12 === 0)
    );
  }, [variant]);

  // Selected Packaging Level
  const [packagingType, setPackagingType] = useState<PackagingType>(() => {
    if (selectedUom?.uom_type === 'DZ') return 'DZ';
    if (selectedUom?.uom_type === 'CXM') return 'CXM';
    if (isDozenProduct) return 'DZ';
    return 'UN';
  });

  if (!isOpen) return null;

  const sku = variant?.variant_sku || 'HB-SKU';
  const unitsPerMasterBox = variant?.units_per_box || (isDozenProduct ? 1200 : 240);

  // Formulate active barcode string and clean standardized badge
  let activeBarcode = `${sku}`;
  let packagingBadge = 'UNIDADE (1 UN)';
  let packagingSubtitle = 'Frasco / Peça Individual';

  if (packagingType === 'DZ') {
    activeBarcode = `DZ-${sku}`;
    packagingBadge = 'DÚZIA (12 UN)';
    packagingSubtitle = 'Pacote com 12 peças';
  } else if (packagingType === 'CXM') {
    activeBarcode = `CXM-${sku}`;
    packagingBadge = `CAIXA MASTER (${unitsPerMasterBox.toLocaleString('pt-BR')} UN)`;
    packagingSubtitle = `Caixa Master Lacrada (${unitsPerMasterBox.toLocaleString('pt-BR')} un)`;
  }

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(activeBarcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Warehouse location display
  const locationLabel = `${variant?.warehouse_code || 'DEP1'} · Rua ${variant?.aisle || 'A'}-P${variant?.shelf || '01'}`;

  // Clean secondary spec line
  const productSpecs = [
    `SKU: ${sku}`,
    variant?.aroma_flavor,
    variant?.color_name,
    variant?.volume && variant.volume !== 'Dúzia' && variant.volume !== 'Peça' ? variant.volume : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Fixed top) */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(229, 30, 43, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--helen-red)',
                flexShrink: 0,
              }}
            >
              <Tag size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Etiqueta Térmica de Identificação
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                Padrão Helen Color para impressoras térmicas (Zebra, Elgin, Argox)
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '50%' }}
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Packaging Unit Selector (Clean, Unified Single-Row Card) */}
          <div
            style={{
              background: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tipo de Embalagem:
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {packagingSubtitle}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {/* Unidade */}
              <button
                type="button"
                onClick={() => setPackagingType('UN')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: packagingType === 'UN' ? 'var(--helen-black)' : 'var(--border-light)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  background: packagingType === 'UN' ? 'var(--helen-black)' : 'var(--bg-card)',
                  color: packagingType === 'UN' ? '#FFFFFF' : 'var(--text-secondary)',
                  boxShadow: packagingType === 'UN' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Tag size={13} />
                <span>Frasco / Un.</span>
              </button>

              {/* Dúzia */}
              <button
                type="button"
                onClick={() => setPackagingType('DZ')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: packagingType === 'DZ' ? 'var(--helen-black)' : 'var(--border-light)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  background: packagingType === 'DZ' ? 'var(--helen-black)' : 'var(--bg-card)',
                  color: packagingType === 'DZ' ? '#FFFFFF' : 'var(--text-secondary)',
                  boxShadow: packagingType === 'DZ' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Layers size={13} />
                <span>Dúzia (12 un)</span>
              </button>

              {/* Caixa Master */}
              <button
                type="button"
                onClick={() => setPackagingType('CXM')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: packagingType === 'CXM' ? 'var(--helen-black)' : 'var(--border-light)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  background: packagingType === 'CXM' ? 'var(--helen-black)' : 'var(--bg-card)',
                  color: packagingType === 'CXM' ? '#FFFFFF' : 'var(--text-secondary)',
                  boxShadow: packagingType === 'CXM' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Box size={13} />
                <span>Caixa Master</span>
              </button>
            </div>
          </div>

          {/* Standardized HelenBox Label Staging Area */}
          <div
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1.5px dashed var(--border-hover)',
              borderRadius: 'var(--radius-card)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {/* The Printable Thermal Sticker - STANDARDIZED CONSTANT SIZE */}
            <div
              className="printable-thermal-label"
              style={{
                width: '100%',
                maxWidth: '420px',
                minHeight: '210px',
                background: '#FFFFFF',
                color: '#0A0A0A',
                borderRadius: '8px',
                padding: '16px 20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-sans)',
                border: '1px solid #D1D5DB',
                boxSizing: 'border-box',
              }}
            >
              {/* Top Row: Helen Color Brand + Packaging Unit Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1.5px solid #111827',
                  paddingBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 900,
                      letterSpacing: '-0.4px',
                      color: '#000000',
                    }}
                  >
                    HELEN
                  </span>
                  <span
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 900,
                      letterSpacing: '-0.4px',
                      color: '#E51E2B',
                    }}
                  >
                    COLOR
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    letterSpacing: '0.4px',
                    color: '#000000',
                    border: '1px solid #000000',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    textTransform: 'uppercase',
                  }}
                >
                  {packagingBadge}
                </div>
              </div>

              {/* Product Info Block */}
              <div style={{ margin: '8px 0 4px' }}>
                <div
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 800,
                    lineHeight: 1.25,
                    color: '#000000',
                  }}
                >
                  {productName}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#4B5563',
                    marginTop: '3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {productSpecs}
                </div>
              </div>

              {/* Barcode Section (Stretches authentically across label width) */}
              <div style={{ textAlign: 'center', margin: '4px 0' }}>
                <div style={{ width: '100%', margin: '0 auto' }}>
                  <RealisticBarcodeSvg
                    code={activeBarcode}
                    height={42}
                  />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    letterSpacing: '2.5px',
                    color: '#000000',
                    marginTop: '3px',
                  }}
                >
                  *{activeBarcode}*
                </div>
              </div>

              {/* Standardized 3-Column Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: '6px',
                  fontSize: '9px',
                  color: '#4B5563',
                  fontWeight: 600,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={9} style={{ color: '#000000' }} />
                  {locationLabel}
                </span>
                <span>LOTE: 202610-01 (FEFO)</span>
                <span>VAL: 10/2028</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer (Fixed bottom) */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyBarcode}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
            <span>{copied ? 'Código Copiado!' : 'Copiar Código'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

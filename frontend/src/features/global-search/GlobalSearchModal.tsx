import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Box, ArrowRight } from 'lucide-react';
import type { Product, ProductVariant } from '../../shared/types';
import { HashtagSwatch } from '../../shared/ui/HashtagSwatch';
import { UomBadge } from '../../shared/ui/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: (Product & { variants: ProductVariant[] })[];
  onSelectProduct: (product: Product, variant?: ProductVariant) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = searchTerm.toLowerCase().trim();

  // Search matches across products and variants
  const results: { product: Product; variant: ProductVariant }[] = [];
  products.forEach((prod) => {
    prod.variants.forEach((v) => {
      const match =
        !q ||
        prod.name_pt.toLowerCase().includes(q) ||
        (prod.name_cn && prod.name_cn.toLowerCase().includes(q)) ||
        prod.supplier_code.toLowerCase().includes(q) ||
        prod.sku_helenbox.toLowerCase().includes(q) ||
        v.variant_sku.toLowerCase().includes(q) ||
        (v.collection_code && v.collection_code.toLowerCase().includes(q)) ||
        (v.color_code && v.color_code.toLowerCase().includes(q)) ||
        (v.aroma_flavor && v.aroma_flavor.toLowerCase().includes(q)) ||
        (v.color_name && v.color_name.toLowerCase().includes(q)) ||
        (v.aisle && `rua ${v.aisle}`.toLowerCase().includes(q));

      if (match) {
        results.push({ product: prod, variant: v });
      }
    });
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog modal-lg"
        style={{ marginTop: '-10vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-surface)',
          }}
        >
          <Search size={22} color="var(--helen-red)" />
          <input
            type="text"
            placeholder="Buscar por código HelenBox, código fábrica China (HYYY), hashtag (#861 #50) ou Rua..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '15px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {searchTerm && (
            <button className="btn btn-ghost" onClick={() => setSearchTerm('')} style={{ padding: '4px' }}>
              <X size={16} />
            </button>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--bg-surface-hover)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-light)',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px' }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <Box size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Nenhum produto ou código encontrado para "{searchTerm}"</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Tente pesquisar por código da China, aroma ou hashtag de esmalte.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {results.slice(0, 8).map(({ product, variant }) => (
                <div
                  key={variant.id}
                  onClick={() => {
                    onSelectProduct(product, variant);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--helen-red)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* Left: Thumbnail & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={variant.image_url || product.image_url}
                      alt={product.name_pt}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid var(--border-light)',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {product.name_pt}
                        </span>
                        {variant.collection_code && (
                          <HashtagSwatch
                            collectionCode={variant.collection_code}
                            colorCode={variant.color_code}
                            hexColor={variant.hex_color}
                            size="sm"
                          />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>SKU: {variant.variant_sku}</span>
                        <span>•</span>
                        <span>Fábrica CN: {product.supplier_code}</span>
                        {variant.aroma_flavor && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--helen-red)', fontWeight: 600 }}>{variant.aroma_flavor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stock & Location info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <MapPin size={13} color="var(--helen-red)" />
                        <span>{variant.warehouse_code || 'DEP1'} • Rua {variant.aisle || 'A'}-P{variant.shelf || '01'}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 700, marginTop: '2px' }}>
                        {variant.stock_units || 0} un em estoque
                      </div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '10px 20px',
            background: 'var(--bg-surface-hover)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
          }}
        >
          <span>Dica: Use <strong>#861</strong> ou <strong>HYYY</strong> para filtrar por código exato</span>
          <span>Exibindo os itens mais relevantes</span>
        </div>
      </div>
    </div>
  );
};

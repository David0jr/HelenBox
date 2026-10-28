import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Barcode,
  ArrowRightLeft,
  MapPin,
  Package,
  ChevronDown,
  ChevronUp,
  X,
  Boxes,
} from 'lucide-react';
import type { Product, ProductVariant, ProductUom } from '../shared/types';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { BackButton } from '../shared/ui/BackButton';

import { useApp } from '../app/context/AppContext';

interface ProductsPageProps {
  products?: (Product & { variants: ProductVariant[] })[];
  onOpenLabelModal?: (product: Product, variant?: ProductVariant, uom?: ProductUom) => void;
  onOpenRelocateModal?: (product: Product, variant?: ProductVariant) => void;
  onAddNewProduct?: () => void;
  onGoBack?: () => void;
}

const ProductThumb: React.FC<{
  src?: string;
  alt: string;
  hexColor?: string;
  size?: number;
}> = ({ src, alt, hexColor, size = 44 }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '10px',
        background: hexColor ? `${hexColor}22` : 'var(--bg-surface-hover)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <Package size={size * 0.45} color={hexColor || 'var(--text-muted)'} />
      )}
    </div>
  );
};

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products: propProducts,
  onOpenLabelModal: propOnOpenLabelModal,
  onOpenRelocateModal: propOnOpenRelocateModal,
  onAddNewProduct: propOnAddNewProduct,
  onGoBack,
}) => {
  const appContext = useApp();
  const products = propProducts || appContext.products;
  const onOpenLabelModal = propOnOpenLabelModal || appContext.openLabelModal;
  const onOpenRelocateModal = propOnOpenRelocateModal || appContext.openRelocateModal;
  const onAddNewProduct = propOnAddNewProduct || (() => alert('Cadastrar Produto: Formulário de SKU HelenBox'));

  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_STOCK' | 'MIXED_BOX' | 'OUT_OF_STOCK'>('ALL');
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('helenbox_products_expanded');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    const initial: Record<string, boolean> = {};
    products.forEach((p) => {
      initial[p.id] = false;
    });
    return initial;
  });
  const [selectedProductModal, setSelectedProductModal] = useState<
    (Product & { variants: ProductVariant[] }) | null
  >(null);

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = { ...prev, [productId]: !(prev[productId] ?? false) };
      try {
        localStorage.setItem('helenbox_products_expanded', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Dynamic categories from products
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  // Counts
  const mixedBoxProductsCount = useMemo(
    () => products.filter((p) => p.variants.some((v) => v.is_mixed_box)).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => (p.total_stock_units || 0) === 0).length,
    [products]
  );

  // Filter products (search by code, name, box numbers, or variant)
  const filteredProducts = useMemo(() => {
    const q = filterText.toLowerCase().trim();
    return products.filter((prod) => {
      const matchesSearch =
        !q ||
        prod.name_pt.toLowerCase().includes(q) ||
        prod.sku_helenbox.toLowerCase().includes(q) ||
        prod.supplier_code.toLowerCase().includes(q) ||
        prod.variants.some(
          (v) =>
            v.variant_sku.toLowerCase().includes(q) ||
            (v.aroma_flavor && v.aroma_flavor.toLowerCase().includes(q)) ||
            (v.box_numbers && v.box_numbers.toLowerCase().includes(q)) ||
            (v.packaging_info && v.packaging_info.toLowerCase().includes(q)) ||
            (v.color_code && v.color_code.toLowerCase().includes(q))
        );

      const matchesCategory = selectedCategory === 'ALL' || prod.category === selectedCategory;

      const units = prod.total_stock_units || 0;
      if (activeTab === 'MIXED_BOX' && !prod.variants.some((v) => v.is_mixed_box)) return false;
      if (activeTab === 'OUT_OF_STOCK' && units > 0) return false;

      return matchesSearch && matchesCategory;
    });
  }, [products, filterText, selectedCategory, activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Clean Single-Row Top Bar: Filter Pills + Search + Category + Add Button */}
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
        {/* Left: Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {onGoBack && <BackButton onClick={onGoBack} />}

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
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: activeTab === 'ALL' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'ALL' ? 'var(--helen-black)' : 'transparent',
                color: activeTab === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>Todos</span>
              <span style={{ opacity: 0.7, fontSize: '12px' }}>{products.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MIXED_BOX')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: activeTab === 'MIXED_BOX' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeTab === 'MIXED_BOX' ? 'var(--helen-black)' : 'transparent',
                color: activeTab === 'MIXED_BOX' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ width: '6.5px', height: '6.5px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <span>Caixa Mista</span>
              <span style={{ opacity: 0.7, fontSize: '12px' }}>{mixedBoxProductsCount}</span>
            </button>

            {outOfStockCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('OUT_OF_STOCK')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'OUT_OF_STOCK' ? 700 : 500,
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: activeTab === 'OUT_OF_STOCK' ? 'var(--helen-black)' : 'transparent',
                  color: activeTab === 'OUT_OF_STOCK' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{ width: '6.5px', height: '6.5px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span>Esgotados</span>
                <span style={{ opacity: 0.7, fontSize: '12px' }}>{outOfStockCount}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Search + Category + Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '330px', minWidth: '180px' }}>
            <input
              type="text"
              placeholder="Buscar código (CMJD, HKXS), nº caixa..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
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

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: '38px',
              padding: '0 14px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              flexShrink: 0,
            }}
          >
            <option value="ALL">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddNewProduct}
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
            <Plus size={14} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Clean Product Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredProducts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Nenhum produto encontrado
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Pesquise por código (ex: CMJD-002, HKXS-009, RGJ-2418) ou número da caixa (ex: 353, 511).
            </div>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const totalUnits = prod.total_stock_units || 0;
            const totalOwnBoxes = prod.variants.reduce((acc, v) => acc + (v.boxes_count || 0), 0);
            const hasMixedBox = prod.variants.some((v) => v.is_mixed_box);
            const isExpanded = expandedProductIds[prod.id] ?? false;

            return (
              <div
                key={prod.id}
                className="card"
                style={{
                  padding: 0,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-card)',
                }}
              >
                {/* Parent Product Header Row */}
                <div
                  onClick={() => setSelectedProductModal(prod)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    cursor: 'pointer',
                    background: 'var(--bg-card)',
                  }}
                >
                  {/* Left: Photo + Name + Category & Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px', flex: 1 }}>
                    <ProductThumb src={prod.image_url} alt={prod.name_pt} size={52} />

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {prod.name_pt}
                        </span>
                        {hasMixedBox && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#D97706',
                            }}
                          >
                            + Caixa Mista
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '11.5px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {prod.supplier_code}
                        </span>
                        <span>•</span>
                        <span>{prod.category}</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} color="var(--helen-red)" />
                          {prod.location_summary}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total Peças + Total Caixas + Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: totalUnits === 0 ? 'var(--color-danger)' : 'var(--text-primary)',
                          lineHeight: 1.1,
                        }}
                      >
                        {totalUnits.toLocaleString('pt-BR')}{' '}
                        <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--text-muted)' }}>pç</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                        {totalOwnBoxes} caixas {hasMixedBox ? '+ mista' : 'fechadas'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => onOpenLabelModal(prod, prod.variants[0])}
                        style={{ borderRadius: 'var(--radius-pill)', padding: '6px 12px', fontSize: '11.5px' }}
                      >
                        <Barcode size={13} />
                        <span>Etiqueta</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => onOpenRelocateModal(prod, prod.variants[0])}
                        style={{ borderRadius: 'var(--radius-pill)', padding: '6px 12px', fontSize: '11.5px' }}
                      >
                        <ArrowRightLeft size={13} />
                        <span>Realocar</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => toggleExpand(prod.id)}
                        style={{
                          width: '30px',
                          height: '30px',
                          padding: 0,
                          borderRadius: '50%',
                          color: 'var(--text-muted)',
                        }}
                        title={isExpanded ? 'Recolher variações' : 'Ver variações'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clean Variants Grid with Code, Photo, Box Numbers & Stock */}
                {isExpanded && prod.variants.length > 0 && (
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      borderTop: '1px solid var(--border-light)',
                      padding: '14px 20px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {prod.variants.map((v) => {
                      const varStock = v.stock_units || 0;
                      const isVarOut = varStock === 0;

                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedProductModal(prod)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            opacity: isVarOut ? 0.65 : 1,
                            textAlign: 'left',
                          }}
                        >
                          {/* Variant Left: Photo + Structured Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                            <ProductThumb
                              src={v.image_url || prod.image_url}
                              alt={v.variant_sku}
                              hexColor={v.hex_color}
                              size={44}
                            />

                            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {/* Top Line: SKU Badge + Name */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                    background: 'var(--bg-surface)',
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    border: '1px solid var(--border-light)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {v.variant_sku}
                                </span>
                                {v.hex_color && (
                                  <span
                                    style={{
                                      width: '10px',
                                      height: '10px',
                                      borderRadius: '50%',
                                      backgroundColor: v.hex_color,
                                      border: '1px solid rgba(0,0,0,0.15)',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <span
                                  style={{
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {v.aroma_flavor || v.color_tone || prod.name_pt}
                                </span>
                              </div>

                              {/* Bottom Line: Box Numbers + Location Pills */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    color: 'var(--helen-red)',
                                    fontWeight: 700,
                                  }}
                                >
                                  <MapPin size={10} />
                                  Rua {v.aisle || 'A'}-{v.shelf || '01'}
                                </span>
                                {v.box_numbers && (
                                  <>
                                    <span>•</span>
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        color: v.is_mixed_box ? '#D97706' : 'var(--text-secondary)',
                                        fontWeight: 700,
                                      }}
                                    >
                                      <Boxes size={10} />
                                      Cx #{v.box_numbers}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Variant Right: Stock Quantity + Boxes Info */}
                          <div
                            style={{
                              textAlign: 'right',
                              flexShrink: 0,
                              paddingLeft: '12px',
                              borderLeft: '1px solid var(--border-light)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 800,
                                color: isVarOut ? 'var(--color-danger)' : '#10B981',
                                lineHeight: 1.2,
                              }}
                            >
                              {isVarOut
                                ? 'Esgotado'
                                : v.unit_label === 'Dúzia' && v.qty_original
                                ? `${v.qty_original} dz`
                                : `${varStock.toLocaleString('pt-BR')} ${v.unit_label === 'Pacote' ? 'pct' : 'pç'}`}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                              {v.unit_label === 'Dúzia' ? `${varStock.toLocaleString('pt-BR')} pç • ` : ''}
                              {v.boxes_count !== undefined && v.boxes_count > 0 ? `${v.boxes_count} cx` : ''}
                              {v.units_per_box ? ` (${v.units_per_box}/cx)` : ''}
                              {v.is_mixed_box ? (v.boxes_count ? ' + mista' : 'Caixa mista') : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Product Details Modal when clicking on a product */}
      {selectedProductModal && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProductModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '740px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '18px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              textAlign: 'left',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                <ProductThumb src={selectedProductModal.image_url} alt={selectedProductModal.name_pt} size={64} />
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedProductModal.name_pt}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {selectedProductModal.supplier_code}
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {selectedProductModal.category}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: 'var(--helen-red)',
                      }}
                    >
                      <MapPin size={12} />
                      {selectedProductModal.location_summary}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedProductModal(null)}
                style={{ width: '34px', height: '34px', padding: 0, borderRadius: '50%', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Variants Section Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Variações & Endereçamento ({selectedProductModal.variants.length})
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  Total: {(selectedProductModal.total_stock_units || 0).toLocaleString('pt-BR')} pç
                </span>
              </div>

              {/* Structured Variant Cards */}
              {selectedProductModal.variants.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '16px 18px',
                    borderRadius: '14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {/* Left: Thumbnail + Hierarchical Details */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                    <ProductThumb
                      src={v.image_url || selectedProductModal.image_url}
                      alt={v.variant_sku}
                      hexColor={v.hex_color}
                      size={52}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0, textAlign: 'left' }}>
                      {/* Line 1: SKU Badge + Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12.5px',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            background: 'var(--helen-black)',
                            padding: '3px 9px',
                            borderRadius: '6px',
                          }}
                        >
                          {v.variant_sku}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {v.aroma_flavor || v.color_tone}
                        </span>
                        {v.collection_code && (
                          <HashtagSwatch
                            collectionCode={v.collection_code}
                            colorCode={v.color_code}
                            hexColor={v.hex_color}
                            size="sm"
                          />
                        )}
                      </div>

                      {/* Line 2: Structured Metadata Badges (Location, Box Numbers, Packaging, Container) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '4px 9px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: 'var(--helen-red)',
                          }}
                        >
                          <MapPin size={12} />
                          {v.warehouse_code || 'DEP1'} • Rua {v.aisle}-{v.shelf} ({v.level})
                        </span>

                        {v.box_numbers && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '4px 9px',
                              borderRadius: '6px',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <Boxes size={12} color="var(--text-secondary)" />
                            Caixas: {v.box_numbers}
                          </span>
                        )}

                        {v.is_mixed_box && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              padding: '4px 9px',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.14)',
                              color: '#D97706',
                            }}
                          >
                            + 1 Caixa Mista
                          </span>
                        )}

                        {v.packaging_info && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: 500,
                              padding: '4px 9px',
                              borderRadius: '6px',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <Package size={12} color="var(--text-muted)" />
                            {v.packaging_info}
                          </span>
                        )}

                        {v.container_date && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              padding: '2px 4px',
                            }}
                          >
                            Contêiner {v.container_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stock Summary + Action Button separated by vertical divider */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      paddingLeft: '16px',
                      borderLeft: '1px solid var(--border-light)',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: (v.stock_units || 0) === 0 ? 'var(--color-danger)' : '#10B981',
                          lineHeight: 1.2,
                        }}
                      >
                        {(v.stock_units || 0).toLocaleString('pt-BR')} pç
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '3px' }}>
                        {v.boxes_count || 0} cx {v.units_per_box ? `(${v.units_per_box}/cx)` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setSelectedProductModal(null);
                        onOpenLabelModal(selectedProductModal, v);
                      }}
                      style={{
                        height: '36px',
                        borderRadius: 'var(--radius-pill)',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Barcode size={14} />
                      <span>Etiqueta</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

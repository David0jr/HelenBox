import React, { useState } from 'react';
import {
  Search,
  Plus,
  Barcode,
  ArrowRightLeft,
  MapPin,
  Package,
} from 'lucide-react';
import type { Product, ProductVariant, ProductUom } from '../shared/types';
import { UomBadge, StatusPill } from '../shared/ui/Badge';
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

  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const q = filterText.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prod.name_pt.toLowerCase().includes(q) ||
      (prod.name_cn && prod.name_cn.toLowerCase().includes(q)) ||
      prod.sku_helenbox.toLowerCase().includes(q) ||
      prod.supplier_code.toLowerCase().includes(q) ||
      prod.variants.some(
        (v) =>
          v.variant_sku.toLowerCase().includes(q) ||
          (v.collection_code && v.collection_code.toLowerCase().includes(q)) ||
          (v.color_code && v.color_code.toLowerCase().includes(q)) ||
          (v.aroma_flavor && v.aroma_flavor.toLowerCase().includes(q)) ||
          (v.color_name && v.color_name.toLowerCase().includes(q))
      );

    const matchesCategory = selectedCategory === 'ALL' || prod.category === selectedCategory;

    const units = prod.total_stock_units || 0;
    if (activeTab === 'IN_STOCK' && units <= 20) return false;
    if (activeTab === 'LOW_STOCK' && (units > 20 || units === 0)) return false;
    if (activeTab === 'OUT_OF_STOCK' && units > 0) return false;

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
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
              Catálogo de Produtos Helen Color
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Gerenciamento de estoque multi-unidade (UN, DZ, CX, CXM) e esmaltes por #hashtag.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onAddNewProduct}>
          <Plus size={15} />
          Cadastrar Produto
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            <span>Todos os Produtos</span>
            <span className="count">{products.length}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${activeTab === 'IN_STOCK' ? 'active' : ''}`}
            onClick={() => setActiveTab('IN_STOCK')}
          >
            <span>Em Estoque</span>
            <span className="count">{products.filter((p) => (p.total_stock_units || 0) > 20).length}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${activeTab === 'LOW_STOCK' ? 'active' : ''}`}
            onClick={() => setActiveTab('LOW_STOCK')}
          >
            <span>Estoque Baixo</span>
            <span className="count">{products.filter((p) => (p.total_stock_units || 0) <= 20 && (p.total_stock_units || 0) > 0).length}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${activeTab === 'OUT_OF_STOCK' ? 'active' : ''}`}
            onClick={() => setActiveTab('OUT_OF_STOCK')}
          >
            <span>Esgotados</span>
            <span className="count">{products.filter((p) => (p.total_stock_units || 0) === 0).length}</span>
          </button>
        </div>

        {/* Search input & Category dropdown */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Filtrar por nome, SKU, #861 #50..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
              }}
            />
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="Óleos de Cutícula">Óleos de Cutícula</option>
            <option value="Esmalte em Gel">Esmalte em Gel</option>
            <option value="Gel Construtor">Gel Construtor</option>
            <option value="Preparadores & Cuidados">Preparadores & Cuidados</option>
          </select>
        </div>
      </div>

      {/* Dense Products Table */}
      <div className="table-container">
        <table className="hb-table">
          <thead>
            <tr>
              <th style={{ width: '38%' }}>Produto & Variações (#Hashtags)</th>
              <th style={{ width: '20%' }}>Código / Fábrica CN</th>
              <th style={{ width: '15%' }}>Saldo Total</th>
              <th style={{ width: '15%' }}>Localização WMS</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((prod) => {
              const status =
                (prod.total_stock_units || 0) === 0
                  ? 'OUT_OF_STOCK'
                  : (prod.total_stock_units || 0) <= 20
                  ? 'LOW_STOCK'
                  : 'IN_STOCK';

              return (
                <React.Fragment key={prod.id}>
                  {/* Main Product Parent Row */}
                  <tr style={{ background: 'var(--bg-surface)' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface-hover)',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={prod.image_url}
                            alt={prod.name_pt}
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                            {prod.name_pt}
                          </div>
                          {prod.name_cn && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {prod.name_cn}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                            <span className="badge badge-neutral">
                              {prod.category}
                            </span>
                            <StatusPill status={status} />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                        {prod.sku_helenbox}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        CN: {prod.supplier_code}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {prod.total_stock_units} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {Math.floor((prod.total_stock_units || 0) / 1200)} Caixas Master (CXM)
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} color="var(--text-muted)" />
                        <span>{prod.location_summary}</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => onOpenLabelModal(prod, prod.variants[0])}
                          title="Imprimir etiquetas de código de barras"
                        >
                          <Barcode size={13} />
                          Etiqueta
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => onOpenRelocateModal(prod, prod.variants[0])}
                          title="Mover carga de rua/prateleira"
                        >
                          <ArrowRightLeft size={13} />
                          Realocar
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Child Variant Rows (Hashtags #861 #50, Aromas, UoMs) */}
                  {prod.variants.map((v) => (
                    <tr
                      key={v.id}
                      style={{
                        background: 'var(--table-stripe)',
                        borderLeft: '3px solid var(--border-light)',
                      }}
                    >
                      <td style={{ paddingLeft: '54px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {v.collection_code ? (
                            <HashtagSwatch
                              collectionCode={v.collection_code}
                              colorCode={v.color_code}
                              hexColor={v.hex_color}
                              colorName={v.color_name}
                              size="sm"
                            />
                          ) : (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Aroma: <strong>{v.aroma_flavor || v.color_tone}</strong>
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({v.volume})</span>
                        </div>
                      </td>

                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {v.variant_sku}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '12px' }}>{v.stock_units || 0} un</span>
                          {v.uoms?.map((u) => (
                            <UomBadge key={u.id} uom={u.uom_type} />
                          ))}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          Rua {v.aisle || 'A'}-P{v.shelf || '01'} ({v.level || 'N1'})
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => onOpenLabelModal(prod, v)}
                          style={{ fontSize: '11px', padding: '3px 6px' }}
                        >
                          <Barcode size={12} />
                          {v.uoms?.[0]?.barcode || 'UN-000'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

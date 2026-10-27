import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  ArrowRightLeft,
  AlertTriangle,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { Product, ProductVariant, Warehouse } from '../shared/types';
import type { NavTab } from '../widgets/Sidebar/Sidebar';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { BackButton } from '../shared/ui/BackButton';

import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/context/AppContext';
import { TAB_ROUTE_MAP } from '../widgets/Sidebar/Sidebar';

interface WarehouseMapPageProps {
  currentWarehouse?: Warehouse;
  warehouses?: Warehouse[];
  onSelectWarehouse?: (w: Warehouse) => void;
  products?: (Product & { variants: ProductVariant[] })[];
  onOpenRelocateModal?: (product: Product, variant?: ProductVariant) => void;
  onGoBack?: () => void;
  onNavigate?: (tab: NavTab) => void;
}

export const WarehouseMapPage: React.FC<WarehouseMapPageProps> = ({
  currentWarehouse: propCurrentWarehouse,
  warehouses: propWarehouses,
  onSelectWarehouse: propOnSelectWarehouse,
  products: propProducts,
  onOpenRelocateModal: propOnOpenRelocateModal,
  onGoBack,
  onNavigate: propOnNavigate,
}) => {
  const navigate = useNavigate();
  const appContext = useApp();

  const currentWarehouse = propCurrentWarehouse || appContext.currentWarehouse;
  const warehouses = propWarehouses || appContext.warehouses;
  const onSelectWarehouse = propOnSelectWarehouse || appContext.setCurrentWarehouse;
  const products = propProducts || appContext.products;
  const onOpenRelocateModal = propOnOpenRelocateModal || appContext.openRelocateModal;

  const onNavigate = (tab: NavTab) => {
    if (propOnNavigate) {
      propOnNavigate(tab);
    } else {
      navigate(TAB_ROUTE_MAP[tab] || '/dashboard');
    }
  };

  const [selectedAisle, setSelectedAisle] = useState('B');
  const [selectedShelf, setSelectedShelf] = useState('01');

  const aisles = [
    { id: 'A', name: 'Rua A', category: 'Óleos de Cutícula & Cuidados', capacity: '85%' },
    { id: 'B', name: 'Rua B', category: 'Esmaltes em Gel & Magnéticos #861', capacity: '92%' },
    { id: 'C', name: 'Rua C', category: 'Gel Construtor & Líquidos Prep', capacity: '60%' },
    { id: 'D', name: 'Rua D', category: 'Acessórios, Pincéis & Cabines', capacity: '40%' },
  ];

  const shelves = ['01', '02', '03', '04'];
  const levels = ['N3 (Superior/Pulmão)', 'N2 (Intermediário)', 'N1 (Picking Baixo)'];

  // Find products stored in selected coordinate
  const currentVariants: { product: Product; variant: ProductVariant }[] = [];
  products.forEach((prod) => {
    prod.variants.forEach((v) => {
      if (
        (v.warehouse_code || 'DEP1') === currentWarehouse.code &&
        v.aisle === selectedAisle &&
        v.shelf === selectedShelf
      ) {
        currentVariants.push({ product: prod, variant: v });
      }
    });
  });

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
              Mapa do Galpão & Localização de Cargas
            </h1>
            <span className="badge badge-info">{currentWarehouse.code}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Visualize corredores, estantes e realize transferências rápidas em 2 cliques.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('relocate')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}
          >
            <ArrowRightLeft size={14} />
            <span>Realocar Carga (Transferência)</span>
          </button>
        )}
      </div>

      {/* Main Two-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Left: Interactive Warehouse Grid */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
              Corredores & Ruas ({currentWarehouse.name})
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Clique na rua e prateleira para inspecionar
            </span>
          </div>

          {/* Aisles selection bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {aisles.map((a) => {
              const isSelected = selectedAisle === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAisle(a.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--helen-red)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--helen-red-light)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? 'var(--helen-red)' : 'var(--text-primary)' }}>
                      {a.name}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {a.capacity}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.category}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shelves visual matrix */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Estantes da {aisles.find((a) => a.id === selectedAisle)?.name}:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {shelves.map((sh) => {
                const isSelected = selectedShelf === sh;
                return (
                  <div
                    key={sh}
                    onClick={() => setSelectedShelf(sh)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface-hover)',
                      border: isSelected ? '2px solid var(--helen-red)' : '1px solid var(--border-light)',
                      boxShadow: isSelected ? '0 0 10px var(--helen-red-glow)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Prateleira
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: isSelected ? 'var(--helen-red)' : 'var(--text-primary)', marginTop: '2px' }}>
                      P-{sh}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                      3 Níveis Ativos
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vertical Rack Simulation (N3, N2, N1) */}
          <div style={{ marginTop: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--bg-surface)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
              Corte Vertical: {selectedAisle}-P{selectedShelf}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {levels.map((lvl, idx) => (
                <div
                  key={lvl}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: idx === 1 ? 'rgba(229, 30, 43, 0.08)' : 'var(--bg-surface-hover)',
                    border: idx === 1 ? '1px dashed var(--helen-red)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {lvl}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {idx === 1 ? 'Ocupado com Esmaltes Magnéticos' : 'Capacidade Disponível'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Position Inventory Inspector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--helen-red)', fontWeight: 800, fontSize: '14px' }}>
              <MapPin size={17} />
              <span>Posição: {currentWarehouse.code}-Rua {selectedAisle}-P{selectedShelf}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Produtos alocados nesta estante disponíveis para separação imediata.
            </p>
          </div>

          {/* Current Variants list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {currentVariants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontSize: '13px', fontWeight: 600 }}>Nenhum produto cadastrado nesta prateleira.</p>
                <p style={{ fontSize: '11.5px', marginTop: '2px' }}>Use "Realocar Carga" para transferir caixas para cá.</p>
              </div>
            ) : (
              currentVariants.map(({ product, variant }) => (
                <div
                  key={variant.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={variant.image_url || product.image_url}
                      alt={product.name_pt}
                      style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {product.name_pt}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        {variant.collection_code ? (
                          <HashtagSwatch
                            collectionCode={variant.collection_code}
                            colorCode={variant.color_code}
                            hexColor={variant.hex_color}
                            size="sm"
                          />
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--helen-red)', fontWeight: 600 }}>
                            {variant.aroma_flavor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                    <span>
                      Saldo: <strong>{variant.stock_units || 0} un</strong>
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onOpenRelocateModal(product, variant)}
                    >
                      <ArrowRightLeft size={13} color="#3B82F6" />
                      Mover para Outra Rua
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

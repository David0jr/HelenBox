import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  AlertCircle,
  MapPin,
  Building2,
  Package,
  Layers,
  History,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import type { Product, ProductVariant, Warehouse } from '../shared/types';
import type { NavTab } from '../widgets/Sidebar/Sidebar';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { playSuccessSound } from '../shared/lib/audioFeedback';
import { BackButton } from '../shared/ui/BackButton';

import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/context/AppContext';
import { TAB_ROUTE_MAP } from '../widgets/Sidebar/Sidebar';

interface RelocatePageProps {
  products?: (Product & { variants: ProductVariant[] })[];
  warehouses?: Warehouse[];
  onGoBack?: () => void;
  onNavigate?: (tab: NavTab) => void;
  onRelocateSuccess?: (newLocation: string, qty: number, productName: string) => void;
}

export const RelocatePage: React.FC<RelocatePageProps> = ({
  products: propProducts,
  warehouses: propWarehouses,
  onGoBack,
  onNavigate: propOnNavigate,
  onRelocateSuccess: propOnRelocateSuccess,
}) => {
  const navigate = useNavigate();
  const appContext = useApp();

  const products = propProducts || appContext.products;
  const warehouses = propWarehouses || appContext.warehouses;

  const onNavigate = (tab: NavTab) => {
    if (propOnNavigate) {
      propOnNavigate(tab);
    } else {
      navigate(TAB_ROUTE_MAP[tab] || '/dashboard');
    }
  };

  const onRelocateSuccess = (newLocation: string, qty: number, productName: string) => {
    if (propOnRelocateSuccess) {
      propOnRelocateSuccess(newLocation, qty, productName);
    } else {
      appContext.handleRelocateSuccess(newLocation, qty, productName);
    }
  };
  // Flatten variants list for selection
  const allVariants: { product: Product; variant: ProductVariant }[] = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      allVariants.push({ product: p, variant: v });
    });
  });

  // Selected item state
  const [selectedVariantId, setSelectedVariantId] = useState<string>(allVariants[0]?.variant.id || '');
  const [destWarehouse, setDestWarehouse] = useState<string>('DEP1');
  const [destAisle, setDestAisle] = useState<string>('B');
  const [destShelf, setDestShelf] = useState<string>('02');
  const [destLevel, setDestLevel] = useState<string>('N1');
  const [qty, setQty] = useState<number>(10);
  const [uom, setUom] = useState<string>('CXM');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const currentSelection = allVariants.find((i) => i.variant.id === selectedVariantId) || allVariants[0];

  const currentOriginLocation = currentSelection
    ? `${currentSelection.variant.warehouse_code || 'DEP1'} • Rua ${currentSelection.variant.aisle || 'A'} • Prateleira P-${currentSelection.variant.shelf || '01'} (${currentSelection.variant.level || 'N1'})`
    : 'Localização Desconhecida';

  const destinationLocation = `${destWarehouse} • Rua ${destAisle} • Prateleira P-${destShelf} (${destLevel})`;

  const handleConfirmRelocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelection) return;

    playSuccessSound();
    setIsSuccess(true);
    const msg = `Transferência de ${qty} ${uom} de ${currentSelection.product.name_pt} para ${destinationLocation} concluída com sucesso!`;
    setSuccessMessage(msg);

    onRelocateSuccess(destinationLocation, qty, currentSelection.product.name_pt);

    setTimeout(() => {
      setIsSuccess(false);
    }, 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header with direct Back button and Mapa do Galpão link */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {onGoBack && <BackButton onClick={onGoBack} />}
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                Realocação Ágil de Carga & Endereçamento
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Transferência física entre ruas e galpões sem travar pedidos ou congelar vendas.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('warehouse')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}
          >
            <MapPin size={14} color="var(--helen-red)" />
            <span>Ver Mapa Gráfico do Galpão</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* 2. Helen Color Non-Blocking Operational Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          fontSize: '12.5px',
          color: '#1E40AF',
        }}
      >
        <ShieldCheck size={18} style={{ flexShrink: 0, color: '#2563EB' }} />
        <span>
          <strong>Regra Helen Color (Estoque Sempre Disponível):</strong> As mercadorias em processo de realocação física continuam 100% ativas para conferência e bipagem de pedidos da Shopee e WhatsApp. O novo endereço é atualizado automaticamente no terminal de picking.
        </span>
      </div>

      {/* Success Notification Alert */}
      {isSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: '#ECFDF5',
            border: '1px solid #10B981',
            color: '#065F46',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <Check size={18} color="#10B981" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 3. Main Workbench Layout (2 Columns: Form on Left, Capacity & Audit on Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        {/* Left: Relocation Form */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <ArrowRightLeft size={16} color="var(--helen-red)" />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Configuração da Transferência
            </h2>
          </div>

          <form onSubmit={handleConfirmRelocate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Step 1: Select Item to Relocate */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                1. Selecione o Produto / Carga de Origem:
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              >
                {allVariants.map(({ product, variant }) => (
                  <option key={variant.id} value={variant.id}>
                    {product.name_pt} • {variant.variant_sku} {variant.collection_code ? `(${variant.collection_code} ${variant.color_code})` : ''} — Saldo: {variant.stock_units} un
                  </option>
                ))}
              </select>
            </div>

            {/* Current Location Display Card */}
            {currentSelection && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Localização Atual de Origem
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {currentOriginLocation}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Saldo neste endereço: <strong>{currentSelection.variant.stock_units} unidades</strong>
                  </div>
                </div>

                {currentSelection.variant.collection_code && (
                  <HashtagSwatch
                    collectionCode={currentSelection.variant.collection_code}
                    colorCode={currentSelection.variant.color_code}
                    hexColor={currentSelection.variant.hex_color}
                    size="md"
                  />
                )}
              </div>
            )}

            {/* Step 2: Destination Warehouse & Coordinates */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                2. Galpão e Coordenadas de Destino:
              </label>

              {/* Destination Warehouse Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setDestWarehouse('DEP1')}
                  className={`btn ${destWarehouse === 'DEP1' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  <Building2 size={14} />
                  <span>Galpão 1 (Matriz SP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDestWarehouse('DEP2')}
                  className={`btn ${destWarehouse === 'DEP2' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  <Building2 size={14} />
                  <span>Galpão 2 (Filial Shopee)</span>
                </button>
              </div>

              {/* Coordinates Grid: Aisle, Shelf, Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    RUA / CORREDOR
                  </span>
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
                      fontSize: '12.5px',
                    }}
                  >
                    <option value="A">Rua A (Óleos & Cuidado)</option>
                    <option value="B">Rua B (Esmaltes #861)</option>
                    <option value="C">Rua C (Géis Construtores)</option>
                    <option value="D">Rua D (Acessórios & Cabines)</option>
                  </select>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    PRATELEIRA
                  </span>
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
                      fontSize: '12.5px',
                    }}
                  >
                    <option value="01">P-01 (Baixa)</option>
                    <option value="02">P-02 (Média)</option>
                    <option value="03">P-03 (Média)</option>
                    <option value="04">P-04 (Alta / Pulmão)</option>
                  </select>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    NÍVEL / ANDAR
                  </span>
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
                      fontSize: '12.5px',
                    }}
                  >
                    <option value="N1">N1 (Picking Fácil)</option>
                    <option value="N2">N2 (Intermediário)</option>
                    <option value="N3">N3 (Palete Superior)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Quantity & UoM */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                3. Quantidade a Transferir:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontWeight: 800,
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
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
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    <option value="CXM">CXM - Caixa Master (1.200 un)</option>
                    <option value="CX">CX - Caixa Display (24 un)</option>
                    <option value="DZ">DZ - Dúzia (12 un)</option>
                    <option value="UN">UN - Unidades Avulsas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onGoBack}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '13px', borderRadius: 'var(--radius-pill)', gap: '8px' }}
              >
                <ArrowRightLeft size={15} />
                <span>Confirmar Transferência</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Destination Capacity Preview & Recent Relocations Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Destination Capacity Card */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Capacidade da Rua de Destino ({destAisle})
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Distribuição de ocupação nas estantes de {destAisle}:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['01', '02', '03', '04'].map((shelf) => {
                const isSelectedShelf = destShelf === shelf;
                const occ = shelf === '01' ? 90 : shelf === '02' ? 75 : shelf === '03' ? 60 : 30;

                return (
                  <div
                    key={shelf}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelectedShelf ? 'var(--bg-surface-hover)' : 'transparent',
                      border: isSelectedShelf ? '1px solid var(--helen-red)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: isSelectedShelf ? 700 : 500, color: 'var(--text-primary)' }}>
                      Prateleira P-{shelf} {isSelectedShelf && '(Selecionada)'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                      <div style={{ height: '6px', flex: 1, backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${occ}%`,
                            backgroundColor: occ > 80 ? 'var(--color-warning)' : '#10B981',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', width: '30px' }}>
                        {occ}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Relocations Table */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={15} color="var(--text-muted)" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Últimas Transferências no Galpão
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>Carlos Oliveira</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Hoje, 07:45</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Moveu 10 CXM de Esmalte #861 da <strong>Rua B-01</strong> para <strong>Rua B-03</strong>
                </div>
              </div>

              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>David HelenBox (Admin)</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Ontem, 16:20</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Moveu 20 CX de Óleo de Cutícula da <strong>Rua A-01</strong> para <strong>Rua A-02</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

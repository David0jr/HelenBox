import React, { useState } from 'react';
import {
  Package,
  Layers,
  Clock,
  ShoppingBag,
  ArrowRightLeft,
  Barcode,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product, ProductVariant, Order, ActionAuditLog } from '../shared/types';
import type { NavTab } from '../widgets/Sidebar/Sidebar';
import { TAB_ROUTE_MAP } from '../widgets/Sidebar/Sidebar';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { useApp } from '../app/context/AppContext';

interface DashboardPageProps {
  products?: (Product & { variants: ProductVariant[] })[];
  orders?: Order[];
  logs?: ActionAuditLog[];
  onNavigate?: (tab: NavTab) => void;
  onOpenRelocate?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  products: propProducts,
  orders: propOrders,
  logs: propLogs,
  onNavigate: propOnNavigate,
  onOpenRelocate: propOnOpenRelocate,
}) => {
  const navigate = useNavigate();
  const appContext = useApp();

  const products = propProducts || appContext.products;
  const orders = propOrders || appContext.orders;
  const logs = propLogs || appContext.logs;

  const onNavigate = (tab: NavTab) => {
    if (propOnNavigate) {
      propOnNavigate(tab);
    } else {
      navigate(TAB_ROUTE_MAP[tab] || '/dashboard');
    }
  };

  const onOpenRelocate = () => {
    if (propOnOpenRelocate) {
      propOnOpenRelocate();
    } else {
      appContext.openRelocateModal();
    }
  };
  // Timeframe filter state (Mês Atual / 30 Dias / Ano 2026)
  const [timeframe, setTimeframe] = useState<'month' | '30days' | 'year'>('month');
  const [isStockVisible, setIsStockVisible] = useState(true);
  const [orderChannelFilter, setOrderChannelFilter] = useState<'ALL' | 'SHOPEE' | 'WHATSAPP'>('ALL');
  const [logFilter, setLogFilter] = useState<'TODAS' | 'ENTRADAS' | 'SAIDAS'>('TODAS');

  // Aggregates
  const totalVariants = products.reduce((acc, p) => acc + p.variants.length, 0);
  const totalUnits = products.reduce((acc, p) => acc + (p.total_stock_units || 0), 0);
  const masterBoxesCount = Math.floor(totalUnits / 1200);
  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'PICKING');

  // Filtered orders for the new functional orders queue
  const displayOrders = orders.filter((o) => {
    if (orderChannelFilter === 'ALL') return true;
    return o.channel === orderChannelFilter;
  });

  // Filtered logs
  const displayLogs = logs.filter((l) => {
    if (logFilter === 'TODAS') return true;
    if (logFilter === 'SAIDAS') return l.action_type === 'SCAN_OUT';
    if (logFilter === 'ENTRADAS') return l.action_type === 'RELOCATE' || l.action_type === 'INVOICE_IMPORT' || l.action_type === 'UNBOX';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Executive Hero Card Banner (Exact structure of user's reference system) */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Top Row: Greeting & Timeframe Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Greeting matching reference "BOM DIA, DAVID ●" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              BOM DIA, DAVID
            </span>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
              }}
              title="Operação Online & Sincronizada"
            />
          </div>

          {/* Timeframe Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-hover)',
              padding: '3px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              style={{
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: timeframe === 'month' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: timeframe === 'month' ? 'var(--helen-black)' : 'transparent',
                color: timeframe === 'month' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Mês Atual
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30days')}
              style={{
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: timeframe === '30days' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: timeframe === '30days' ? 'var(--helen-black)' : 'transparent',
                color: timeframe === '30days' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              30 Dias
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('year')}
              style={{
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: timeframe === 'year' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: timeframe === 'year' ? 'var(--helen-black)' : 'transparent',
                color: timeframe === 'year' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Ano 2026
            </button>
          </div>
        </div>

        {/* Bottom Row: Metrics & Quick Action Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            {/* Metric 1: Estoque Consolidado */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                }}
              >
                <span>📦 ESTOQUE CONSOLIDADO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    letterSpacing: '-0.8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {isStockVisible ? `${totalUnits.toLocaleString('pt-BR')} un` : '•••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsStockVisible((prev) => !prev)}
                  title={isStockVisible ? 'Ocultar saldo' : 'Exibir saldo'}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {isStockVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>

            {/* Vertical Divider */}
            <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-light)' }} />

            {/* Metric 2: Caixas Master */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                }}
              >
                CAIXAS MASTER (CXM)
              </div>
              <div style={{ marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    letterSpacing: '-0.8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {isStockVisible ? `${masterBoxesCount} CXM` : '•••••••'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  (120 cx fracionadas)
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Pill-shaped executive action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onOpenRelocate}
              className="btn btn-secondary"
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              <ArrowRightLeft size={14} />
              <span>Realocar Carga</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('picking')}
              className="btn btn-primary"
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}
            >
              <Barcode size={15} />
              <span>+ Bipar Pedido</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Operational KPI Cards (Executive & Refined, replacing clunky cards) */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Card 1: Total SKUs */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                marginBottom: '12px',
              }}
            >
              <Package size={16} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PRODUTOS CADASTRADOS
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {products.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>SKUs</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {totalVariants} variações (#hashtags e aromas)
            </div>
          </div>

          {/* Card 2: Caixas Master */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--helen-red)',
                marginBottom: '12px',
              }}
            >
              <Layers size={16} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CAIXAS MASTER (CXM)
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--helen-red)', letterSpacing: '-0.5px' }}>
              {masterBoxesCount} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>caixas</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Importações conferidas da China
            </div>
          </div>

          {/* Card 3: FEFO Priority */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                marginBottom: '12px',
              }}
            >
              <Clock size={16} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PRIORIDADE FEFO (VALIDADE)
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#2563EB', letterSpacing: '-0.5px' }}>
              2 <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>lotes</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Lote 2026-08 (#861 #50) vence em 18d
            </div>
          </div>

          {/* Card 4: Pedidos Pendentes */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                marginBottom: '12px',
              }}
            >
              <ShoppingBag size={16} />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              EXPEDIÇÃO MULTICANAL
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#D97706', letterSpacing: '-0.5px' }}>
              {pendingOrders.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>pedidos</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Fila Shopee Express & WhatsApp
            </div>
          </div>
        </div>
      </div>

      {/* 3. Two Columns: Fila de Pedidos para Bipagem (Substituted Destaques) + Movimentações Recentes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '20px' }}>
        {/* Left: Fila de Pedidos Multicanal (High Utility, Actionable) */}
        <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header & Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                Fila de Pedidos para Bipagem & Expedição
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Separação orientada por lote FEFO e conferência multicanal
              </p>
            </div>

            {/* Channel Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-surface-hover)',
                  padding: '2px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOrderChannelFilter('ALL')}
                  style={{
                    padding: '3px 9px',
                    fontSize: '11px',
                    fontWeight: orderChannelFilter === 'ALL' ? 700 : 500,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: orderChannelFilter === 'ALL' ? 'var(--helen-black)' : 'transparent',
                    color: orderChannelFilter === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setOrderChannelFilter('SHOPEE')}
                  style={{
                    padding: '3px 9px',
                    fontSize: '11px',
                    fontWeight: orderChannelFilter === 'SHOPEE' ? 700 : 500,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: orderChannelFilter === 'SHOPEE' ? 'var(--helen-black)' : 'transparent',
                    color: orderChannelFilter === 'SHOPEE' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Shopee
                </button>
                <button
                  type="button"
                  onClick={() => setOrderChannelFilter('WHATSAPP')}
                  style={{
                    padding: '3px 9px',
                    fontSize: '11px',
                    fontWeight: orderChannelFilter === 'WHATSAPP' ? 700 : 500,
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: orderChannelFilter === 'WHATSAPP' ? 'var(--helen-black)' : 'transparent',
                    color: orderChannelFilter === 'WHATSAPP' ? '#FFFFFF' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  WhatsApp
                </button>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('orders')}
                style={{ fontSize: '11.5px', color: 'var(--helen-red)', padding: '4px 8px' }}
                title="Ver todos os pedidos"
              >
                Ver Fila
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayOrders.map((order) => {
              const isShopee = order.channel === 'SHOPEE';

              return (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-light)',
                    gap: '12px',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  {/* Left: Channel Badge & Customer Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: isShopee ? '#FFF7ED' : '#F0FDF4',
                          color: isShopee ? '#EA580C' : '#16A34A',
                          border: `1px solid ${isShopee ? '#FDBA74' : '#86EFAC'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isShopee ? <Truck size={10} /> : <Smartphone size={10} />}
                        {isShopee ? 'Shopee Express' : 'WhatsApp Direto'}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.order_number}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {order.customer_name}
                    </div>

                    {/* Order items preview with hashtag swatches */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-surface)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <span>{item.quantity_ordered}x</span>
                          <span>{item.product_name}</span>
                          {item.collection_code && (
                            <HashtagSwatch
                              collectionCode={item.collection_code}
                              colorCode={item.color_code}
                              hexColor={item.hex_color}
                              size="sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Action Button to start picking */}
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onNavigate('picking')}
                      className="btn btn-primary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-pill)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Barcode size={13} />
                      <span>Bipar</span>
                    </button>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {order.created_at}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Movimentações Recentes & Auditoria (Clean timeline matching reference) */}
        <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header & Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              Últimas Movimentações
            </h2>

            {/* Filter Pills matching reference: TODAS / ENTRADAS / SAÍDAS */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-surface-hover)',
                padding: '2px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-light)',
              }}
            >
              <button
                type="button"
                onClick={() => setLogFilter('TODAS')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: logFilter === 'TODAS' ? 700 : 500,
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: logFilter === 'TODAS' ? 'var(--helen-black)' : 'transparent',
                  color: logFilter === 'TODAS' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                TODAS
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('ENTRADAS')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: logFilter === 'ENTRADAS' ? 700 : 500,
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: logFilter === 'ENTRADAS' ? 'var(--helen-black)' : 'transparent',
                  color: logFilter === 'ENTRADAS' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                ENTRADAS
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('SAIDAS')}
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: logFilter === 'SAIDAS' ? 700 : 500,
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: logFilter === 'SAIDAS' ? 'var(--helen-black)' : 'transparent',
                  color: logFilter === 'SAIDAS' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                SAÍDAS
              </button>
            </div>
          </div>

          {/* Timeline List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayLogs.slice(0, 5).map((l) => {
              const isScanOut = l.action_type === 'SCAN_OUT';
              const isRelocate = l.action_type === 'RELOCATE';

              return (
                <div
                  key={l.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-light)',
                    fontSize: '12px',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: isScanOut ? '#10B981' : isRelocate ? '#2563EB' : 'var(--helen-red)',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12px' }}>
                        {l.user_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {l.created_at}
                    </span>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '11.5px', paddingLeft: '13px' }}>
                    {l.details}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom link to full audit log */}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onNavigate('logs')}
            style={{
              padding: '6px',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: '4px',
            }}
          >
            <span>Ver Auditoria Completa</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

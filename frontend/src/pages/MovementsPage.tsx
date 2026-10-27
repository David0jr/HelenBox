import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  Barcode,
  Truck,
  Smartphone,
  FileSpreadsheet,
  Calendar,
  User,
  MapPin,
  Download,
  Flame,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { StockMovement } from '../shared/types';
import type { ProductSalesVelocity } from '../shared/mockData';
import { INITIAL_MOVEMENTS, INITIAL_SALES_VELOCITY } from '../shared/mockData';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { UomBadge } from '../shared/ui/Badge';
import { BackButton } from '../shared/ui/BackButton';

interface MovementsPageProps {
  onGoBack?: () => void;
}

export const MovementsPage: React.FC<MovementsPageProps> = ({ onGoBack }) => {
  const [activeView, setActiveView] = useState<'TABLE' | 'ANALYTICS'>('TABLE');
  const [flowFilter, setFlowFilter] = useState<'ALL' | 'OUT' | 'IN' | 'TRANSFER'>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'SHOPEE' | 'WHATSAPP' | 'CHINA_INVOICE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [movements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [salesVelocity] = useState<ProductSalesVelocity[]>(INITIAL_SALES_VELOCITY);

  // Filter movements
  const filteredMovements = movements.filter((mov) => {
    // Flow filter
    if (flowFilter === 'OUT' && mov.movement_type !== 'OUT_ORDER') return false;
    if (flowFilter === 'IN' && mov.movement_type !== 'IN_INVOICE') return false;
    if (flowFilter === 'TRANSFER' && mov.movement_type !== 'TRANSFER') return false;

    // Channel filter
    if (channelFilter !== 'ALL' && mov.channel !== channelFilter) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      mov.product_name.toLowerCase().includes(q) ||
      (mov.variant_sku && mov.variant_sku.toLowerCase().includes(q)) ||
      (mov.collection_code && mov.collection_code.toLowerCase().includes(q)) ||
      (mov.color_code && mov.color_code.toLowerCase().includes(q)) ||
      (mov.order_number && mov.order_number.toLowerCase().includes(q)) ||
      mov.user_name.toLowerCase().includes(q) ||
      mov.barcode_scanned.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalOutUnits = movements
    .filter((m) => m.movement_type === 'OUT_ORDER')
    .reduce((acc, m) => acc + m.quantity_units, 0);

  const totalInUnits = movements
    .filter((m) => m.movement_type === 'IN_INVOICE')
    .reduce((acc, m) => acc + m.quantity_units, 0);

  const topProduct = salesVelocity[0];
  const lowestProduct = salesVelocity[salesVelocity.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Executive Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onGoBack && <BackButton onClick={onGoBack} />}
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
              Histórico de Movimentações (Entradas & Saídas)
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Rastreabilidade completa de bipagens no leitor óptico, entradas da China e giro de estoque.
          </p>
        </div>

        {/* View Mode Toggle & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Toggle Button: Tabela vs Análise */}
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
              onClick={() => setActiveView('TABLE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: activeView === 'TABLE' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeView === 'TABLE' ? 'var(--helen-black)' : 'transparent',
                color: activeView === 'TABLE' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <ArrowLeftRight size={13} />
              <span>Tabela Operacional</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('ANALYTICS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: activeView === 'ANALYTICS' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: activeView === 'ANALYTICS' ? 'var(--helen-black)' : 'transparent',
                color: activeView === 'ANALYTICS' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <TrendingUp size={13} />
              <span>Giro de Vendas (Mais / Menos)</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => alert('Exportando relatório completo de entradas e saídas (CSV/Excel)...')}
            style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: 'var(--radius-pill)' }}
          >
            <Download size={14} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Matching executive standard) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Total Saídas */}
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
            <ArrowUpRight size={16} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL DE SAÍDAS (BIPADAS)
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {totalOutUnits.toLocaleString('pt-BR')} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Expedição Shopee & WhatsApp
          </div>
        </div>

        {/* Card 2: Total Entradas */}
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
            <ArrowDownLeft size={16} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL DE ENTRADAS (CHINA)
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px', color: '#059669', letterSpacing: '-0.5px' }}>
            {totalInUnits.toLocaleString('pt-BR')} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>un</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            60 Caixas Master importadas
          </div>
        </div>

        {/* Card 3: Mais Vendido (Top 1) */}
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
            <Flame size={16} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            MAIS VENDIDO (TOP GIRO)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#2563EB', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{topProduct.collection_code} {topProduct.color_code}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>({topProduct.units_sold_30d} un)</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {topProduct.product_name.slice(0, 32)}...
          </div>
        </div>

        {/* Card 4: Menor Giro */}
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
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            MENOR GIRO (ATENÇÃO)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px', color: '#D97706', letterSpacing: '-0.5px' }}>
            {lowestProduct.units_sold_30d} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>un / 30d</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {lowestProduct.product_name.slice(0, 30)}...
          </div>
        </div>
      </div>

      {/* 3. Main View: Table OR Sales Analytics */}
      {activeView === 'TABLE' ? (
        <div className="table-container" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Filter Bar Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            {/* Left: Flow Pills */}
            <div className="filter-tabs">
              <button
                type="button"
                className={`filter-tab ${flowFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFlowFilter('ALL')}
              >
                Todas <span className="count">{movements.length}</span>
              </button>
              <button
                type="button"
                className={`filter-tab ${flowFilter === 'OUT' ? 'active-red' : ''}`}
                onClick={() => setFlowFilter('OUT')}
              >
                Saídas (Bipagens) <span className="count">{movements.filter((m) => m.movement_type === 'OUT_ORDER').length}</span>
              </button>
              <button
                type="button"
                className={`filter-tab ${flowFilter === 'IN' ? 'active' : ''}`}
                onClick={() => setFlowFilter('IN')}
              >
                Entradas (China) <span className="count">{movements.filter((m) => m.movement_type === 'IN_INVOICE').length}</span>
              </button>
              <button
                type="button"
                className={`filter-tab ${flowFilter === 'TRANSFER' ? 'active' : ''}`}
                onClick={() => setFlowFilter('TRANSFER')}
              >
                Transferências <span className="count">{movements.filter((m) => m.movement_type === 'TRANSFER').length}</span>
              </button>
            </div>

            {/* Right: Search Input & Channel Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', minWidth: '320px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '0 12px',
                  height: '34px',
                  width: '280px',
                }}
              >
                <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Buscar produto, pedido, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    padding: '0 8px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as any)}
                style={{
                  height: '34px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Todos os Canais</option>
                <option value="SHOPEE">Shopee Express</option>
                <option value="WHATSAPP">WhatsApp Direto</option>
                <option value="CHINA_INVOICE">Invoices da China</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="hb-table">
              <thead>
                <tr>
                  <th style={{ width: '170px' }}>Horário do Bip / Registro</th>
                  <th style={{ width: '130px' }}>Fluxo</th>
                  <th>Produto & Variação</th>
                  <th style={{ width: '110px' }}>Quantidade</th>
                  <th style={{ width: '160px' }}>Pedido / Documento</th>
                  <th>Origem ➔ Destino</th>
                  <th style={{ width: '170px' }}>Operador Responsável</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      Nenhuma movimentação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov) => {
                    const isOut = mov.movement_type === 'OUT_ORDER';
                    const isIn = mov.movement_type === 'IN_INVOICE';
                    const isTransfer = mov.movement_type === 'TRANSFER';

                    return (
                      <tr key={mov.id}>
                        {/* Horário Exato do Bip */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                              {mov.created_at}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {mov.exact_time}
                            </span>
                          </div>
                        </td>

                        {/* Fluxo / Tipo */}
                        <td>
                          {isOut && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: '#FEF2F2',
                                color: 'var(--helen-red)',
                                border: '1px solid #FECACA',
                              }}
                            >
                              <ArrowUpRight size={11} />
                              SAÍDA
                            </span>
                          )}
                          {isIn && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                              }}
                            >
                              <ArrowDownLeft size={11} />
                              ENTRADA
                            </span>
                          )}
                          {isTransfer && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                              }}
                            >
                              <ArrowLeftRight size={11} />
                              REALOCAÇÃO
                            </span>
                          )}
                        </td>

                        {/* Produto & Variação */}
                        <td>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                                {mov.product_name}
                              </span>
                              {mov.collection_code && (
                                <HashtagSwatch
                                  collectionCode={mov.collection_code}
                                  colorCode={mov.color_code}
                                  hexColor={mov.hex_color}
                                  size="sm"
                                />
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                              SKU: {mov.variant_sku || 'N/A'} • Barcode: {mov.barcode_scanned}
                            </div>
                          </div>
                        </td>

                        {/* Quantidade */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {mov.quantity_units.toLocaleString('pt-BR')}
                            </span>
                            <UomBadge uom={mov.uom_detected} />
                          </div>
                        </td>

                        {/* Pedido / Documento */}
                        <td>
                          {mov.order_number ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {mov.channel === 'SHOPEE' && (
                                  <span style={{ color: '#EA580C', fontSize: '10px', fontWeight: 700 }}>
                                    [Shopee]
                                  </span>
                                )}
                                {mov.channel === 'WHATSAPP' && (
                                  <span style={{ color: '#16A34A', fontSize: '10px', fontWeight: 700 }}>
                                    [WhatsApp]
                                  </span>
                                )}
                                <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                                  {mov.order_number}
                                </span>
                              </div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                {mov.notes}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                          )}
                        </td>

                        {/* Origem ➔ Destino */}
                        <td>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{mov.from_location_code || '—'}</span>
                            <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>➔</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mov.to_location_code || '—'}</span>
                          </div>
                        </td>

                        {/* Operador Responsável */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-surface-hover)',
                                border: '1px solid var(--border-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              {mov.user_name.charAt(0)}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {mov.user_name}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 4. Sales Velocity & ABC Analysis View (Mais Vendidos vs Menos Vendidos) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Left Card: Ranking dos Mais Vendidos (Curva A - Alta Rotatividade) */}
            <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} color="var(--helen-red)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Produtos Mais Vendidos (Alta Rotatividade)
                  </h3>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Velocidade diária de saída em pedidos multicanal (Shopee & WhatsApp)
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {salesVelocity
                  .filter((p) => p.status === 'HIGH_TURNOVER' || p.status === 'MEDIUM_TURNOVER')
                  .map((item, index) => {
                    const percentOfTop = Math.round((item.units_sold_30d / topProduct.units_sold_30d) * 100);

                    return (
                      <div
                        key={item.variant_sku}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-light)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: index === 0 ? 'var(--helen-red)' : 'var(--helen-black)',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {index + 1}
                            </span>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {item.product_name}
                                </span>
                                {item.collection_code && (
                                  <HashtagSwatch
                                    collectionCode={item.collection_code}
                                    colorCode={item.color_code}
                                    hexColor={item.hex_color}
                                    size="sm"
                                  />
                                )}
                              </div>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                SKU: {item.variant_sku} • {item.category}
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.units_sold_30d.toLocaleString('pt-BR')} un
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              ~{item.daily_sales_rate} un/dia
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar of Sales */}
                        <div>
                          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${percentOfTop}%`,
                                backgroundColor: index === 0 ? 'var(--helen-red)' : '#2563EB',
                                borderRadius: '3px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>

                        {/* AI Suggested Action */}
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {item.suggested_action}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Card: Alerta de Menor Giro & Estoque Parado (Curva C) */}
            <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} color="#D97706" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Menor Giro (Risco de Estoque Parado)
                  </h3>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Itens com baixa demanda nos últimos 30 dias que demandam ações comerciais
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {salesVelocity
                  .filter((p) => p.status === 'LOW_TURNOVER')
                  .map((item) => (
                    <div
                      key={item.variant_sku}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400E' }}>
                            {item.product_name}
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#B45309' }}>
                            SKU: {item.variant_sku} • Estoque atual: {item.current_stock_units} un
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#B45309' }}>
                            {item.units_sold_30d} un
                          </span>
                          <div style={{ fontSize: '10px', color: '#92400E' }}>
                            {item.days_of_stock_left} dias de sobra
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#78350F' }}>
                        {item.suggested_action}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Multichannel Distribution Summary */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
                  DISTRIBUIÇÃO DE EXPEDIÇÃO
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={12} color="#EA580C" />
                    <strong>Shopee Express:</strong>
                  </span>
                  <span style={{ fontWeight: 700 }}>68% (1.931 un)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smartphone size={12} color="#16A34A" />
                    <strong>WhatsApp Direto:</strong>
                  </span>
                  <span style={{ fontWeight: 700 }}>32% (909 un)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

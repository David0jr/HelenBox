import React, { useState } from 'react';
import {
  ShoppingBag,
  Barcode,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { Order, OrderStatus } from '../shared/types';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { UomBadge, StatusPill } from '../shared/ui/Badge';
import type { NavTab } from '../widgets/Sidebar/Sidebar';
import { BackButton } from '../shared/ui/BackButton';

import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/context/AppContext';

interface OrdersPageProps {
  orders?: Order[];
  onNavigateToPicking?: (orderId: string) => void;
  onGoBack?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders: propOrders,
  onNavigateToPicking: propOnNavigateToPicking,
  onGoBack,
}) => {
  const navigate = useNavigate();
  const appContext = useApp();
  const orders = propOrders || appContext.orders;
  const onNavigateToPicking = propOnNavigateToPicking || (() => navigate('/bipagem-picking'));

  const [filterChannel, setFilterChannel] = useState<'ALL' | 'SHOPEE' | 'WHATSAPP' | 'MANUAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q);
    const matchChannel = filterChannel === 'ALL' || o.channel === filterChannel;
    return matchSearch && matchChannel;
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
              Pedidos Multicanal (Shopee & WhatsApp)
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Fila de pedidos aguardando separação e bipagem no leitor óptico.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterChannel === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterChannel('ALL')}
          >
            Todos os Canais ({orders.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filterChannel === 'SHOPEE' ? 'active' : ''}`}
            onClick={() => setFilterChannel('SHOPEE')}
          >
            Shopee Express
          </button>
          <button
            type="button"
            className={`filter-tab ${filterChannel === 'WHATSAPP' ? 'active' : ''}`}
            onClick={() => setFilterChannel('WHATSAPP')}
          >
            WhatsApp Direto
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Buscar por nº do pedido ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
            }}
          />
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '10px' }} />
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: ord.channel === 'SHOPEE' ? '#EE4D2D' : '#25D366',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {ord.channel}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {ord.order_number}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{ord.customer_name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({ord.created_at})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <StatusPill status={ord.status} />
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onNavigateToPicking(ord.id)}
                >
                  <Barcode size={14} />
                  Iniciar Bipagem
                </button>
              </div>
            </div>

            {/* Items Summary */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              {ord.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{it.product_name}</span>
                  {it.collection_code && (
                    <HashtagSwatch collectionCode={it.collection_code} colorCode={it.color_code} hexColor={it.hex_color} size="sm" />
                  )}
                  <UomBadge uom={it.uom_type} />
                  <span style={{ fontWeight: 700, color: 'var(--helen-red)' }}>x{it.quantity_ordered}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

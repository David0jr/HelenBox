import React, { useState, useMemo, useEffect } from 'react';
import {
  Barcode,
  Search,
  CheckCircle2,
  Truck,
  ChevronRight,
  ChevronLeft,
  Lock,
  PackageCheck,
  User as UserIcon,
  X,
  Phone,
  MapPin,
  FileText,
  Clock,
  MessageCircle,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import type { Order, OrderStatus } from '../shared/types';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { UomBadge, StatusPill } from '../shared/ui/Badge';
import { BackButton } from '../shared/ui/BackButton';

import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../app/context/AppContext';
import { useAuth } from '../features/auth';

interface OrdersPageProps {
  orders?: Order[];
  onNavigateToPicking?: (orderId: string) => void;
  onGoBack?: () => void;
}

// FIFO sorting helper (quem pediu primeiro fica no topo)
const parseOrderTimeScore = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  return 9999;
};

// Extract clean time like "08:30" from "Hoje, 08:30"
const formatShortTime = (timeStr: string): string => {
  const match = timeStr.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : timeStr;
};

// Short display name ("Carlos Oliveira" -> "Carlos")
const formatShortUserName = (name?: string): string => {
  if (!name) return '';
  return name.replace(/\s*\(.*?\)\s*/g, '').split(' ').slice(0, 2).join(' ');
};

interface KanbanColumnConfig {
  status: OrderStatus;
  title: string;
  dotColor: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { status: 'PENDING', title: 'Pendentes', dotColor: '#F59E0B' },
  { status: 'PICKING', title: 'Em Separação', dotColor: 'var(--helen-red)' },
  { status: 'CHECKED', title: 'Conferidos', dotColor: '#10B981' },
  { status: 'DISPATCHED', title: 'Expedidos', dotColor: '#9CA3AF' },
];

const STATUS_FLOW: OrderStatus[] = ['PENDING', 'PICKING', 'CHECKED', 'DISPATCHED'];

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders: propOrders,
  onNavigateToPicking: propOnNavigateToPicking,
  onGoBack,
}) => {
  const navigate = useNavigate();
  const appContext = useApp();
  const { user: currentUser } = useAuth();
  const orders = propOrders || appContext.orders;

  const isAdmin = currentUser?.role === 'ADMIN';

  const [selectedChannel, setSelectedChannel] = useState<'SHOPEE' | 'WHATSAPP' | 'ALL'>('SHOPEE');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<OrderStatus | null>(null);
  const [selectedOrderModalId, setSelectedOrderModalId] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const location = useLocation();
  const [successToast, setSuccessToast] = useState<string | null>(location.state?.successMessage || null);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessToast(location.state.successMessage);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setSuccessToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const selectedOrderModal = useMemo(
    () => orders.find((o) => o.id === selectedOrderModalId) || null,
    [orders, selectedOrderModalId]
  );

  // Admin handler to assign or reassign an order to an operator
  const handleReassignOrderOperator = (orderId: string, newOperatorId: string, newOperatorName: string) => {
    if (!appContext.setOrders) return;
    const isUnassigning = !newOperatorId;

    appContext.setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          assigned_to_id: isUnassigning ? undefined : newOperatorId,
          assigned_to_name: isUnassigning ? undefined : newOperatorName,
        };
      })
    );

    if (appContext.setLogs) {
      appContext.setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser?.name || 'Administrador',
          action_type: 'RELOCATE',
          location: 'Esteira de Pedidos',
          details: isUnassigning
            ? `Administrador desvinculou o operador da comanda.`
            : `Administrador atribuiu a comanda ao operador ${newOperatorName}.`,
          created_at: 'Agora mesmo',
        },
        ...prev,
      ]);
    }
  };

  // List of available operators from team and active orders
  const availableOperators = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    (appContext.teamMembers || []).forEach((tm) => {
      const cleanName = tm.name.replace(/\s*\(.*?\)\s*/g, '').trim();
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        list.push({ id: tm.id, name: cleanName });
      }
    });

    orders.forEach((o) => {
      if (o.assigned_to_name) {
        const cleanName = o.assigned_to_name.replace(/\s*\(.*?\)\s*/g, '').trim();
        if (!seen.has(cleanName)) {
          seen.add(cleanName);
          list.push({ id: o.assigned_to_id || cleanName, name: cleanName });
        }
      }
    });

    return list;
  }, [appContext.teamMembers, orders]);

  // Check if an order is locked for the current logged-in operator
  const isOrderLockedForUser = (ord: Order): boolean => {
    if (isAdmin) return false; // Admin is never blocked
    if (!ord.assigned_to_id) return false;
    return ord.assigned_to_id !== currentUser?.id;
  };

  // Step 1: Operator clicks "Separar Pedido" -> claims order & moves to PICKING ("Em Separação")
  const handleClaimAndStartPicking = (ord: Order) => {
    if (!appContext.setOrders) return;
    const userId = currentUser?.id || 'user-admin';
    const userName = currentUser?.name || 'Operador';

    appContext.setOrders((prev) =>
      prev.map((o) =>
        o.id === ord.id
          ? {
              ...o,
              status: 'PICKING',
              assigned_to_id: userId,
              assigned_to_name: userName,
            }
          : o
      )
    );

    if (appContext.setLogs) {
      appContext.setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: userName,
          action_type: 'SCAN_OUT',
          target_id: ord.id,
          details: `Iniciou a separação do pedido ${ord.order_number} (${ord.channel})`,
          created_at: 'Agora mesmo',
        },
        ...prev,
      ]);
    }
  };

  // Step 2: Operator clicks "Bipar Pedido" -> goes to Picking Terminal with this order selected
  const handleOpenPickingTerminal = (ord: Order) => {
    if (isOrderLockedForUser(ord)) return;
    setSelectedOrderModalId(null);
    if (appContext.setActivePickingOrderId) {
      appContext.setActivePickingOrderId(ord.id);
    }
    if (propOnNavigateToPicking) {
      propOnNavigateToPicking(ord.id);
    } else {
      navigate(`/bipagem-picking?orderId=${ord.id}`);
    }
  };

  const handleMoveOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    if (!appContext.setOrders) return;
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || isOrderLockedForUser(targetOrder)) return;

    const userId = currentUser?.id || 'user-admin';
    const userName = currentUser?.name || 'Operador';

    appContext.setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedScanned =
          newStatus === 'CHECKED' || newStatus === 'DISPATCHED'
            ? o.total_items
            : newStatus === 'PENDING'
            ? 0
            : o.scanned_items;
        return {
          ...o,
          status: newStatus,
          scanned_items: updatedScanned,
          assigned_to_id: newStatus === 'PENDING' ? undefined : o.assigned_to_id || userId,
          assigned_to_name: newStatus === 'PENDING' ? undefined : o.assigned_to_name || userName,
        };
      })
    );
  };

  const shopeeCount = useMemo(() => orders.filter((o) => o.channel === 'SHOPEE').length, [orders]);
  const whatsappCount = useMemo(() => orders.filter((o) => o.channel === 'WHATSAPP').length, [orders]);

  // Filtered and FIFO sorted orders (menor horário no topo)
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders
      .filter((o) => {
        const matchSearch =
          !q ||
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.items.some(
            (it) =>
              it.product_name.toLowerCase().includes(q) ||
              (it.collection_code && it.collection_code.toLowerCase().includes(q)) ||
              (it.color_code && it.color_code.toLowerCase().includes(q))
          );
        const matchChannel = selectedChannel === 'ALL' || o.channel === selectedChannel;
        const matchOperator =
          selectedOperator === 'ALL'
            ? true
            : selectedOperator === 'UNASSIGNED'
            ? !o.assigned_to_name
            : (o.assigned_to_name && o.assigned_to_name.includes(selectedOperator)) ||
              o.assigned_to_id === selectedOperator;
        return matchSearch && matchChannel && matchOperator;
      })
      .sort((a, b) => parseOrderTimeScore(a.created_at) - parseOrderTimeScore(b.created_at));
  }, [orders, searchQuery, selectedChannel, selectedOperator]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Professional Success Banner (when redirected from picking terminal) */}
      {successToast && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            color: 'var(--color-success)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setSuccessToast(null)}
            style={{ padding: '2px', height: '24px', width: '24px', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Clean Single-Row Top Bar: Channel Pill Tabs + Search */}
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
        {/* Left: Channel Selector Pills */}
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
              onClick={() => setSelectedChannel('SHOPEE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: selectedChannel === 'SHOPEE' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: selectedChannel === 'SHOPEE' ? 'var(--helen-black)' : 'transparent',
                color: selectedChannel === 'SHOPEE' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span
                style={{
                  width: '6.5px',
                  height: '6.5px',
                  borderRadius: '50%',
                  backgroundColor: '#EE4D2D',
                }}
              />
              <span>Shopee</span>
              <span style={{ opacity: 0.7, fontSize: '12px' }}>{shopeeCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedChannel('WHATSAPP')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: selectedChannel === 'WHATSAPP' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: selectedChannel === 'WHATSAPP' ? 'var(--helen-black)' : 'transparent',
                color: selectedChannel === 'WHATSAPP' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span
                style={{
                  width: '6.5px',
                  height: '6.5px',
                  borderRadius: '50%',
                  backgroundColor: '#25D366',
                }}
              />
              <span>WhatsApp</span>
              <span style={{ opacity: 0.7, fontSize: '12px' }}>{whatsappCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedChannel('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: selectedChannel === 'ALL' ? 700 : 500,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: selectedChannel === 'ALL' ? 'var(--helen-black)' : 'transparent',
                color: selectedChannel === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>Todos</span>
              <span style={{ opacity: 0.7, fontSize: '12px' }}>{orders.length}</span>
            </button>
          </div>
        </div>

        {/* Right: Operator Filter & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: '1 1 auto', minWidth: 0, gap: '8px' }}>
          {/* Operator Filter Selector */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              style={{
                height: '38px',
                padding: '0 14px 0 32px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-light)',
                background: selectedOperator !== 'ALL' ? 'var(--bg-surface)' : 'var(--bg-input)',
                color: selectedOperator !== 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: selectedOperator !== 'ALL' ? 700 : 500,
                outline: 'none',
                cursor: 'pointer',
              }}
              title="Filtrar por operador responsável"
            >
              <option value="ALL">Todos os Operadores</option>
              {availableOperators.map((op) => (
                <option key={op.id} value={op.name}>
                  {op.name}
                </option>
              ))}
              <option value="UNASSIGNED">Sem Operador Atribuído</option>
            </select>
            <UserIcon
              size={13}
              color={selectedOperator !== 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)'}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
          </div>

          {/* Minimal Pill Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px', minWidth: '150px' }}>
            <input
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 14px 0 34px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <Search
              size={13}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>
      </div>

      {/* Clean Kanban Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))',
          gap: '14px',
          overflowX: 'auto',
          paddingBottom: '8px',
          alignItems: 'flex-start',
        }}
      >
        {KANBAN_COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.status);
          const isDragOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== col.status) setDragOverCol(col.status);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCol(null);
                if (draggedOrderId) {
                  handleMoveOrderStatus(draggedOrderId, col.status);
                  setDraggedOrderId(null);
                }
              }}
              style={{
                background: isDragOver ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                border: isDragOver ? '1.5px dashed var(--border-hover)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-card)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '480px',
                transition: 'all var(--transition-fast)',
              }}
            >
              {/* Minimal Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px 6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: col.dotColor,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {col.title}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Comandas List */}
              {colOrders.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    opacity: 0.6,
                    minHeight: '140px',
                  }}
                >
                  Sem pedidos
                </div>
              ) : (
                colOrders.map((ord, index) => {
                  const isLocked = isOrderLockedForUser(ord);
                  const statusIdx = STATUS_FLOW.indexOf(ord.status);
                  const prevStatus = statusIdx > 0 ? STATUS_FLOW[statusIdx - 1] : null;
                  const nextStatus = statusIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[statusIdx + 1] : null;

                  return (
                    <div
                      key={ord.id}
                      draggable={!isLocked}
                      onDragStart={() => {
                        if (!isLocked) setDraggedOrderId(ord.id);
                      }}
                      onDragEnd={() => {
                        setDraggedOrderId(null);
                        setDragOverCol(null);
                      }}
                      onClick={() => setSelectedOrderModalId(ord.id)}
                      className="card"
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        cursor: 'pointer',
                        opacity: isLocked ? 0.78 : 1,
                        transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                      }}
                    >
                      {/* Row 1: Queue # + Order Code + Short Time */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              color: index === 0 ? '#FFFFFF' : 'var(--text-muted)',
                              background: index === 0 ? 'var(--helen-black)' : 'var(--bg-surface-hover)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}º
                          </span>

                          {selectedChannel === 'ALL' && (
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: ord.channel === 'SHOPEE' ? '#EE4D2D' : '#25D366',
                                flexShrink: 0,
                              }}
                              title={ord.channel}
                            />
                          )}

                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {ord.order_number}
                          </span>
                        </div>

                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                          {formatShortTime(ord.created_at)}
                        </span>
                      </div>

                      {/* Row 2: Customer Name */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.25,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ord.customer_name}
                        </div>
                      </div>

                      {/* Operator Separation Status Highlight in PICKING */}
                      {ord.status === 'PICKING' && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#065F46',
                            background: '#D1FAE5',
                            border: '1px solid #10B981',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                          <span>Separador: <strong>{ord.assigned_to_name || 'Operador'}</strong></span>
                        </div>
                      )}

                      {/* Operator Badge in CHECKED or PENDING */}
                      {ord.status !== 'PICKING' && ord.assigned_to_name && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '10.5px',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-surface-hover)',
                            border: '1px solid var(--border-light)',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-pill)',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <UserIcon size={10} />
                          <span>
                            {ord.status === 'CHECKED' ? 'Conferido por: ' : 'Atribuído a: '}
                            <strong>{ord.assigned_to_name}</strong>
                          </span>
                        </div>
                      )}

                      {/* Row 2.5: Divergence Badge if order has registered divergences */}
                      {ord.has_divergence && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            background: '#FEF3C7',
                            border: '1px solid #F59E0B',
                            color: '#92400E',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <ShieldAlert size={11} color="#D97706" />
                          <span>{ord.divergences?.length || 1} Divergência(s) Bipagem</span>
                        </div>
                      )}

                      {/* Row 3: Compact Items List */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '5px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        {ord.items.map((it) => (
                          <div
                            key={it.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              fontSize: '11.5px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                              <span
                                style={{
                                  color: 'var(--text-secondary)',
                                  fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {it.product_name}
                              </span>
                              {it.collection_code && (
                                <HashtagSwatch
                                  collectionCode={it.collection_code}
                                  colorCode={it.color_code}
                                  hexColor={it.hex_color}
                                  size="sm"
                                />
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <UomBadge uom={it.uom_type} />
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                x{it.quantity_ordered}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Row 4: Clean Action Bar with Operator Ownership Lock */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          paddingTop: '4px',
                        }}
                      >
                        {isLocked ? (
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-pill)',
                              background: 'var(--bg-surface-hover)',
                              border: '1px dashed var(--border-light)',
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            <Lock size={11} />
                            <span>Em andamento por {formatShortUserName(ord.assigned_to_name)}</span>
                          </div>
                        ) : (
                          <>
                            {prevStatus && isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleMoveOrderStatus(ord.id, prevStatus)}
                                className="btn btn-ghost"
                                style={{ padding: '4px', height: '26px', width: '26px', color: 'var(--text-muted)' }}
                                title="Voltar etapa (Admin)"
                              >
                                <ChevronLeft size={14} />
                              </button>
                            ) : null}

                            {col.status === 'PENDING' ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleClaimAndStartPicking(ord)}
                                style={{
                                  flex: 1,
                                  justifyContent: 'center',
                                  padding: '6px 10px',
                                  fontSize: '11.5px',
                                  borderRadius: 'var(--radius-pill)',
                                }}
                              >
                                <PackageCheck size={13} />
                                <span>Separar Pedido</span>
                              </button>
                            ) : col.status === 'PICKING' ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleOpenPickingTerminal(ord)}
                                style={{
                                  flex: 1,
                                  justifyContent: 'center',
                                  padding: '6px 10px',
                                  fontSize: '11.5px',
                                  borderRadius: 'var(--radius-pill)',
                                }}
                              >
                                <Barcode size={13} />
                                <span>Bipar Pedido</span>
                              </button>
                            ) : col.status === 'CHECKED' ? (
                              <button
                                type="button"
                                onClick={() => handleMoveOrderStatus(ord.id, 'DISPATCHED')}
                                className="btn btn-sm"
                                style={{
                                  flex: 1,
                                  justifyContent: 'center',
                                  padding: '6px 10px',
                                  fontSize: '11.5px',
                                  borderRadius: 'var(--radius-pill)',
                                  background: 'var(--bg-surface-hover)',
                                  border: '1px solid var(--border-light)',
                                  color: 'var(--text-primary)',
                                  fontWeight: 600,
                                }}
                              >
                                <Truck size={12} />
                                <span>Despachar</span>
                              </button>
                            ) : (
                              <span
                                style={{
                                  flex: 1,
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#10B981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <CheckCircle2 size={12} />
                                Expedido
                              </span>
                            )}

                            {nextStatus && isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleMoveOrderStatus(ord.id, nextStatus)}
                                className="btn btn-ghost"
                                style={{ padding: '4px', height: '26px', width: '26px', color: 'var(--text-muted)' }}
                                title="Avançar etapa (Admin)"
                              >
                                <ChevronRight size={14} />
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Order Detail Modal on Card Click */}
      {selectedOrderModal && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedOrderModalId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
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
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      background: selectedOrderModal.channel === 'SHOPEE' ? '#EE4D2D' : '#25D366',
                      color: '#FFFFFF',
                    }}
                  >
                    {selectedOrderModal.channel}
                  </span>
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selectedOrderModal.order_number}
                  </h2>
                  <StatusPill status={selectedOrderModal.status} />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '6px',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    Pedido: {selectedOrderModal.created_at}
                  </span>
                  {selectedOrderModal.assigned_to_name && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <UserIcon size={12} />
                      Separador: {selectedOrderModal.assigned_to_name}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedOrderModalId(null)}
                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Details Section */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Cliente
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedOrderModal.customer_name}
                  </div>
                </div>

                {selectedOrderModal.customer_phone && (
                  <a
                    href={`https://wa.me/55${selectedOrderModal.customer_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                    title="Chamar no WhatsApp"
                  >
                    <Phone size={12} color="#25D366" />
                    <span>{selectedOrderModal.customer_phone}</span>
                  </a>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                }}
              >
                {selectedOrderModal.customer_document && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <FileText size={13} color="var(--text-muted)" />
                    <span>CPF/CNPJ: <strong>{selectedOrderModal.customer_document}</strong></span>
                  </div>
                )}

                {selectedOrderModal.shipping_address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                    <MapPin size={13} color="var(--helen-red)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div>{selectedOrderModal.shipping_address}</div>
                      {selectedOrderModal.shipping_city && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {selectedOrderModal.shipping_city}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedOrderModal.notes && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border-light)',
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <MessageCircle size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                  <span>{selectedOrderModal.notes}</span>
                </div>
              )}
            </div>

            {/* Operador Responsável na Esteira Section */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: selectedOrderModal.assigned_to_name ? '#D1FAE5' : 'var(--bg-card)',
                    border: selectedOrderModal.assigned_to_name ? '1px solid #10B981' : '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserIcon size={18} color={selectedOrderModal.assigned_to_name ? '#065F46' : 'var(--text-muted)'} />
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Operador Responsável na Esteira
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                    {selectedOrderModal.assigned_to_name || (
                      <span style={{ color: '#F59E0B' }}>Nenhum operador atribuído</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Assignment Control: allows admin to assign/reassign order */}
              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {selectedOrderModal.assigned_to_name ? 'Reatribuir:' : 'Atribuir a:'}
                  </span>
                  <select
                    value={selectedOrderModal.assigned_to_name || ''}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const found = availableOperators.find((op) => op.name === selectedName);
                      handleReassignOrderOperator(
                        selectedOrderModal.id,
                        found ? found.id : '',
                        found ? found.name : ''
                      );
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Sem operador</option>
                    {availableOperators.map((op) => (
                      <option key={op.id} value={op.name}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Divergência da Bipagem - Limpo e Profissional */}
            {selectedOrderModal.has_divergence && selectedOrderModal.divergences && selectedOrderModal.divergences.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={16} color="var(--text-secondary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Divergência Registrada na Bipagem ({selectedOrderModal.divergences.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrderModal.divergences.map((div, idx) => (
                    <div
                      key={div.id || idx}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Item: </span>
                        <strong>{div.product_name}</strong>
                        {div.scanned_code && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                            ({div.scanned_code})
                          </span>
                        )}
                      </div>

                      <div style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Bipado por: </span>
                        <strong style={{ color: 'var(--text-primary)' }}>{div.operator_name}</strong>
                        {div.created_at && (
                          <span style={{ color: 'var(--text-muted)' }}> às {div.created_at}</span>
                        )}
                      </div>

                      <div style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Motivo da divergência: </span>
                        <span style={{ fontWeight: 500 }}>"{div.reason}"</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Itens da Comanda ({selectedOrderModal.items.length})
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {selectedOrderModal.scanned_items} / {selectedOrderModal.total_items} conferidos
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedOrderModal.items.map((it) => {
                  const isItemDone = it.status === 'CHECKED' || it.quantity_scanned >= it.quantity_ordered;
                  return (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {it.product_name}
                          </span>
                          {it.collection_code && (
                            <HashtagSwatch
                              collectionCode={it.collection_code}
                              colorCode={it.color_code}
                              hexColor={it.hex_color}
                              size="sm"
                            />
                          )}
                          {it.aroma_flavor && !it.collection_code && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ({it.aroma_flavor})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span>SKU: <strong>{it.variant_sku}</strong></span>
                          <span>•</span>
                          <span style={{ color: 'var(--helen-red)', fontWeight: 600 }}>
                            Local: {it.location_code}
                          </span>
                          {it.lot_number && (
                            <>
                              <span>•</span>
                              <span>{it.lot_number}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <UomBadge uom={it.uom_type} />
                        <div style={{ textAlign: 'right', minWidth: '42px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            x{it.quantity_ordered}
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: isItemDone ? '#10B981' : 'var(--text-muted)' }}>
                            {it.quantity_scanned}/{it.quantity_ordered}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Action */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedOrderModalId(null)}
                style={{ borderRadius: 'var(--radius-pill)', padding: '8px 18px', fontSize: '12.5px' }}
              >
                Fechar
              </button>

              {isOrderLockedForUser(selectedOrderModal) ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                  }}
                >
                  <Lock size={13} />
                  <span>Em andamento por {formatShortUserName(selectedOrderModal.assigned_to_name)}</span>
                </div>
              ) : selectedOrderModal.status === 'PENDING' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleClaimAndStartPicking(selectedOrderModal);
                    setSelectedOrderModalId(null);
                  }}
                  style={{ borderRadius: 'var(--radius-pill)', padding: '8px 20px', fontSize: '12.5px' }}
                >
                  <PackageCheck size={15} />
                  <span>Separar Pedido</span>
                </button>
              ) : selectedOrderModal.status === 'PICKING' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenPickingTerminal(selectedOrderModal)}
                  style={{ borderRadius: 'var(--radius-pill)', padding: '8px 20px', fontSize: '12.5px' }}
                >
                  <Barcode size={15} />
                  <span>Ir para Bipagem</span>
                </button>
              ) : selectedOrderModal.status === 'CHECKED' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleMoveOrderStatus(selectedOrderModal.id, 'DISPATCHED');
                    setSelectedOrderModalId(null);
                  }}
                  style={{ borderRadius: 'var(--radius-pill)', padding: '8px 20px', fontSize: '12.5px' }}
                >
                  <Truck size={15} />
                  <span>Despachar Pedido</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Barcode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import type { Order } from '../shared/types';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { UomBadge, StatusPill } from '../shared/ui/Badge';
import { audioFeedback } from '../shared/lib/audioFeedback';
import { triggerOrderCompletedConfetti } from '../shared/lib/confetti';
import { BackButton } from '../shared/ui/BackButton';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../app/context/AppContext';
import { useAuth } from '../features/auth';

interface PickingTerminalPageProps {
  orders?: Order[];
  onOrderCompleted?: (orderId: string) => void;
  onGoBack?: () => void;
}

export const PickingTerminalPage: React.FC<PickingTerminalPageProps> = ({
  orders: propOrders,
  onOrderCompleted,
  onGoBack,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appContext = useApp();
  const { user: currentUser } = useAuth();
  const orders = propOrders || appContext.orders;

  const isAdmin = currentUser?.role === 'ADMIN';
  const queryOrderId = searchParams.get('orderId');

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    queryOrderId || appContext.activePickingOrderId || orders[0]?.id || ''
  );
  const [barcodeInput, setBarcodeInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (queryOrderId) {
      setSelectedOrderId(queryOrderId);
    } else if (appContext.activePickingOrderId) {
      setSelectedOrderId(appContext.activePickingOrderId);
    }
  }, [queryOrderId, appContext.activePickingOrderId]);

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const isLockedForCurrentUser = Boolean(
    currentOrder &&
      !isAdmin &&
      currentOrder.assigned_to_id &&
      currentOrder.assigned_to_id !== currentUser?.id
  );

  const totalOrderedUnits = currentOrder
    ? currentOrder.items.reduce((acc, it) => acc + it.quantity_ordered, 0)
    : 1;
  const totalScannedUnits = currentOrder
    ? currentOrder.items.reduce((acc, it) => acc + it.quantity_scanned, 0)
    : 0;
  const allItemsChecked = currentOrder
    ? currentOrder.items.every((it) => it.status === 'CHECKED' || it.quantity_scanned >= it.quantity_ordered)
    : false;

  const updateOrderInStore = (updatedOrder: Order) => {
    if (appContext.setOrders) {
      appContext.setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    }
  };

  const handleScan = (codeToScan: string) => {
    if (!currentOrder || isLockedForCurrentUser) return;
    const cleanCode = codeToScan.trim();

    // Find pending item that matches barcode, SKU, UOM or direct click
    const pendingItemIndex = currentOrder.items.findIndex(
      (item) =>
        item.status === 'PENDING' &&
        (cleanCode.includes(item.variant_sku) ||
          cleanCode.includes(item.uom_type) ||
          cleanCode.includes('7890'))
    );

    if (pendingItemIndex !== -1) {
      audioFeedback.playScanSuccess();
      const updatedItems = currentOrder.items.map((it, idx) => {
        if (idx !== pendingItemIndex) return it;
        const nextQty = it.quantity_scanned + 1;
        return {
          ...it,
          quantity_scanned: nextQty,
          status: nextQty >= it.quantity_ordered ? ('CHECKED' as const) : ('PENDING' as const),
        };
      });

      const target = updatedItems[pendingItemIndex];
      const totalScanned = updatedItems.reduce((acc, it) => acc + it.quantity_scanned, 0);

      const updatedOrder: Order = {
        ...currentOrder,
        scanned_items: totalScanned,
        status: currentOrder.status === 'PENDING' ? 'PICKING' : currentOrder.status,
        assigned_to_id: currentOrder.assigned_to_id || currentUser?.id,
        assigned_to_name: currentOrder.assigned_to_name || currentUser?.name,
        items: updatedItems,
      };

      updateOrderInStore(updatedOrder);
      setFeedbackMessage({
        text: `✓ Bipado: ${target.product_name} (${target.quantity_scanned}/${target.quantity_ordered} ${target.uom_type})`,
        type: 'success',
      });
    } else {
      audioFeedback.playScanError();
      setFeedbackMessage({
        text: `✕ Código [${cleanCode}] não pertence aos itens pendentes deste pedido!`,
        type: 'error',
      });
    }

    setBarcodeInput('');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Finalize Picking -> Moves order to CHECKED ("Conferidos") and returns to Kanban board
  const handleFinalizeOrderPicking = () => {
    if (!currentOrder || isLockedForCurrentUser) return;

    const checkedItems = currentOrder.items.map((it) => ({
      ...it,
      quantity_scanned: it.quantity_ordered,
      status: 'CHECKED' as const,
    }));

    const finalizedOrder: Order = {
      ...currentOrder,
      status: 'CHECKED',
      scanned_items: totalOrderedUnits,
      assigned_to_id: currentOrder.assigned_to_id || currentUser?.id,
      assigned_to_name: currentOrder.assigned_to_name || currentUser?.name,
      items: checkedItems,
    };

    updateOrderInStore(finalizedOrder);
    audioFeedback.playCelebration();
    triggerOrderCompletedConfetti();

    if (onOrderCompleted) {
      onOrderCompleted(currentOrder.id);
    }

    navigate('/pedidos');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput) {
      handleScan(barcodeInput);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div
        className="card"
        style={{
          padding: '16px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BackButton onClick={onGoBack || (() => navigate('/pedidos'))} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px' }}>
              Bipagem de Pedido • {currentOrder?.order_number}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Cliente: <strong>{currentOrder?.customer_name}</strong> ({currentOrder?.channel})
              {currentOrder?.assigned_to_name && (
                <> • Separador: <strong>{currentOrder.assigned_to_name}</strong></>
              )}
            </p>
          </div>
        </div>

        {/* Order Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={currentOrder?.id}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 700,
              outline: 'none',
            }}
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number} • {o.customer_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLockedForCurrentUser ? (
        <div
          className="card"
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Lock size={32} color="var(--text-muted)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
            Pedido em andamento por {currentOrder?.assigned_to_name}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px' }}>
            Apenas o operador que iniciou a separação (ou um Administrador) pode bipar e finalizar este pedido para evitar divergências.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/pedidos')}
            style={{ marginTop: '8px', borderRadius: 'var(--radius-pill)' }}
          >
            Voltar para Pedidos
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px' }}>
          {/* Left: Barcode Scanner Console */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Barcode size={20} color="var(--helen-red)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Leitor de Código de Barras</h3>
              </div>
              <StatusPill status={currentOrder?.status || 'PICKING'} />
            </div>

            {/* Scanner Input Form */}
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Bipe o código de barras do produto..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--helen-red)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </form>

            {/* Quick Item Scan Buttons */}
            <div
              style={{
                background: 'var(--bg-surface-hover)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Bipagem Rápida dos Itens do Pedido:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {currentOrder?.items.map((it) => {
                  const isDone = it.status === 'CHECKED' || it.quantity_scanned >= it.quantity_ordered;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      disabled={isDone}
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleScan(it.variant_sku)}
                      style={{
                        opacity: isDone ? 0.5 : 1,
                        cursor: isDone ? 'default' : 'pointer',
                      }}
                    >
                      <Barcode size={13} color={isDone ? 'var(--color-success)' : 'var(--helen-red)'} />
                      <span>
                        {isDone ? '✓ ' : 'Bipar '}
                        {it.product_name} ({it.quantity_scanned}/{it.quantity_ordered})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Feedback Toast/Banner */}
            {feedbackMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    feedbackMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  border: `1px solid ${
                    feedbackMessage.type === 'success'
                      ? 'var(--color-success-border)'
                      : 'var(--color-danger-border)'
                  }`,
                  color: feedbackMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Progresso da Bipagem</span>
                <span style={{ fontWeight: 700 }}>
                  {totalScannedUnits} / {totalOrderedUnits} bipados
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'var(--border-light)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.round((totalScannedUnits / totalOrderedUnits) * 100))}%`,
                    height: '100%',
                    background: allItemsChecked ? 'var(--color-success)' : 'var(--helen-red)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Finalizar Bipagem Button -> Advances to Conferidos on Kanban */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={handleFinalizeOrderPicking}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: allItemsChecked ? '#10B981' : 'var(--helen-black)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Finalizar Bipagem e Enviar para Conferidos</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Right: Items List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Itens da Comanda</h3>
              {currentOrder?.assigned_to_name && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface-hover)',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  <UserIcon size={12} />
                  {currentOrder.assigned_to_name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentOrder?.items.map((item) => {
                const isItemChecked = item.status === 'CHECKED' || item.quantity_scanned >= item.quantity_ordered;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: isItemChecked ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                      border: isItemChecked
                        ? '1px solid var(--color-success-border)'
                        : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.product_name}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                          {item.collection_code && (
                            <HashtagSwatch
                              collectionCode={item.collection_code}
                              colorCode={item.color_code}
                              hexColor={item.hex_color}
                              size="sm"
                            />
                          )}
                          <UomBadge uom={item.uom_type} />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            • {item.location_code}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 800 }}>
                          {item.quantity_scanned} / {item.quantity_ordered}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: isItemChecked ? 'var(--color-success)' : 'var(--color-warning)',
                            fontWeight: 700,
                          }}
                        >
                          {isItemChecked ? '✓ Bipado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

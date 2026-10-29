import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Barcode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  User as UserIcon,
  ShieldAlert,
  RotateCcw,
  MapPin,
  Eye,
} from 'lucide-react';
import type { Order, OrderDivergence, OrderItem } from '../shared/types';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { UomBadge, StatusPill } from '../shared/ui/Badge';
import { audioFeedback } from '../shared/lib/audioFeedback';
import { BackButton } from '../shared/ui/BackButton';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../app/context/AppContext';
import { useAuth } from '../features/auth';

interface PickingTerminalPageProps {
  orders?: Order[];
  onOrderCompleted?: (orderId: string) => void;
  onGoBack?: () => void;
}

interface ActiveDivergenceAlert {
  divergenceType: 'NOT_IN_ORDER' | 'QUANTITY_EXCEEDED';
  scannedCode: string;
  productName: string;
  matchingItem: OrderItem | null;
}

const PRESET_JUSTIFICATIONS = [
  'Item adicional autorizado pelo cliente',
  'Brinde / Amostra autorizada Helen Color',
  'Troca de variação combinada com suporte',
  'Divergência mantida por decisão operacional',
];

export const PickingTerminalPage: React.FC<PickingTerminalPageProps> = ({
  orders: propOrders,
  onOrderCompleted,
  onGoBack,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const appContext = useApp();
  const { user: currentUser } = useAuth();
  const orders = propOrders || appContext.orders;
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const queryOrderId = searchParams.get('orderId');

  // Helper to determine the best initial active order (only if already in PICKING and assigned to current user/admin)
  const getInitialOrderId = () => {
    if (queryOrderId) {
      const match = orders.find((o) => o.id === queryOrderId);
      if (match && match.status === 'PICKING' && (match.assigned_to_id === currentUser?.id || isAdmin)) {
        return match.id;
      }
    }
    if (appContext.activePickingOrderId) {
      const match = orders.find((o) => o.id === appContext.activePickingOrderId);
      if (match && match.status === 'PICKING' && (match.assigned_to_id === currentUser?.id || isAdmin)) {
        return match.id;
      }
    }
    const pickingOrder = orders.find(
      (o) => o.status === 'PICKING' && (o.assigned_to_id === currentUser?.id || isAdmin)
    );
    if (pickingOrder) return pickingOrder.id;

    return '';
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string>(getInitialOrderId);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Divergence Security Modal state
  const [divergenceAlert, setDivergenceAlert] = useState<ActiveDivergenceAlert | null>(null);
  const [showJustificationForm, setShowJustificationForm] = useState(false);
  const [justificationReason, setJustificationReason] = useState(PRESET_JUSTIFICATIONS[0]);
  const [customJustificationText, setCustomJustificationText] = useState('');
  const [showDivergenceDrawer, setShowDivergenceDrawer] = useState(false);

  useEffect(() => {
    if (queryOrderId) {
      const match = orders.find((o) => o.id === queryOrderId);
      if (match && match.status === 'PICKING' && (match.assigned_to_id === currentUser?.id || isAdmin)) {
        setSelectedOrderId(match.id);
      } else if (match && !isAdmin && match.assigned_to_id && match.assigned_to_id !== currentUser?.id) {
        setSelectedOrderId(match.id);
      } else {
        setSelectedOrderId('');
      }
    } else if (appContext.activePickingOrderId) {
      const match = orders.find((o) => o.id === appContext.activePickingOrderId);
      if (match && match.status === 'PICKING' && (match.assigned_to_id === currentUser?.id || isAdmin)) {
        setSelectedOrderId(match.id);
      } else {
        if (appContext.setActivePickingOrderId) {
          appContext.setActivePickingOrderId(null);
        }
        setSelectedOrderId('');
      }
    } else {
      const pickingOrder = orders.find(
        (o) => o.status === 'PICKING' && (o.assigned_to_id === currentUser?.id || isAdmin)
      );
      setSelectedOrderId(pickingOrder?.id || '');
    }
  }, [queryOrderId, appContext.activePickingOrderId, orders, currentUser?.id, isAdmin]);

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || null;
  const isOrderAlreadyCompleted = Boolean(
    currentOrder && (currentOrder.status === 'CHECKED' || currentOrder.status === 'DISPATCHED')
  );

  // Operator is associated with conveyor order ONLY if:
  // 1. Order status is 'PICKING' (never CHECKED or DISPATCHED)
  // 2. It is assigned to the current user (or user is ADMIN)
  const isAssociatedWithOrder = Boolean(
    currentOrder &&
      currentOrder.status === 'PICKING' &&
      (currentOrder.assigned_to_id === currentUser?.id || isAdmin)
  );

  // Order is locked for current user if claimed by someone else
  const isClaimedByOtherUser = Boolean(
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

  // Auto-focus input when association becomes true
  useEffect(() => {
    if (isAssociatedWithOrder && !divergenceAlert) {
      barcodeInputRef.current?.focus();
    }
  }, [isAssociatedWithOrder, divergenceAlert]);

  const updateOrderInStore = (updatedOrder: Order) => {
    if (appContext.setOrders) {
      appContext.setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    }
  };

  // Barcode Scanning with Security Divergence Validation
  const handleScan = (codeToScan: string) => {
    if (!currentOrder || !isAssociatedWithOrder || isClaimedByOtherUser) return;
    const cleanCode = codeToScan.trim();
    if (!cleanCode) return;

    // Check if code matches any item in the order
    const matchingItemIndex = currentOrder.items.findIndex((it) => {
      const vSku = it.variant_sku.toLowerCase();
      const code = cleanCode.toLowerCase();
      if (vSku === code) return true;
      if (code.includes(vSku)) return true;
      if (cleanCode === it.id) return true;
      const prod = appContext.products.find((p) =>
        p.variants?.some((v) => v.id === it.variant_id || v.variant_sku.toLowerCase() === vSku)
      );
      if (prod) {
        const variant = prod.variants?.find((v) => v.id === it.variant_id || v.variant_sku.toLowerCase() === vSku);
        if (variant?.uoms?.some((u) => u.barcode.toLowerCase() === code)) {
          return true;
        }
      }
      return false;
    });

    // DIVERGÊNCIA REGRA 1: PRODUTO NÃO RELACIONADO AO PEDIDO
    if (matchingItemIndex === -1) {
      audioFeedback.playScanError();

      // Find real product name in catalog if possible
      let detectedName = `Código [${cleanCode}]`;
      for (const p of appContext.products) {
        if (p.sku_helenbox && cleanCode.includes(p.sku_helenbox)) {
          detectedName = p.name_pt;
          break;
        }
        for (const v of p.variants || []) {
          if (v.variant_sku && (cleanCode.includes(v.variant_sku) || v.variant_sku === cleanCode)) {
            detectedName = `${p.name_pt} (${v.color_name || v.aroma_flavor || v.variant_sku})`;
            break;
          }
        }
      }

      setDivergenceAlert({
        divergenceType: 'NOT_IN_ORDER',
        scannedCode: cleanCode,
        productName: detectedName,
        matchingItem: null,
      });
      setShowJustificationForm(false);
      setCustomJustificationText('');
      setBarcodeInput('');
      return;
    }

    const targetItem = currentOrder.items[matchingItemIndex];

    // DIVERGÊNCIA REGRA 2: PRODUTO A MAIS (QUANTIDADE EXCEDIDA)
    if (targetItem.quantity_scanned >= targetItem.quantity_ordered) {
      audioFeedback.playScanError();
      setDivergenceAlert({
        divergenceType: 'QUANTITY_EXCEEDED',
        scannedCode: cleanCode,
        productName: targetItem.product_name,
        matchingItem: targetItem,
      });
      setShowJustificationForm(false);
      setCustomJustificationText('');
      setBarcodeInput('');
      return;
    }

    // BIPAGEM NORMAL VÁLIDA
    audioFeedback.playScanSuccess();
    const updatedItems = currentOrder.items.map((it, idx) => {
      if (idx !== matchingItemIndex) return it;
      const nextQty = it.quantity_scanned + 1;
      return {
        ...it,
        quantity_scanned: nextQty,
        status: nextQty >= it.quantity_ordered ? ('CHECKED' as const) : ('PENDING' as const),
      };
    });

    const target = updatedItems[matchingItemIndex];
    const totalScanned = updatedItems.reduce((acc, it) => acc + it.quantity_scanned, 0);

    const updatedOrder: Order = {
      ...currentOrder,
      scanned_items: totalScanned,
      items: updatedItems,
    };

    updateOrderInStore(updatedOrder);
    setFeedbackMessage({
      text: `✓ Bipado: ${target.product_name} (${target.quantity_scanned}/${target.quantity_ordered})`,
      type: 'success',
    });

    setBarcodeInput('');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Action 1: Discard / Remove Divergent Item (No divergence registered)
  const handleRemoveDivergentItem = () => {
    setDivergenceAlert(null);
    setShowJustificationForm(false);
    setBarcodeInput('');
    setFeedbackMessage({
      text: '✓ Item divergente removido da esteira. Pedido mantido 100% em conformidade.',
      type: 'success',
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Action 2: Proceed with Divergence (Register for Admin Audit)
  const handleConfirmDivergenceContinuance = () => {
    if (!divergenceAlert || !currentOrder) return;

    const finalReason = customJustificationText.trim() || justificationReason;

    const newDivergence: OrderDivergence = {
      id: `div-${Date.now()}`,
      order_id: currentOrder.id,
      order_number: currentOrder.order_number,
      operator_id: currentUser?.id || 'user-op',
      operator_name: currentUser?.name || 'Operador',
      scanned_code: divergenceAlert.scannedCode,
      product_name: divergenceAlert.productName,
      divergence_type: divergenceAlert.divergenceType,
      reason: finalReason,
      status: 'PENDING_REVIEW',
      created_at: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    let updatedItems = currentOrder.items;
    if (divergenceAlert.divergenceType === 'QUANTITY_EXCEEDED' && divergenceAlert.matchingItem) {
      updatedItems = currentOrder.items.map((it) =>
        it.id === divergenceAlert.matchingItem?.id
          ? { ...it, quantity_scanned: it.quantity_scanned + 1, status: 'CHECKED' as const }
          : it
      );
    }

    const updatedOrder: Order = {
      ...currentOrder,
      has_divergence: true,
      divergences: [...(currentOrder.divergences || []), newDivergence],
      items: updatedItems,
      scanned_items: updatedItems.reduce((acc, it) => acc + it.quantity_scanned, 0),
    };

    updateOrderInStore(updatedOrder);

    if (appContext.setLogs) {
      appContext.setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser?.name || 'Operador',
          action_type: 'SCAN_DIVERGENCE',
          location: currentOrder.items[0]?.location_code || 'Esteira HelenBox',
          details: `Divergência na bipagem do pedido ${currentOrder.order_number}: ${
            divergenceAlert.divergenceType === 'NOT_IN_ORDER' ? 'Produto não relacionado' : 'Quantidade excedida'
          } (${divergenceAlert.productName}). Operador manteve com justificativa: "${finalReason}"`,
          created_at: 'Agora mesmo',
        },
        ...prev,
      ]);
    }

    setDivergenceAlert(null);
    setShowJustificationForm(false);
    setFeedbackMessage({
      text: `⚠️ Divergência registrada no pedido! Notificação enviada para auditoria do Administrador.`,
      type: 'warning',
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Finalize Picking -> Moves order to CHECKED ("Conferidos")
  const handleFinalizeOrderPicking = () => {
    if (!currentOrder || !isAssociatedWithOrder || isClaimedByOtherUser) return;

    const checkedItems = currentOrder.items.map((it) => ({
      ...it,
      quantity_scanned: Math.max(it.quantity_ordered, it.quantity_scanned),
      status: 'CHECKED' as const,
    }));

    const finalizedOrder: Order = {
      ...currentOrder,
      status: 'CHECKED',
      scanned_items: totalOrderedUnits,
      items: checkedItems,
    };

    updateOrderInStore(finalizedOrder);
    audioFeedback.playScanSuccess();

    // 1. Clear active picking order in global AppContext
    if (appContext.setActivePickingOrderId) {
      appContext.setActivePickingOrderId(null);
    }

    // 2. Clear all local terminal state immediately
    setBarcodeInput('');
    setFeedbackMessage(null);
    setDivergenceAlert(null);
    setShowJustificationForm(false);
    setShowDivergenceDrawer(false);

    // 3. Clear URL search query
    setSearchParams({}, { replace: true });

    // 4. Reset selected order
    setSelectedOrderId('');

    if (appContext.setLogs) {
      appContext.setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          user_name: currentUser?.name || 'Operador',
          action_type: 'SCAN_OUT',
          location: currentOrder.items[0]?.location_code || 'Expedição',
          details: `Pedido ${currentOrder.order_number} conferido com sucesso e enviado para Conferidos.`,
          created_at: 'Agora mesmo',
        },
        ...prev,
      ]);
    }

    if (onOrderCompleted) {
      onOrderCompleted(currentOrder.id);
    }

    navigate('/pedidos', {
      replace: true,
      state: {
        successMessage: `Pedido ${currentOrder.order_number} conferido e enviado com sucesso para a esteira (Conferidos).`,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput) {
      handleScan(barcodeInput);
    }
  };

  // 1. Order claimed by someone else
  if (isClaimedByOtherUser && currentOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          className="card"
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <BackButton onClick={onGoBack || (() => navigate('/pedidos'))} />
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Terminal de Bipagem / Picking
            </h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Separação e validação de pedidos da esteira
            </span>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={22} color="var(--text-muted)" />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%',
              maxWidth: '460px',
            }}
          >
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 800,
                margin: '0 0 6px',
                color: 'var(--text-primary)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Pedido em Separação por {currentOrder.assigned_to_name}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.5,
                textAlign: 'center',
                width: '100%',
              }}
            >
              Apenas o operador responsável (ou um Administrador) pode bipar os produtos desta comanda.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/pedidos')}
            style={{
              borderRadius: 'var(--radius-pill)',
              padding: '9px 22px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <span>Voltar para Pedidos</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 2. Order already completed (CHECKED / DISPATCHED)
  if (isOrderAlreadyCompleted && currentOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          className="card"
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <BackButton onClick={onGoBack || (() => navigate('/pedidos'))} />
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Terminal de Bipagem / Picking
            </h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Separação e validação de pedidos da esteira
            </span>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={26} color="#059669" />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%',
              maxWidth: '520px',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                margin: '0 0 6px',
                color: 'var(--text-primary)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Pedido {currentOrder.order_number} Já Conferido e Enviado para a Esteira
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.5,
                textAlign: 'center',
                width: '100%',
              }}
            >
              Todas as informações da bipagem foram salvas e transferidas com sucesso para a esteira ({currentOrder.status === 'DISPATCHED' ? 'Despachado' : 'Conferidos'}).
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/pedidos')}
            style={{
              borderRadius: 'var(--radius-pill)',
              padding: '9px 22px',
              fontSize: '13px',
              fontWeight: 700,
              marginTop: '4px',
            }}
          >
            Ir para a Esteira de Pedidos
          </button>
        </div>
      </div>
    );
  }

  // 3. Not associated with any active conveyor order in PICKING
  if (!currentOrder || !isAssociatedWithOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          className="card"
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <BackButton onClick={onGoBack || (() => navigate('/pedidos'))} />
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Terminal de Bipagem / Picking
            </h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Separação e validação de pedidos da esteira
            </span>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={22} color="var(--text-muted)" />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%',
              maxWidth: '460px',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 800,
                margin: '0 0 6px',
                color: 'var(--text-primary)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Bipagem Bloqueada
            </h2>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.5,
                textAlign: 'center',
                width: '100%',
              }}
            >
              Para bipar, você deve estar associado a um pedido da esteira.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/pedidos')}
            style={{
              borderRadius: 'var(--radius-pill)',
              padding: '9px 24px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <span>Ir para a Esteira de Pedidos</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header Card: Professional Executive Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BackButton onClick={onGoBack || (() => navigate('/pedidos'))} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {/* Top Row: Channel Badge, Order Number, Status Pill, Divergence Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: currentOrder?.channel === 'SHOPEE' ? '#EE4D2D' : '#25D366',
                  color: '#FFFFFF',
                  boxShadow:
                    currentOrder?.channel === 'SHOPEE'
                      ? '0 1px 4px rgba(238, 77, 45, 0.25)'
                      : '0 1px 4px rgba(37, 211, 102, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {currentOrder?.channel || 'PEDIDO'}
              </span>

              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.3px',
                  margin: 0,
                }}
              >
                {currentOrder?.order_number || 'Sem Pedido Selecionado'}
              </h1>

              {currentOrder?.status === 'PICKING' ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: 'var(--helen-red)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--helen-red)',
                    }}
                  />
                  Em Separação
                </span>
              ) : currentOrder?.status === 'CHECKED' ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#047857',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10B981',
                    }}
                  />
                  100% Conferido
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#9CA3AF',
                    }}
                  />
                  Pendente na Esteira
                </span>
              )}

              {currentOrder?.has_divergence && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  <ShieldAlert size={12} color="var(--text-muted)" />
                  {currentOrder.divergences?.length || 1} Divergência(s)
                </span>
              )}
            </div>

            {/* Bottom Row: Customer, Operator, and Time Information */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
              }}
            >
              <span>
                Cliente:{' '}
                <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {currentOrder?.customer_name || '—'}
                </strong>
              </span>

              <span style={{ color: 'var(--border-light)' }}>•</span>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                Operador:{' '}
                {currentOrder?.assigned_to_name ? (
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {currentOrder.assigned_to_name}
                  </strong>
                ) : (
                  <span
                    style={{
                      color: '#D97706',
                      fontWeight: 600,
                      background: '#FEF3C7',
                      padding: '1px 8px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                    }}
                  >
                    Aguardando operador na esteira
                  </span>
                )}
              </span>

              {currentOrder?.created_at && (
                <>
                  <span style={{ color: 'var(--border-light)' }}>•</span>
                  <span>{currentOrder.created_at}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Professional Progress Metric Pill (replaces the removed dropdown) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '2px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-muted)',
              }}
            >
              Progresso da Separação
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: allItemsChecked ? 'var(--color-success)' : 'var(--text-primary)',
                }}
              >
                {totalScannedUnits} / {totalOrderedUnits}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {totalOrderedUnits === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Divergence Warning Banner on Order (Clean & Professional, only in PICKING) */}
      {currentOrder?.has_divergence && currentOrder.status === 'PICKING' && currentOrder.divergences && currentOrder.divergences.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={17} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Este pedido possui {currentOrder.divergences.length} divergência(s) registrada(s) na bipagem
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                Registrado para consulta no histórico da comanda.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowDivergenceDrawer(!showDivergenceDrawer)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '11.5px',
              borderRadius: 'var(--radius-pill)',
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            <Eye size={12} />
            <span>{showDivergenceDrawer ? 'Ocultar' : 'Ver Detalhes'}</span>
          </button>
        </div>
      )}

      {/* Divergence Drawer Details */}
      {showDivergenceDrawer && currentOrder?.divergences && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Divergências Registradas na Bipagem:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentOrder.divergences.map((div, idx) => (
              <div
                key={div.id || idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
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

      {/* Main Grid: Left Scanner Console + Right Order Items List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '16px' }}>
        {/* Left Console: Scanner Input & Progress */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Barcode size={18} color="var(--text-primary)" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Leitor de Código de Barras
              </h2>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--color-success)', fontWeight: 600 }}>
              🟢 Leitor Ativo
            </span>
          </div>

          {/* Scanner Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Bipe o código de barras ou digite o SKU..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px 0 40px',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--helen-black)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              />
              <Barcode
                size={17}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Pressione Enter após escanear o código do produto
            </span>

            {/* Quick Simulation Chips for manual testing without physical scanner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Atalhos de teste:
              </span>
              {currentOrder.items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleScan(it.variant_sku)}
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    padding: '2px 9px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  title={`Simular leitura do SKU ${it.variant_sku}`}
                >
                  + {it.variant_sku}
                </button>
              ))}
            </div>
          </form>

            {/* Live Feedback Toast */}
            {feedbackMessage && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background:
                    feedbackMessage.type === 'success'
                      ? 'var(--color-success-bg)'
                      : feedbackMessage.type === 'warning'
                      ? '#FEF3C7'
                      : 'var(--color-danger-bg)',
                  border: `1px solid ${
                    feedbackMessage.type === 'success'
                      ? 'var(--color-success-border)'
                      : feedbackMessage.type === 'warning'
                      ? '#F59E0B'
                      : 'var(--color-danger-border)'
                  }`,
                  color:
                    feedbackMessage.type === 'success'
                      ? 'var(--color-success)'
                      : feedbackMessage.type === 'warning'
                      ? '#B45309'
                      : 'var(--color-danger)',
                  fontWeight: 600,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {feedbackMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Progresso da Separação</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {totalScannedUnits} de {totalOrderedUnits} unidades ({Math.round((totalScannedUnits / totalOrderedUnits) * 100)}%)
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
                    background: allItemsChecked ? 'var(--color-success)' : 'var(--helen-black)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Finalize Button */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                disabled={!isAssociatedWithOrder || !allItemsChecked}
                onClick={handleFinalizeOrderPicking}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px 18px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: allItemsChecked ? '#10B981' : 'var(--helen-black)',
                  opacity: isAssociatedWithOrder && allItemsChecked ? 1 : 0.45,
                  cursor: isAssociatedWithOrder && allItemsChecked ? 'pointer' : 'not-allowed',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Finalizar Bipagem e Enviar para Conferidos</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Right Console: Order Items List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Itens do Pedido ({currentOrder?.items.length})
              </h2>

              {currentOrder?.assigned_to_name && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  <UserIcon size={11} />
                  {currentOrder.assigned_to_name}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentOrder?.items.map((item) => {
                const isItemChecked = item.status === 'CHECKED' || item.quantity_scanned >= item.quantity_ordered;
                const isOverScanned = item.quantity_scanned > item.quantity_ordered;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isAssociatedWithOrder) {
                        handleScan(item.variant_sku);
                      }
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isItemChecked ? 'var(--bg-surface)' : 'var(--bg-card)',
                      border: isOverScanned
                        ? '1.5px solid #F59E0B'
                        : isItemChecked
                        ? '1px solid var(--color-success-border)'
                        : '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: isAssociatedWithOrder ? 'pointer' : 'default',
                      transition: 'border-color var(--transition-fast)',
                    }}
                    title={isAssociatedWithOrder ? 'Clique para bipar este produto' : ''}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.product_name}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                          SKU: <strong>{item.variant_sku}</strong>
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          <MapPin size={11} color="var(--text-muted)" />
                          {item.location_code}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.quantity_scanned} / {item.quantity_ordered}
                      </div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: isOverScanned
                            ? '#B45309'
                            : isItemChecked
                            ? 'var(--color-success)'
                            : 'var(--text-muted)',
                          fontWeight: 700,
                        }}
                      >
                        {isOverScanned ? '⚠️ Excesso' : isItemChecked ? '✓ Bipado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* Modal de Alerta de Divergência na Bipagem */}
      {divergenceAlert && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Alert Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={22} color="#DC2626" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#DC2626',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Regra de Segurança HelenBox
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                  Alerta de Divergência na Bipagem
                </h2>
              </div>
            </div>

            {/* Divergence Details Box */}
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                color: '#991B1B',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800 }}>
                {divergenceAlert.divergenceType === 'NOT_IN_ORDER' ? (
                  <span>❌ PRODUTO NÃO RELACIONADO AO PEDIDO</span>
                ) : (
                  <span>⚠️ QUANTIDADE EXCEDIDA (PRODUTO A MAIS)</span>
                )}
              </div>

              <div style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
                {divergenceAlert.divergenceType === 'NOT_IN_ORDER' ? (
                  <>
                    O produto <strong>{divergenceAlert.productName}</strong> (Código: <code>{divergenceAlert.scannedCode}</code>) não faz parte deste pedido.
                  </>
                ) : (
                  <>
                    O item <strong>{divergenceAlert.productName}</strong> já atingiu a quantidade solicitada de <strong>{divergenceAlert.matchingItem?.quantity_ordered} unidades</strong>.
                  </>
                )}
              </div>

              <div style={{ fontSize: '11.5px', opacity: 0.9, marginTop: '2px' }}>
                Pedido: <strong>{currentOrder?.order_number}</strong> • Cliente: <strong>{currentOrder?.customer_name}</strong>
              </div>
            </div>

            {/* Clarification Text */}
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Remova o produto da caixa para corrigir a conferência. Se optar por manter o item, a divergência será registrada para auditoria do Administrador.
            </p>

            {/* Justification Form */}
            {showJustificationForm ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Justificativa para o Administrador:
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_JUSTIFICATIONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setJustificationReason(preset);
                        setCustomJustificationText(preset);
                      }}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        border: justificationReason === preset ? '1px solid #D97706' : '1px solid var(--border-light)',
                        background: justificationReason === preset ? '#FEF3C7' : 'var(--bg-card)',
                        color: justificationReason === preset ? '#92400E' : 'var(--text-secondary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Ou descreva o motivo aqui..."
                  value={customJustificationText}
                  onChange={(e) => setCustomJustificationText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowJustificationForm(false)}
                    style={{ flex: 1, fontSize: '12px', borderRadius: 'var(--radius-pill)' }}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmDivergenceContinuance}
                    style={{
                      flex: 1.5,
                      fontSize: '12px',
                      borderRadius: 'var(--radius-pill)',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      fontWeight: 700,
                    }}
                  >
                    Confirmar Divergência
                  </button>
                </div>
              </div>
            ) : (
              /* Action Buttons */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRemoveDivergentItem}
                  style={{
                    width: '100%',
                    padding: '11px 18px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    background: '#10B981',
                    color: '#FFFFFF',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <RotateCcw size={15} />
                  <span>Remover Item Bipado (Corrigir e Descartar)</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJustificationForm(true)}
                  style={{
                    width: '100%',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#B45309',
                    borderColor: '#FCD34D',
                    background: '#FFFBEB',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertTriangle size={14} color="#D97706" />
                  <span>Dar Continuidade com Divergência (Registrar para ADM)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

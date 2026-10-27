import React, { useState } from 'react';
import {
  Barcode,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type { Order, OrderItem } from '../shared/types';
import { HashtagSwatch } from '../shared/ui/HashtagSwatch';
import { UomBadge, StatusPill } from '../shared/ui/Badge';
import { audioFeedback } from '../shared/lib/audioFeedback';
import { triggerOrderCompletedConfetti } from '../shared/lib/confetti';
import { BackButton } from '../shared/ui/BackButton';

import { useApp } from '../app/context/AppContext';

interface PickingTerminalPageProps {
  orders?: Order[];
  onOrderCompleted?: (orderId: string) => void;
  onGoBack?: () => void;
}

export const PickingTerminalPage: React.FC<PickingTerminalPageProps> = ({ orders: propOrders, onOrderCompleted, onGoBack }) => {
  const appContext = useApp();
  const orders = propOrders || appContext.orders;
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currentOrder = localOrders.find((o) => o.id === selectedOrderId) || localOrders[0];

  const handleScan = (codeToScan: string) => {
    if (!currentOrder) return;
    const cleanCode = codeToScan.trim();

    // Find pending item that matches barcode or variant
    const pendingItemIndex = currentOrder.items.findIndex(
      (item) => item.status === 'PENDING' && (cleanCode.includes(item.variant_sku) || cleanCode.includes(item.uom_type) || cleanCode.includes('7890'))
    );

    if (pendingItemIndex !== -1) {
      // Success match!
      audioFeedback.playScanSuccess();
      const updatedItems = [...currentOrder.items];
      const target = updatedItems[pendingItemIndex];
      target.quantity_scanned += 1;

      if (target.quantity_scanned >= target.quantity_ordered) {
        target.status = 'CHECKED';
      }

      const totalScanned = updatedItems.reduce((acc, it) => acc + it.quantity_scanned, 0);
      const isComplete = updatedItems.every((it) => it.status === 'CHECKED');

      const updatedOrder: Order = {
        ...currentOrder,
        scanned_items: totalScanned,
        status: isComplete ? 'CHECKED' : 'PICKING',
        items: updatedItems,
      };

      setLocalOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setFeedbackMessage({
        text: `✓ Bipado com sucesso: ${target.product_name} (${target.uom_type})`,
        type: 'success',
      });

      if (isComplete) {
        audioFeedback.playCelebration();
        triggerOrderCompletedConfetti();
        setFeedbackMessage({
          text: `🎉 Pedido ${currentOrder.order_number} 100% Conferido e Pronto para Despacho!`,
          type: 'success',
        });
      }
    } else {
      // Error match
      audioFeedback.playScanError();
      setFeedbackMessage({
        text: `✕ Código [${cleanCode}] não pertence a este pedido ou lote expirado!`,
        type: 'error',
      });
    }

    setBarcodeInput('');
    setTimeout(() => setFeedbackMessage(null), 3000);
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
              Terminal de Bipagem & Picking FEFO
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Leitura óptica de códigos de barra Code-128 com validação obrigatória de lote (Primeiro que Vence, Primeiro que Sai).
          </p>
        </div>

        {/* Order Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Pedido Ativo:
          </span>
          <select
            value={currentOrder?.id}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {localOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number} • {o.channel} ({o.customer_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left: Barcode Scanner Console */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Barcode size={22} color="var(--helen-red)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                Entrada do Leitor de Código de Barras
              </h3>
            </div>
            <StatusPill status={currentOrder?.status || 'PENDING'} />
          </div>

          {/* Scanner Input Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Passe o leitor óptico ou digite o código de barras (Ex: UN-7890861501)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--helen-red)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: '0 0 14px var(--helen-red-glow)',
                  outline: 'none',
                }}
              />
            </div>
          </form>

          {/* Scanner Simulation Buttons for Testing Without Physical Gun */}
          <div style={{ background: 'var(--bg-surface-hover)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Simulador de Bipagem Rápida (Clique para testar áudio e baixa):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleScan('UN-7890861501-HB-ESM-861-50')}
              >
                <Barcode size={13} color="var(--helen-red)" />
                Bipar Esmalte (#861 #50)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleScan('DZ-7890011012-HB-CUT-OIL-MOR')}
              >
                <Barcode size={13} color="#8B5CF6" />
                Bipar Dúzia Óleo Morango
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => handleScan('CX-7890861524-HB-ESM-861-52')}
              >
                <Barcode size={13} color="#06B6D4" />
                Bipar Caixa Display
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => handleScan('CODIGO_ERRADO_999')}
              >
                Simular Erro de Bip
              </button>
            </div>
          </div>

          {/* Live Feedback Toast/Banner */}
          {feedbackMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: feedbackMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                border: `1px solid ${feedbackMessage.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                color: feedbackMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {feedbackMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Progress Bar of Current Order */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Progresso da Separação</span>
              <span style={{ fontWeight: 700 }}>
                {currentOrder?.scanned_items} de {currentOrder?.total_items} conferidos
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--border-light)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.round(((currentOrder?.scanned_items || 0) / (currentOrder?.total_items || 1)) * 100))}%`,
                  height: '100%',
                  background: currentOrder?.status === 'CHECKED' ? 'var(--color-success)' : 'var(--helen-red)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Items to Pick in Order with FEFO Guidance */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
              Itens do Pedido ({currentOrder?.order_number})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Cliente: <strong>{currentOrder?.customer_name}</strong> • Canal: <strong>{currentOrder?.channel}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px' }}>
            {currentOrder?.items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: item.status === 'CHECKED' ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                  border: item.status === 'CHECKED' ? '1px solid var(--color-success-border)' : '1px solid var(--border-light)',
                  opacity: item.status === 'CHECKED' ? 0.8 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.product_name}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                      {item.collection_code ? (
                        <HashtagSwatch
                          collectionCode={item.collection_code}
                          colorCode={item.color_code}
                          hexColor={item.hex_color}
                          size="sm"
                        />
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--helen-red)', fontWeight: 600 }}>
                          {item.aroma_flavor}
                        </span>
                      )}
                      <UomBadge uom={item.uom_type} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800 }}>
                      {item.quantity_scanned} / {item.quantity_ordered}
                    </div>
                    <span style={{ fontSize: '11px', color: item.status === 'CHECKED' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700 }}>
                      {item.status === 'CHECKED' ? '✓ Conferido' : '⏳ Pendente'}
                    </span>
                  </div>
                </div>

                {/* FEFO Lot guidance banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: 'var(--bg-input)',
                    fontSize: '11px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Local: <strong style={{ color: 'var(--helen-red)' }}>{item.location_code}</strong>
                  </span>
                  <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                    FEFO: {item.lot_number} (Val: {item.expiration_date})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

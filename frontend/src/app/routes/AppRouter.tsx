import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '../../widgets/Layout/AppLayout';

// Auth Pages
import { LoginPage } from '../../pages/LoginPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';

// System Pages (matching each section from reference)
import { DashboardPage } from '../../pages/DashboardPage';
import { MovementsPage } from '../../pages/MovementsPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { NewProductPage } from '../../pages/NewProductPage';
import { InvoicesPage } from '../../pages/InvoicesPage';
import { WarehouseMapPage } from '../../pages/WarehouseMapPage';
import { RelocatePage } from '../../pages/RelocatePage';
import { PickingTerminalPage } from '../../pages/PickingTerminalPage';
import { OrdersPage } from '../../pages/OrdersPage';
import { TeamPermissionsPage } from '../../pages/TeamPermissionsPage';
import { SecurityLogsPage } from '../../pages/SecurityLogsPage';
import { SettingsPage } from '../../pages/SettingsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/recuperar-senha"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path="/esqueci-senha" element={<Navigate to="/recuperar-senha" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/recuperar-senha" replace />} />

      {/* Protected HelenBox WMS Routes wrapped in AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Root redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/visao-geral" element={<Navigate to="/dashboard" replace />} />

        {/* 1. Visão Geral */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* 2. Movimentações */}
        <Route path="/movimentacoes" element={<MovementsPage />} />
        <Route path="/movements" element={<Navigate to="/movimentacoes" replace />} />

        {/* 3. Produtos */}
        <Route path="/produtos" element={<ProductsPage />} />
        <Route path="/produtos/novo" element={<NewProductPage />} />
        <Route path="/produtos/cadastrar" element={<Navigate to="/produtos/novo" replace />} />
        <Route path="/products" element={<Navigate to="/produtos" replace />} />

        {/* 4. Invoices CN */}
        <Route path="/invoices-cn" element={<InvoicesPage />} />
        <Route path="/invoices" element={<Navigate to="/invoices-cn" replace />} />

        {/* 5. Mapa do Galpão */}
        <Route path="/mapa-galpao" element={<WarehouseMapPage />} />
        <Route path="/warehouse" element={<Navigate to="/mapa-galpao" replace />} />

        {/* 6. Realocar Carga */}
        <Route path="/realocar-carga" element={<RelocatePage />} />
        <Route path="/relocate" element={<Navigate to="/realocar-carga" replace />} />

        {/* 7. Bipagem / Picking */}
        <Route path="/bipagem-picking" element={<PickingTerminalPage />} />
        <Route path="/picking" element={<Navigate to="/bipagem-picking" replace />} />

        {/* 8. Pedidos */}
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/orders" element={<Navigate to="/pedidos" replace />} />

        {/* 9. Permissões */}
        <Route path="/permissoes" element={<TeamPermissionsPage />} />
        <Route path="/permissions" element={<Navigate to="/permissoes" replace />} />

        {/* 10. Auditoria */}
        <Route path="/auditoria" element={<SecurityLogsPage />} />
        <Route path="/logs" element={<Navigate to="/auditoria" replace />} />
        <Route path="/audit" element={<Navigate to="/auditoria" replace />} />

        {/* 11. Configurações */}
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/settings" element={<Navigate to="/configuracoes" replace />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

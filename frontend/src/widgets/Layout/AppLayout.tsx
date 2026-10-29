import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Topbar } from '../Topbar/Topbar';
import { QuickRelocateModal } from '../../features/relocate-stock/QuickRelocateModal';
import { BarcodeThermalLabelModal } from '../../shared/ui/BarcodeThermalLabelModal';
import { useApp } from '../../app/context/AppContext';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme,
    products,
    relocateTarget,
    closeRelocateModal,
    handleRelocateSuccess,
    labelModalTarget,
    closeLabelModal,
    openLabelModal,
  } = useApp();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('helenbox_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('helenbox_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="app-layout">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onAddNewProduct={() => navigate('/produtos/novo')}
      />

      {/* Main Viewport */}
      <div className="main-viewport">
        {/* Topbar Navigation */}
        <Topbar
          products={products}
          onSelectProduct={(product, variant) => {
            openLabelModal(product, variant);
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigateToSettings={() => navigate('/configuracoes')}
        />

        {/* Content Area rendering individual page routes */}
        <main className="content-scrollable">
          <Outlet />
        </main>
      </div>

      {/* Agile Relocate Modal (2-Click without sales lock) */}
      <QuickRelocateModal
        isOpen={relocateTarget.isOpen}
        onClose={closeRelocateModal}
        productName={relocateTarget.productName}
        variant={relocateTarget.variant}
        onRelocateSuccess={handleRelocateSuccess}
      />

      {/* Barcode Thermal Label Modal (100x50mm preview) */}
      <BarcodeThermalLabelModal
        isOpen={labelModalTarget.isOpen}
        onClose={closeLabelModal}
        productName={labelModalTarget.productName}
        variant={labelModalTarget.variant}
        selectedUom={labelModalTarget.uom}
      />
    </div>
  );
};

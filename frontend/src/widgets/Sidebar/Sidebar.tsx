import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  MapPin,
  Barcode,
  ShoppingBag,
  ShieldCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  ArrowLeftRight,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../../features/auth';

export type NavTab =
  | 'dashboard'
  | 'movements'
  | 'products'
  | 'invoices'
  | 'warehouse'
  | 'relocate'
  | 'picking'
  | 'orders'
  | 'permissions'
  | 'logs'
  | 'settings';

export const TAB_ROUTE_MAP: Record<NavTab, string> = {
  dashboard: '/dashboard',
  movements: '/movimentacoes',
  products: '/produtos',
  invoices: '/invoices-cn',
  warehouse: '/mapa-galpao',
  relocate: '/realocar-carga',
  picking: '/bipagem-picking',
  orders: '/pedidos',
  permissions: '/permissoes',
  logs: '/auditoria',
  settings: '/configuracoes',
};

export const ROUTE_TAB_MAP: Record<string, NavTab> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/visao-geral': 'dashboard',
  '/movimentacoes': 'movements',
  '/movements': 'movements',
  '/produtos': 'products',
  '/produtos/novo': 'products',
  '/produtos/cadastrar': 'products',
  '/products': 'products',
  '/invoices-cn': 'invoices',
  '/invoices': 'invoices',
  '/mapa-galpao': 'warehouse',
  '/warehouse': 'warehouse',
  '/realocar-carga': 'relocate',
  '/relocate': 'relocate',
  '/bipagem-picking': 'picking',
  '/picking': 'picking',
  '/pedidos': 'orders',
  '/orders': 'orders',
  '/permissoes': 'permissions',
  '/permissions': 'permissions',
  '/auditoria': 'logs',
  '/logs': 'logs',
  '/audit': 'logs',
  '/configuracoes': 'settings',
  '/settings': 'settings',
};

interface SidebarProps {
  currentTab?: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddNewProduct?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab: controlledTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onAddNewProduct,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Determine active tab from URL pathname or fallback to controlledTab
  const currentPath = location.pathname;
  const currentTab = ROUTE_TAB_MAP[currentPath] || controlledTab || 'dashboard';

  const navItems = [
    { id: 'dashboard' as NavTab, path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'orders' as NavTab, path: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'products' as NavTab, path: '/produtos', label: 'Produtos', icon: Package },
    { id: 'picking' as NavTab, path: '/bipagem-picking', label: 'Bipagem / Picking', icon: Barcode },
    { id: 'invoices' as NavTab, path: '/invoices-cn', label: 'Invoices CN', icon: FileSpreadsheet },
    { id: 'warehouse' as NavTab, path: '/mapa-galpao', label: 'Mapa do Galpão', icon: MapPin },
    { id: 'relocate' as NavTab, path: '/realocar-carga', label: 'Realocar Carga', icon: Boxes },
    { id: 'permissions' as NavTab, path: '/permissoes', label: 'Permissões', icon: ShieldCheck },
    { id: 'movements' as NavTab, path: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'logs' as NavTab, path: '/auditoria', label: 'Auditoria', icon: History },
    { id: 'settings' as NavTab, path: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  const handleNavigate = (tab: NavTab, path: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '230px',
        height: '100vh',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width var(--transition-normal)',
        zIndex: 30,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Floating Toggle Arrow on the dividing line between sidebar and main content */}
      <button
        type="button"
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expandir menu HelenBox' : 'Recolher menu HelenBox'}
        style={{
          position: 'absolute',
          top: '18px',
          right: '-12px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 45,
          color: 'var(--text-secondary)',
          outline: 'none',
          padding: 0,
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--helen-red)';
          e.currentTarget.style.borderColor = 'var(--helen-red)';
          e.currentTarget.style.transform = 'scale(1.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Top Header & Navigation */}
      <div>
        {/* Header: HB Monogram Badge + Helenbox text */}
        <div
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0' : '0 16px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          {isCollapsed ? (
            /* When collapsed: ONLY the HB monogram badge */
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                userSelect: 'none',
                cursor: 'pointer',
              }}
              onClick={() => handleNavigate('dashboard', '/dashboard')}
              title="HelenBox WMS"
            >
              <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                  H
                </span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--helen-red)', letterSpacing: '-0.5px' }}>
                  B
                </span>
              </div>
            </div>
          ) : (
            /* Expanded: HB badge + Helen (dark bold) + box (red bold) */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              onClick={() => handleNavigate('dashboard', '/dashboard')}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                    H
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--helen-red)', letterSpacing: '-0.5px' }}>
                    B
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', letterSpacing: '-0.3px' }}>
                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Helen
                </span>
                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--helen-red)' }}>
                  box
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button: "+ Novo Produto" pill button */}
        {!isCollapsed && (
          <div style={{ padding: '16px 16px 8px' }}>
            <button
              type="button"
              onClick={() => {
                if (onAddNewProduct) {
                  onAddNewProduct();
                } else {
                  handleNavigate('products', '/produtos');
                }
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '9px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Plus size={16} />
              <span>Novo Produto</span>
            </button>
          </div>
        )}

        {/* Navigation List matching the screenshot exact items */}
        <nav style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id, item.path)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  width: '100%',
                  padding: isCollapsed ? '10px 0' : '9px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: isActive ? '1px solid var(--border-hover)' : '1px solid transparent',
                  background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon
                    size={17}
                    color={isActive ? 'var(--helen-red)' : 'currentColor'}
                    style={{ flexShrink: 0 }}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Logout Button (matching reference) */}
      <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border-light)' }}>
        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? 'Sair' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '12px',
            width: '100%',
            padding: isCollapsed ? '10px 0' : '8px 14px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

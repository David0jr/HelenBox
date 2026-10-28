import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  X,
  MapPin,
  Package,
  LogOut,
} from 'lucide-react';
import type { User, Product, ProductVariant } from '../../shared/types';
import type { NavTab } from '../Sidebar/Sidebar';
import { HashtagSwatch } from '../../shared/ui/HashtagSwatch';

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { ROUTE_TAB_MAP } from '../Sidebar/Sidebar';

interface TopbarProps {
  currentTab?: NavTab;
  products?: (Product & { variants: ProductVariant[] })[];
  onSelectProduct?: (product: Product, variant?: ProductVariant) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  currentUser?: User;
  onNavigateToSettings?: () => void;
  onGoBack?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab: propTab,
  products = [],
  onSelectProduct,
  theme = 'light',
  onToggleTheme,
  currentUser: propUser,
  onNavigateToSettings,
  onGoBack,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTab = propTab || ROUTE_TAB_MAP[location.pathname] || 'dashboard';
  const currentUser: User = propUser || authUser || {
    id: 'user-admin',
    name: 'David HelenBox (Admin)',
    email: 'admin@helencolor.com.br',
    role: 'ADMIN',
    active: true,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  };

  const handleGoToSettings = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      navigate('/configuracoes');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tabTitles: Record<NavTab, string> = {
    dashboard: 'VISÃO GERAL',
    movements: 'ENTRADAS & SAÍDAS',
    products: 'PRODUTOS',
    invoices: 'INVOICES CN',
    warehouse: 'MAPA DO GALPÃO',
    relocate: 'REALOCAR CARGA',
    picking: 'BIPAGEM / PICKING',
    orders: 'PEDIDOS',
    permissions: 'PERMISSÕES',
    logs: 'AUDITORIA',
    settings: 'CONFIGURAÇÕES',
  };

  // Global Ctrl+K focuses the inline search input directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsDropdownOpen(true);
      }
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = searchTerm.toLowerCase().trim();

  // Search matching products & variants
  const results: { product: Product; variant: ProductVariant }[] = [];
  products.forEach((prod) => {
    prod.variants.forEach((v) => {
      const match =
        !q ||
        prod.name_pt.toLowerCase().includes(q) ||
        (prod.name_cn && prod.name_cn.toLowerCase().includes(q)) ||
        prod.supplier_code.toLowerCase().includes(q) ||
        prod.sku_helenbox.toLowerCase().includes(q) ||
        v.variant_sku.toLowerCase().includes(q) ||
        (v.collection_code && v.collection_code.toLowerCase().includes(q)) ||
        (v.color_code && v.color_code.toLowerCase().includes(q)) ||
        (v.aroma_flavor && v.aroma_flavor.toLowerCase().includes(q)) ||
        (v.color_name && v.color_name.toLowerCase().includes(q)) ||
        (v.aisle && `rua ${v.aisle}`.toLowerCase().includes(q));

      if (match) {
        results.push({ product: prod, variant: v });
      }
    });
  });

  const handleSelectItem = (prod: Product, variant: ProductVariant) => {
    if (onSelectProduct) {
      onSelectProduct(prod, variant);
    }
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <header className="topbar">
      {/* Left: Breadcrumb matching reference system "SISTEMA / VISÃO GERAL" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          SISTEMA
        </span>
        <span style={{ fontSize: '11px', color: 'var(--border-hover)', opacity: 0.7 }}>/</span>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          {tabTitles[currentTab] || 'VISÃO GERAL'}
        </span>
      </div>

      {/* Center: Sophisticated, Compact Pill Search Bar (diminuído e refinado per feedback) */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '300px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-input)',
            border: isDropdownOpen ? '1px solid var(--border-focus)' : '1px solid var(--border-light)',
            borderRadius: 'var(--radius-pill)',
            padding: '0 12px',
            height: '32px',
            transition: 'all var(--transition-fast)',
            boxShadow: isDropdownOpen ? '0 0 0 2px var(--helen-red-subtle)' : 'none',
          }}
        >
          <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar produtos, #hashtags ou SKUs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isDropdownOpen) setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: '0 8px',
              fontSize: '11.5px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />

          {searchTerm ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              style={{ padding: '2px', color: 'var(--text-muted)', width: '20px', height: '20px' }}
            >
              <X size={12} />
            </button>
          ) : (
            <kbd
              style={{
                background: 'var(--bg-surface)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '9.5px',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-muted)',
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Inline Autocomplete Dropdown directly under the search bar */}
        {isDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              maxHeight: '340px',
              overflowY: 'auto',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 14px', color: 'var(--text-muted)' }}>
                <Package size={22} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                <p style={{ fontSize: '12px', fontWeight: 600 }}>Nenhum produto encontrado</p>
                <p style={{ fontSize: '10.5px', marginTop: '2px' }}>Tente pesquisar por #861, aroma ou SKU</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '4px 8px', fontSize: '9.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {searchTerm ? `Resultados (${results.length})` : 'Acesso Rápido'}
                </div>

                {results.slice(0, 5).map(({ product, variant }) => (
                  <div
                    key={variant.id}
                    onClick={() => handleSelectItem(product, variant)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 9px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Left: Thumbnail & Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <img
                        src={variant.image_url || product.image_url}
                        alt={product.name_pt}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          objectFit: 'cover',
                          border: '1px solid var(--border-light)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.name_pt}
                          </span>
                          {variant.collection_code && (
                            <HashtagSwatch
                              collectionCode={variant.collection_code}
                              colorCode={variant.color_code}
                              hexColor={variant.hex_color}
                              size="sm"
                            />
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          SKU: {variant.variant_sku}
                        </div>
                      </div>
                    </div>

                    {/* Right: Location & Stock */}
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {variant.stock_units || 0} un
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        <MapPin size={9} color="var(--helen-red)" />
                        <span>Rua {variant.aisle || 'A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Matching Reference (Theme, Bell with dot, Divider, User Profile) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px', justifyContent: 'flex-end' }}>
        {/* Theme Toggle (Moon / Sun) */}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onToggleTheme}
          style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%', color: 'var(--text-secondary)' }}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications Bell with subtle red indicator dot */}
        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '30px', height: '30px', padding: 0, borderRadius: '50%', color: 'var(--text-secondary)', position: 'relative' }}
          title="Notificações: 2 lotes próximos do vencimento"
          onClick={() => alert('Notificações HelenBox: 2 lotes próximos do vencimento (FEFO)')}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={15} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--helen-red)',
                boxShadow: '0 0 0 1.5px var(--bg-topbar)',
              }}
            />
          </div>
        </button>

        {/* Subtle Divider Line */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-light)', margin: '0 2px' }} />

        {/* User Profile Pill Button (Click navigates directly to Settings Page) */}
        <button
          type="button"
          onClick={handleGoToSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '2px 10px 2px 3px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            outline: 'none',
            height: '32px',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-hover)';
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
          }}
          title="Configurações da Conta"
        >
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={currentUser.name}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {currentUser.name.split(' ')[0]}
            </span>
            <span style={{ fontSize: '9px', color: 'var(--helen-red)', fontWeight: 700, letterSpacing: '0.3px', lineHeight: 1.1 }}>
              {currentUser.role}
            </span>
          </div>
        </button>

        {/* Quick Logout Button next to profile */}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleLogout}
          style={{
            width: '30px',
            height: '30px',
            padding: 0,
            borderRadius: '50%',
            color: 'var(--text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Sair"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};

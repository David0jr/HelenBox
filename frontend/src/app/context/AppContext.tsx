import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Product,
  ProductVariant,
  ProductUom,
  Warehouse,
  TeamMember,
  ActionAuditLog,
  Order,
} from '../../shared/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_WAREHOUSES,
  INITIAL_TEAM_MEMBERS,
  INITIAL_LOGS,
} from '../../shared/mockData';
import { useAuth } from '../../features/auth';

interface AppContextValue {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Warehouses
  warehouses: Warehouse[];
  currentWarehouse: Warehouse;
  setCurrentWarehouse: (warehouse: Warehouse) => void;

  // Products & Orders
  products: (Product & { variants: ProductVariant[] })[];
  addProduct: (newProduct: Product & { variants: ProductVariant[] }) => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  activePickingOrderId: string | null;
  setActivePickingOrderId: React.Dispatch<React.SetStateAction<string | null>>;

  // Team & Logs
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  logs: ActionAuditLog[];
  setLogs: React.Dispatch<React.SetStateAction<ActionAuditLog[]>>;

  // Actions
  handleRelocateSuccess: (newLocation: string, qty: number, productName?: string) => void;
  handleUpdateMember: (updated: TeamMember) => void;
  handleAddMember: (newMember: TeamMember) => void;

  // Modals
  relocateTarget: {
    isOpen: boolean;
    productName: string;
    variant?: ProductVariant;
  };
  openRelocateModal: (product?: Product & { variants?: ProductVariant[] }, variant?: ProductVariant) => void;
  closeRelocateModal: () => void;

  labelModalTarget: {
    isOpen: boolean;
    productName: string;
    variant?: ProductVariant;
    uom?: ProductUom;
  };
  openLabelModal: (product: Product & { variants?: ProductVariant[] }, variant?: ProductVariant, uom?: ProductUom) => void;
  closeLabelModal: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserProfile } = useAuth();

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('helenbox_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('helenbox_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Warehouses
  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse>(INITIAL_WAREHOUSES[0]);

  // Data Store with persistence for custom products
  const [products, setProducts] = useState<(Product & { variants: ProductVariant[] })[]>(() => {
    try {
      const saved = localStorage.getItem('helenbox_products_custom');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...INITIAL_PRODUCTS];
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });

  const addProduct = (newProd: Product & { variants: ProductVariant[] }) => {
    setProducts((prev) => {
      const next = [newProd, ...prev];
      try {
        const customProds = next.filter((p) => p.id.startsWith('prod-custom-') || !INITIAL_PRODUCTS.some((ip) => ip.id === p.id));
        localStorage.setItem('helenbox_products_custom', JSON.stringify(customProds));
      } catch {
        // ignore storage errors
      }
      return next;
    });

    const newLog: ActionAuditLog = {
      id: `log-${Date.now()}`,
      user_name: user?.name || 'Administrador',
      action_type: 'RELOCATE',
      location: newProd.location_summary || 'Galpão 1',
      details: `Cadastrou o produto ${newProd.name_pt} (SKU: ${newProd.sku_helenbox})`,
      created_at: 'Agora mesmo',
    };
    setLogs((prev) => [newLog, ...prev]);
  };
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activePickingOrderId, setActivePickingOrderId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [logs, setLogs] = useState<ActionAuditLog[]>(INITIAL_LOGS);

  // Relocate Modal State
  const [relocateTarget, setRelocateTarget] = useState<{
    isOpen: boolean;
    productName: string;
    variant?: ProductVariant;
  }>({
    isOpen: false,
    productName: '',
  });

  // Barcode Thermal Label Modal State
  const [labelModalTarget, setLabelModalTarget] = useState<{
    isOpen: boolean;
    productName: string;
    variant?: ProductVariant;
    uom?: ProductUom;
  }>({
    isOpen: false,
    productName: '',
  });

  const openRelocateModal = (product?: Product & { variants?: ProductVariant[] }, variant?: ProductVariant) => {
    setRelocateTarget({
      isOpen: true,
      productName: product ? product.name_pt : products[0].name_pt,
      variant: variant || (product?.variants ? product.variants[0] : products[0].variants[0]),
    });
  };

  const closeRelocateModal = () => {
    setRelocateTarget((prev) => ({ ...prev, isOpen: false }));
  };

  const openLabelModal = (
    product: Product & { variants?: ProductVariant[] },
    variant?: ProductVariant,
    uom?: ProductUom,
  ) => {
    setLabelModalTarget({
      isOpen: true,
      productName: product.name_pt,
      variant: variant || (product.variants ? product.variants[0] : undefined),
      uom: uom || variant?.uoms?.[0],
    });
  };

  const closeLabelModal = () => {
    setLabelModalTarget((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRelocateSuccess = (newLocation: string, qty: number, targetName?: string) => {
    const prodName = targetName || relocateTarget.productName || 'Produtos';
    const newLog: ActionAuditLog = {
      id: `log-${Date.now()}`,
      user_name: user?.name || 'Administrador',
      action_type: 'RELOCATE',
      location: newLocation,
      details: `Transferiu ${qty} caixas de ${prodName} para ${newLocation}`,
      created_at: 'Agora mesmo',
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateMember = (updated: TeamMember) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (user && updated.id === user.id) {
      updateUserProfile({ name: updated.name, email: updated.email });
    }
  };

  const handleAddMember = (newMember: TeamMember) => {
    setTeamMembers((prev) => [...prev, newMember]);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        user_name: user?.name || 'Administrador',
        action_type: 'LOGIN',
        details: `Cadastrou o novo colaborador ${newMember.name} (${newMember.role})`,
        created_at: 'Agora mesmo',
      },
      ...prev,
    ]);
  };

  const value: AppContextValue = {
    theme,
    toggleTheme,
    warehouses,
    currentWarehouse,
    setCurrentWarehouse,
    products,
    addProduct,
    orders,
    setOrders,
    activePickingOrderId,
    setActivePickingOrderId,
    teamMembers,
    setTeamMembers,
    logs,
    setLogs,
    handleRelocateSuccess,
    handleUpdateMember,
    handleAddMember,
    relocateTarget,
    openRelocateModal,
    closeRelocateModal,
    labelModalTarget,
    openLabelModal,
    closeLabelModal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};

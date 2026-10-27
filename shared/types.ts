/**
 * HELENBOX WMS - SHARED TYPES (Single Source of Truth)
 * Enforcing Principle I of HelenBox Constitution: Zero Redundancy & Strict DRY.
 * Aligned with Hexagonal Architecture and Feature-Sliced Design.
 */

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface Warehouse {
  id: string;
  code: string; // e.g. "DEP1", "DEP2"
  name: string; // e.g. "Galpão Principal - Matriz", "Galpão 2 - Filial"
  address: string;
  active: boolean;
  created_at?: string;
}

export interface Location {
  id: string;
  warehouse_id: string;
  warehouse_code?: string;
  warehouse_name?: string;
  aisle: string; // Rua (e.g. "A", "B", "R01")
  shelf: string; // Prateleira (e.g. "01", "02", "P03")
  level: string; // Nível/Andar (e.g. "N1", "N2")
  position?: string;
  full_code: string; // e.g. "DEP1-R02-P04-N01"
}

export interface Product {
  id: string;
  sku_helenbox: string; // e.g. "HB-CUT-OIL-5ML"
  supplier_code: string; // e.g. "HYYY-001-3" (Código fábrica China)
  name_pt: string; // Tradução/Nome em Português
  name_cn?: string; // Nome original em Chinês
  brand: string; // "Helen Color"
  category: string; // "Óleos de Cutícula", "Esmaltes", etc.
  has_expiry: boolean;
  image_url?: string;
  box_length_cm?: number;
  box_width_cm?: number;
  box_height_cm?: number;
  gross_weight_kg?: number;
  net_weight_kg?: number;
  variants_count?: number;
  total_stock_units?: number;
  created_at?: string;
}

export type UomType = 'UN' | 'DZ' | 'PCT' | 'CX' | 'CXM';

export interface ProductUom {
  id: string;
  variant_id: string;
  uom_type: UomType; // UN, DZ, PCT, CX, CXM
  description: string; // Ex: "Dúzia (12 un)", "Caixa Master (1200 un)"
  multiplier: number; // Ex: UN=1, DZ=12, PCT=6, CX=24, CXM=1200
  barcode: string; // Ex: "DZ-789001234567"
  is_default_sale: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_sku: string; // e.g. "HB-CUT-OIL-MOR" ou "HB-ESM-861-50"
  aroma_flavor?: string; // e.g. "Morango", "Chocolate", "Café"
  color_tone?: string;
  collection_code?: string; // e.g. "#861" (Linha/Coleção de Esmaltes)
  color_code?: string; // e.g. "#50" (Identificador da cor da hashtag)
  hex_color?: string; // e.g. "#C49A6C" (Amostra visual da cor)
  color_name?: string; // e.g. "Olho de Gato Ouro Rosa"
  volume: string; // "5ml", "10ml", etc.
  image_url?: string;
  uoms?: ProductUom[];
  stock_units?: number;
}


export interface Lot {
  id: string;
  variant_id: string;
  variant_sku?: string;
  product_name?: string;
  aroma_flavor?: string;
  batch_number: string; // e.g. "LOTE-202610-01"
  manufacturing_date?: string;
  expiration_date?: string; // Crucial para ordenação FEFO
  days_until_expiry?: number;
  is_expired?: boolean;
  created_at?: string;
}

export interface StockBatch {
  id: string;
  lot_id: string;
  variant_id?: string;
  variant_sku?: string;
  product_name?: string;
  aroma_flavor?: string;
  batch_number?: string;
  expiration_date?: string;
  location_id: string;
  location_code?: string;
  warehouse_id?: string;
  warehouse_code?: string;
  quantity_units: number; // Saldo em unidades básicas
  updated_at?: string;
}

export type MovementType = 'IN_INVOICE' | 'OUT_ORDER' | 'TRANSFER' | 'UNBOX' | 'ADJUST';

export interface StockMovement {
  id: string;
  lot_id: string;
  variant_sku?: string;
  product_name?: string;
  from_location_id?: string;
  to_location_id?: string;
  from_location_code?: string;
  to_location_code?: string;
  movement_type: MovementType;
  quantity_units: number;
  barcode_scanned: string;
  uom_detected: UomType;
  order_id?: string;
  order_number?: string;
  user_id: string;
  user_name: string;
  created_at: string;
  notes?: string;
}

export type InvoiceStatus = 'PENDING' | 'PROCESSED' | 'RECONCILED';

export interface SupplierInvoice {
  id: string;
  invoice_number: string;
  file_name: string;
  upload_date: string;
  status: InvoiceStatus;
  total_items: number;
  raw_chinese_json: string;
  translated_json: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  supplier_code: string;
  raw_name_cn: string;
  translated_name_pt: string;
  quantity_pcs: number;
  master_boxes?: number;
  unit_price?: number;
  matched_variant_id?: string;
  physical_checked_qty: number;
}

export type OrderChannel = 'SHOPEE' | 'WHATSAPP' | 'MANUAL';
export type OrderStatus = 'PENDING' | 'PICKING' | 'CHECKED' | 'DISPATCHED';

export interface Order {
  id: string;
  order_number: string;
  channel: OrderChannel;
  customer_name: string;
  status: OrderStatus;
  total_items: number;
  scanned_items?: number;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  variant_sku: string;
  product_name: string;
  aroma_flavor?: string;
  uom_type: UomType;
  quantity_ordered: number;
  quantity_scanned: number;
  location_id?: string;
  location_code?: string;
  warehouse_code?: string;
  lot_id?: string;
  expiration_date?: string; // Para validação FEFO
  status: 'PENDING' | 'CHECKED';
}

export type ActionLogType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SEARCH' 
  | 'VIEW_LOCATION' 
  | 'SCAN_OUT' 
  | 'INVOICE_IMPORT' 
  | 'UNBOX'
  | 'CREATE_PRODUCT';

export interface ActionAuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action_type: ActionLogType;
  query_term?: string;
  target_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

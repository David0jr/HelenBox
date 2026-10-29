export const _typesModule = true;

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
  location_summary?: string;
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
  variant_sku: string; // e.g. "RGJ-2418-80" ou "CMJD-002PK"
  aroma_flavor?: string; // e.g. "Morango", "Grão 80#", "Rosa"
  color_tone?: string;
  collection_code?: string; // e.g. "#861" (Linha/Coleção)
  color_code?: string; // e.g. "#50" ou "#80"
  hex_color?: string; // e.g. "#C49A6C" (Amostra visual da cor)
  color_name?: string; // e.g. "Rosa-pink, grão 80#"
  volume: string; // "30ml", "150ml", "50 un/cx", etc.
  packaging_info?: string; // e.g. "12 caixinhas por saco grande · 100 dúzias por caixa"
  unit_label?: string; // "Peça", "Dúzia", "Pacote"
  qty_original?: number; // Quantidade na unidade original (ex: 200 Dúzias)
  boxes_count?: number; // Caixas próprias (ex: 10)
  units_per_box?: number; // Un. por caixa (ex: 144)
  is_mixed_box?: boolean; // + 1 mista
  box_numbers?: string; // Nº das caixas (ex: "347-350, 353")
  container_date?: string; // e.g. "19/08/2026" ou "27/08/2026"
  image_url?: string;
  uoms?: ProductUom[];
  stock_units?: number;
  aisle?: string;
  shelf?: string;
  level?: string;
  warehouse_code?: string;
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
  quantity_units: number;
  updated_at?: string;
}

export type MovementType = 'IN_INVOICE' | 'OUT_ORDER' | 'TRANSFER' | 'UNBOX' | 'ADJUST';

export interface StockMovement {
  id: string;
  lot_id: string;
  variant_sku?: string;
  product_name: string;
  collection_code?: string;
  color_code?: string;
  hex_color?: string;
  from_location_code?: string;
  to_location_code?: string;
  movement_type: MovementType;
  quantity_units: number;
  barcode_scanned: string;
  uom_detected: UomType;
  order_number?: string;
  channel?: 'SHOPEE' | 'WHATSAPP' | 'CHINA_INVOICE' | 'INTERNAL';
  user_name: string;
  created_at: string;
  exact_time: string;
  notes?: string;
}

export type InvoiceStatus = 'PENDING' | 'PROCESSED' | 'RECONCILED';

export interface SupplierInvoice {
  id: string;
  invoice_number: string;
  file_name: string;
  upload_date: string;
  container_type?: string;
  origin_agent?: string;
  gross_weight_kg?: number;
  volume_cbm?: number;
  mixed_boxes?: number;
  status: InvoiceStatus;
  total_items: number;
  total_boxes: number;
  total_pieces: number;
  raw_chinese_json?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  supplier_code: string;
  raw_name_cn: string;
  translated_name_pt: string;
  description_pt?: string;
  packaging_info?: string;
  unit_label?: string;
  qty_original?: number;
  quantity_pcs: number;
  master_boxes?: number;
  units_per_box?: number;
  is_mixed_box?: boolean;
  box_numbers?: string;
  image_url?: string;
  matched_variant_id?: string;
  physical_checked_qty: number;
}

export type OrderChannel = 'SHOPEE' | 'WHATSAPP' | 'MANUAL';
export type OrderStatus = 'PENDING' | 'PICKING' | 'CHECKED' | 'DISPATCHED';

export interface OrderDivergence {
  id: string;
  order_id: string;
  order_number: string;
  operator_id: string;
  operator_name: string;
  scanned_code: string;
  product_name: string;
  divergence_type: 'NOT_IN_ORDER' | 'QUANTITY_EXCEEDED';
  reason: string;
  status: 'AUDITED' | 'PENDING_REVIEW';
  created_at: string;
  audited_by_name?: string;
  audited_at?: string;
  audit_notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  channel: OrderChannel;
  customer_name: string;
  customer_phone?: string;
  customer_document?: string;
  shipping_address?: string;
  shipping_city?: string;
  notes?: string;
  status: OrderStatus;
  total_items: number;
  scanned_items: number;
  created_at: string;
  assigned_to_id?: string;
  assigned_to_name?: string;
  has_divergence?: boolean;
  divergences?: OrderDivergence[];
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  variant_sku: string;
  product_name: string;
  aroma_flavor?: string;
  collection_code?: string;
  color_code?: string;
  hex_color?: string;
  uom_type: UomType;
  quantity_ordered: number;
  quantity_scanned: number;
  location_code: string;
  warehouse_code: string;
  lot_number?: string;
  expiration_date?: string;
  status: 'PENDING' | 'CHECKED';
}

export type ActionLogType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SEARCH' 
  | 'VIEW_LOCATION' 
  | 'SCAN_OUT' 
  | 'SCAN_DIVERGENCE'
  | 'INVOICE_IMPORT' 
  | 'UNBOX'
  | 'RELOCATE'
  | 'CREATE_PRODUCT';

export interface ActionAuditLog {
  id: string;
  user_name: string;
  action_type: ActionLogType;
  query_term?: string;
  target_id?: string;
  location?: string;
  details?: string;
  created_at: string;
}

// User Permission Matrix Types
export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit_relocate: boolean;
  scan_picking: boolean;
  delete: boolean;
}

export interface SystemModule {
  key: string;
  name: string;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  active: boolean;
  last_login?: string;
  permissions: Record<string, ModulePermissions>;
}

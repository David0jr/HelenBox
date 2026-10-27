-- =====================================================================
-- HELENBOX WMS - SUPABASE DATABASE MIGRATION
-- Multi-Warehouse, FEFO Picking, Multi-UoM Barcodes & Security Logs
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Warehouses (Galpão 1 e Galpão 2)
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Locations (Endereçamento WMS: Rua, Prateleira, Nível)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    aisle VARCHAR(10) NOT NULL,
    shelf VARCHAR(10) NOT NULL,
    level VARCHAR(10) NOT NULL,
    position VARCHAR(10),
    full_code VARCHAR(50) UNIQUE NOT NULL
);

-- 3. Products (Catálogo Mestre)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_helenbox VARCHAR(50) UNIQUE NOT NULL,
    supplier_code VARCHAR(50) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    name_cn VARCHAR(255),
    brand VARCHAR(100) DEFAULT 'Helen Color',
    category VARCHAR(100) NOT NULL,
    has_expiry BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    box_length_cm NUMERIC(10,2),
    box_width_cm NUMERIC(10,2),
    box_height_cm NUMERIC(10,2),
    gross_weight_kg NUMERIC(10,3),
    net_weight_kg NUMERIC(10,3),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Product Variants (Aromas, Cores de Esmaltes com Hashtag, Frascos)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_sku VARCHAR(60) UNIQUE NOT NULL,
    aroma_flavor VARCHAR(100),
    color_tone VARCHAR(50),
    collection_code VARCHAR(30), -- Ex: '#861'
    color_code VARCHAR(30),      -- Ex: '#50'
    hex_color VARCHAR(10),       -- Ex: '#C49A6C' (Amostra visual)
    color_name VARCHAR(100),     -- Ex: 'Olho de Gato Ouro Rosa'
    volume VARCHAR(20) DEFAULT '5ml',
    image_url TEXT
);


-- 5. Product UOMs (Códigos de Barra Específicos por Embalagem: UN, DZ, PCT, CX, CXM)
CREATE TABLE IF NOT EXISTS product_uoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    uom_type VARCHAR(10) NOT NULL CHECK(uom_type IN ('UN', 'DZ', 'PCT', 'CX', 'CXM')),
    description VARCHAR(100) NOT NULL,
    multiplier INTEGER NOT NULL CHECK(multiplier > 0),
    barcode VARCHAR(60) UNIQUE NOT NULL,
    is_default_sale BOOLEAN DEFAULT FALSE
);

-- 6. Lots (Controle de Lotes e Validade para Algoritmo FEFO)
CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    batch_number VARCHAR(50) NOT NULL,
    manufacturing_date DATE,
    expiration_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Stock Batches (Saldo Físico por Lote e Localização WMS)
CREATE TABLE IF NOT EXISTS stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    quantity_units INTEGER NOT NULL DEFAULT 0 CHECK(quantity_units >= 0),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lot_id, location_id)
);

-- 8. Supplier Invoices (Invoices da China)
CREATE TABLE IF NOT EXISTS supplier_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(20) NOT NULL CHECK(status IN ('PENDING', 'PROCESSED', 'RECONCILED')),
    total_items INTEGER DEFAULT 0,
    raw_chinese_json JSONB NOT NULL,
    translated_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) NOT NULL,
    raw_name_cn VARCHAR(255) NOT NULL,
    translated_name_pt VARCHAR(255) NOT NULL,
    quantity_pcs INTEGER NOT NULL,
    master_boxes INTEGER,
    unit_price NUMERIC(10,2),
    matched_variant_id UUID REFERENCES product_variants(id),
    physical_checked_qty INTEGER DEFAULT 0
);

-- 9. Orders & Order Items (Pedidos e Separação FEFO)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK(channel IN ('SHOPEE', 'WHATSAPP', 'MANUAL')),
    customer_name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK(status IN ('PENDING', 'PICKING', 'CHECKED', 'DISPATCHED')),
    total_items INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    uom_type VARCHAR(10) DEFAULT 'UN',
    quantity_ordered INTEGER NOT NULL,
    quantity_scanned INTEGER DEFAULT 0,
    location_id UUID REFERENCES locations(id),
    lot_id UUID REFERENCES lots(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CHECKED'))
);

-- 10. Stock Movements (Trilha Imutável de Auditoria)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID REFERENCES lots(id),
    from_location_id UUID REFERENCES locations(id),
    to_location_id UUID REFERENCES locations(id),
    movement_type VARCHAR(20) NOT NULL CHECK(movement_type IN ('IN_INVOICE', 'OUT_ORDER', 'TRANSFER', 'UNBOX', 'ADJUST')),
    quantity_units INTEGER NOT NULL,
    barcode_scanned VARCHAR(60) NOT NULL,
    uom_detected VARCHAR(10) NOT NULL,
    order_id UUID REFERENCES orders(id),
    user_id UUID NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- 11. Action Audit Logs (Logs de Ações, Pesquisas e Segurança)
CREATE TABLE IF NOT EXISTS action_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    query_term VARCHAR(255),
    target_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Índices de Alta Performance para Milhares de SKUs
CREATE INDEX IF NOT EXISTS idx_product_uoms_barcode ON product_uoms(barcode);
CREATE INDEX IF NOT EXISTS idx_products_supplier_code ON products(supplier_code);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku_helenbox);
CREATE INDEX IF NOT EXISTS idx_variants_hashtag ON product_variants(collection_code, color_code);
CREATE INDEX IF NOT EXISTS idx_lots_expiry ON lots(expiration_date ASC);
CREATE INDEX IF NOT EXISTS idx_stock_batches_lot ON stock_batches(lot_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_location ON stock_batches(location_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON action_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON action_audit_logs(user_id);


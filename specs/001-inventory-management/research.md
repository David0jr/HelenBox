# Pesquisa e Decisões Técnicas de Engenharia (Phase 0: Research)

**Feature**: HelenBox WMS & Gestão Inteligente de Estoque  
**Data**: 2026-10-26  
**Status**: Ratificado  

---

## 1. Frontend: Feature-Sliced Design (FSD / Feature Tree)

### Decisão
A interface Web adotará estritamente a metodologia **Feature-Sliced Design (FSD)**:
- `app/`: Inicialização, provedores do Supabase, roteamento e estilização global (tokens de cor escuro/claro).
- `pages/`: Componentes de páginas que compõem widgets (Dashboard, Invoices, Products, WarehouseMap, PickingTerminal, SecurityLogs).
- `widgets/`: Blocos compostos reutilizáveis com lógica própria (ex.: `WarehouseGrid` para visualização das ruas/prateleiras dos 2 depósitos, `PickingConsole` para bipagem de pedidos, `InvoiceReconciliationTable`).
- `features/`: Ações de negócio executadas pelo usuário:
  - `scan-out-barcode/`: Captura e validação de código de barras físico/câmera.
  - `unbox-packaging/`: Descompactação de caixa master em dúzias ou unidades.
  - `upload-chinese-invoice/`: Processamento e conferência de planilhas da China.
  - `transfer-warehouse-stock/`: Movimentação entre Galpão 1 e Galpão 2.
- `entities/`: Modelos de domínio visualizados e manipulados:
  - `product/`, `variant/`, `lot/`, `warehouse/`, `order/`, `audit-log/`.
- `shared/`: Camada base sem regras de negócio (componentes visuais atômicos, cliente Supabase, síntese de áudio do bipador, hooks de leitor de teclado USB/Bluetooth).

---

## 2. Backend: Arquitetura Hexagonal (Ports & Adapters)

### Decisão
O backend será desenvolvido em **TypeScript puro com Arquitetura Hexagonal limpa**, garantindo independência total de frameworks e facilidade de testes unitários:

```text
backend/src/
├── core/
│   ├── domain/                         # Entidades e Regras de Negócio puras (Zero dependências)
│   │   ├── entities/                   # Product, ProductVariant, LotBatch, Warehouse, Location, Order, StockMovement, ActionLog
│   │   ├── value-objects/              # Barcode (com prefixos UN, DZ, PCT, CX, CXM), ExpiryDate, UoMQuantity
│   │   ├── services/                   # Algoritmo FEFO, Cálculo de Conversão de Embalagens, Validador de Bipagem
│   │   └── exceptions/                 # Erros de domínio tipados (Ex: BarcodeMismatchException, InsufficientStockException)
│   └── ports/                          # Contratos de interfaces
│       ├── in/                         # Portas de Entrada (Use Cases / Drivers)
│       │   ├── ImportInvoiceUseCase.ts
│       │   ├── ScanOutBarcodeUseCase.ts
│       │   ├── UnboxMasterPackageUseCase.ts
│       │   ├── GetWarehouseLayoutUseCase.ts
│       │   ├── GetPickingListUseCase.ts
│       │   └── SearchInventoryUseCase.ts
│       └── out/                        # Portas de Saída (Drivens / Repositórios)
│           ├── InventoryRepositoryPort.ts
│           ├── ProductRepositoryPort.ts
│           ├── WarehouseRepositoryPort.ts
│           ├── OrderRepositoryPort.ts
│           ├── InvoiceRepositoryPort.ts
│           ├── AuditLogRepositoryPort.ts
│           ├── BarcodeGeneratorPort.ts
│           └── TranslationServicePort.ts
└── adapters/
    ├── in/                             # Adaptadores Primários (Entrada)
    │   ├── http/                       # Express REST API (Controllers, Middlewares, Rotas)
    │   └── mcp/                        # Servidor MCP para IA / Shopee / WhatsApp
    └── out/                            # Adaptadores Secundários (Saída)
        ├── database/                   # Adaptador Supabase / PostgreSQL
        ├── parser/                     # SheetJS Excel Parser para Invoices da China
        ├── barcode/                    # Bwip-js Barcode Generator
        └── translation/                # Dicionário Inteligente e IA para Chinês
```

---

## 3. Banco de Dados: Supabase Cloud (PostgreSQL)

### Decisão
- **Hospedagem**: Supabase Cloud gerenciado (PostgreSQL 15+).
- **Sincronização em Tempo Real (Realtime)**: O Supabase Realtime permite que o Galpão 1 e o Galpão 2 vejam instantaneamente qualquer bipagem ou movimentação de estoque realizada no outro depósito sem necessidade de recarregar a tela.
- **Segurança e RBAC**: Row Level Security (RLS) associado ao Supabase Auth para restringir acessos de escrita a Administradores/Estoquistas e manter os Visualizadores em modo somente-leitura.
- **Esquema de Migrações SQL Versionadas**: Scripts SQL autônomos em `supabase/migrations/` para deploy idempotente e reproduzível.

---

## 4. Padronização de Códigos de Barras por Unidade de Medida (UoM)

### Decisão
Para eliminar divergências operacionais causadas por diferentes tipos de venda (unidade, dúzia, pacote, caixa display e caixa master):
- **Padrão**: Code-128 com prefixos canônicos:
  - `UN-[EAN/SKU]`: Unidade individual avulsa (ex: 1 frasco de 5ml). Multiplicador = 1.
  - `DZ-[EAN/SKU]`: Dúzia (12 unidades). Multiplicador = 12.
  - `PCT-[EAN/SKU]`: Pacote (ex: 6 ou 10 unidades). Multiplicador configurável por produto.
  - `CX-[EAN/SKU]`: Caixa / Display intermediário (ex: 24 unidades). Multiplicador configurável.
  - `CXM-[EAN/SKU]`: Caixa Master grande da China (ex: 500, 1.200 ou 2.400 unidades). Multiplicador da caixa master.
- **Comportamento do Scanner**: Ao ler o código de barras, o sistema decodifica o prefixo e calcula a dedução exata de unidades no saldo, debitando a embalagem correta.

---

## 5. Algoritmo de Separação de Pedidos FEFO (First-Expired, First-Out)

### Decisão
- Quando um produto possui data de validade (`expiration_date`), cada lote (`batch_number`) tem sua validade registrada.
- Ao gerar uma lista de separação de pedido (Picking List), o algoritmo de separação seleciona obrigatoriamente a localização física do lote com menor data de validade que possua saldo suficiente.
- Caso o operador bipe o código de barras de um lote diferente, o sistema alerta e orienta a substituição pelo lote mais antigo.

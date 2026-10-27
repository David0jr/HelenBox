# Tasks: HelenBox WMS & Gestão Inteligente de Estoque

**Feature**: HelenBox WMS & Gestão Inteligente de Estoque  
**Branch**: `001-inventory-management`  
**Arquitetura**: Backend Hexagonal (Ports & Adapters) + Frontend Feature-Sliced Design (FSD) + Supabase  

---

## Phase 1: Setup & Shared Infrastructure

**Purpose**: Definição de tipos compartilhados, migração SQL do Supabase e configuração base.

- [ ] T001 [P] Criar definições canônicas de tipos em `shared/types.ts` incluindo entidades, UoMs (UN, DZ, PCT, CX, CXM), Lotes com validade, Movimentações e Logs de Segurança.
- [ ] T002 [P] Criar script de migração completo do Supabase em `supabase/migrations/20261026000000_init_helenbox.sql`.
- [ ] T003 [P] Configurar `backend/package.json` e `backend/tsconfig.json` para Node.js com TypeScript e suporte a ESM.
- [ ] T004 [P] Configurar `frontend/package.json`, `frontend/tsconfig.json` e `frontend/vite.config.ts` para React 18+ com Vite e Tailwind/CSS.

---

## Phase 2: Backend Core - Domain Layer (Hexagon Interior)

**Purpose**: Lógica pura de negócio, entidades e algoritmos sem dependência de frameworks.

- [ ] T005 [P] Criar Value Object `Barcode` em `backend/src/core/domain/value-objects/Barcode.ts` validando prefixos `UN-`, `DZ-`, `PCT-`, `CX-` e `CXM-` e retornando o multiplicador correspondente.
- [ ] T006 [P] Criar Value Object `ExpiryDate` em `backend/src/core/domain/value-objects/ExpiryDate.ts` para cálculo de dias até o vencimento e status de alerta.
- [ ] T007 [P] Implementar algoritmo `FefoPickingStrategy` em `backend/src/core/domain/services/FefoPickingStrategy.ts` ordenando lotes por menor data de validade para separação.
- [ ] T008 [P] Implementar serviço de domínio `PackagingConversionService` em `backend/src/core/domain/services/PackagingConversionService.ts` para descompactação de caixas master em dúzias ou unidades sem perda contábil.
- [ ] T009 [P] Criar exceções tipadas de domínio em `backend/src/core/domain/exceptions/DomainExceptions.ts` (`BarcodeMismatchException`, `InsufficientStockException`, `InvalidLotExpiryException`).

---

## Phase 3: Backend Core - Ports Layer (Interfaces)

**Purpose**: Definição de contratos de entrada (Casos de Uso) e contratos de saída (Repositórios e Serviços).

- [ ] T010 [P] Criar Portas de Entrada em `backend/src/core/ports/in/`:
  - `ImportInvoiceUseCase.ts`
  - `ScanOutBarcodeUseCase.ts`
  - `UnboxPackagingUseCase.ts`
  - `RelocateStockUseCase.ts` (Realocação ágil de caixas/lotes entre ruas/prateleiras)
  - `GetWarehouseLayoutUseCase.ts`
  - `GetPickingListUseCase.ts`
  - `SearchInventoryUseCase.ts` (Com busca por Hashtag de cores `#861 #50`)

- [ ] T011 [P] Criar Portas de Saída em `backend/src/core/ports/out/`:
  - `InventoryRepositoryPort.ts`
  - `ProductRepositoryPort.ts`
  - `WarehouseRepositoryPort.ts`
  - `OrderRepositoryPort.ts`
  - `InvoiceRepositoryPort.ts`
  - `AuditLogRepositoryPort.ts`
  - `BarcodeGeneratorPort.ts`
  - `TranslationServicePort.ts`

---

## Phase 4: Backend Adapters - Outbound (Drivens)

**Purpose**: Adaptadores de persistência Supabase, parser de planilhas e gerador de código de barras.

- [ ] T012 Implementar repositório Supabase / PostgreSQL em `backend/src/adapters/out/database/SupabaseInventoryAdapter.ts` com suporte a fallback local para desenvolvimento.
- [ ] T013 [P] Implementar adaptador SheetJS em `backend/src/adapters/out/parser/SheetJSInvoiceParserAdapter.ts` para extração de dados e códigos chineses (ex.: `HYYY-001-3`).
- [ ] T014 [P] Implementar adaptador de tradução inteligente de chinês em `backend/src/adapters/out/translation/ChineseTranslationAdapter.ts` com vocabulário de cosméticos e termos aduaneiros.
- [ ] T015 [P] Implementar adaptador de geração de código de barras Code-128 em `backend/src/adapters/out/barcode/BwipJsBarcodeAdapter.ts`.

---

## Phase 5: Backend Adapters - Inbound (Drivers & API)

**Purpose**: Controladores HTTP Express e servidor MCP para integrações externas.

- [ ] T016 Implementar controladores REST em `backend/src/adapters/in/http/controllers/`:
  - `InvoiceController.ts` (upload e conferência de invoices da China)
  - `ProductController.ts` (catálogo, SKUs e emissão de etiquetas)
  - `StockController.ts` (baixa obrigatória por bipagem, descompactação e transferências)
  - `WarehouseController.ts` (mapa dos 2 galpões, ruas e prateleiras)
  - `OrderController.ts` (pedidos e lista de picking FEFO)
  - `AuditController.ts` (registro de pesquisas no estoque e logs de segurança)
- [ ] T017 [P] Implementar servidor MCP em `backend/src/adapters/in/mcp/McpServerAdapter.ts` expondo tools de consulta de saldo, localização de produtos e criação de pedidos para IA e canais (Shopee/WhatsApp).
- [ ] T018 Configurar inicialização do servidor Express com middlewares de CORS, erros e injeção de dependências em `backend/src/index.ts`.

---

## Phase 6: Frontend FSD - Shared Layer

**Purpose**: Camada base do frontend (cliente Supabase, áudio do scanner, hook de leitor e componentes UI).

- [ ] T019 [P] Configurar cliente Supabase em `frontend/src/shared/api/supabaseClient.ts`.
- [ ] T020 [P] Implementar sintetizador de áudio para bipador (*beep* agudo de sucesso / tom grave de erro) em `frontend/src/shared/utils/audioFeedback.ts`.
- [ ] T021 [P] Implementar hook de captura rápida de leitor de código de barras USB/Bluetooth em `frontend/src/shared/hooks/useBarcodeScanner.ts`.
- [ ] T022 [P] Criar componentes atômicos de UI (Button, Input, Badge de UoM, Modal, Toast) em `frontend/src/shared/ui/`.

---

## Phase 7: Frontend FSD - Entities & Features

**Purpose**: Modelos visuais e ações de negócio do usuário na interface.

- [ ] T023 [P] Criar entidades visuais em `frontend/src/entities/`:
  - `product/`: Card de produto com foto Helen Color, badges de UoM (UN, DZ, CXM) e **amostras visuais de cor (swatches) com badges de Hashtag (`#861 #50`)**.
  - `lot/`: Badge de data de validade com indicador FEFO e alerta visual de proximidade de vencimento.
  - `warehouse/`: Indicador de galpão (Depósito 1 vs. Depósito 2).
- [ ] T024 [P] Implementar feature `scan-out-barcode` em `frontend/src/features/scan-out-barcode/` com suporte a leitor USB e scanner via câmera (`html5-qrcode`).
- [ ] T025 [P] Implementar feature `relocate-stock-batch` em `frontend/src/features/relocate-stock-batch/` para remanejamento ágil de caixas entre ruas/prateleiras em 2 cliques ou leitor.
- [ ] T026 [P] Implementar feature `upload-chinese-invoice` em `frontend/src/features/upload-chinese-invoice/` com drag-and-drop e prévia traduzida.
- [ ] T027 [P] Implementar feature `unbox-packaging` em `frontend/src/features/unbox-packaging/` para descompactar caixas master.


---

## Phase 8: Frontend FSD - Widgets & Pages

**Purpose**: Montagem dos blocos compostos e telas completas da aplicação.

- [ ] T027 Desenvolver widget `WarehouseGrid` em `frontend/src/widgets/WarehouseGrid/` exibindo visualmente a grade física de Ruas, Prateleiras e Níveis dos 2 depósitos.
- [ ] T028 Desenvolver widget `PickingConsole` em `frontend/src/widgets/PickingConsole/` com roteiro ordenado por FEFO e terminal de bipagem.
- [ ] T029 Desenvolver widget `SecurityLogTable` em `frontend/src/widgets/SecurityLogTable/` com filtros rápidos por usuário e busca de pesquisas realizadas.
- [ ] T030 Construir as páginas completas em `frontend/src/pages/`:
  - `Dashboard`: Indicadores de estoque, caixas master recebidas e alertas de validade.
  - `Invoices`: Histórico e upload de planilhas da China traduzidas.
  - `Products`: Catálogo com milhares de variações, busca instantânea e impressão de etiquetas.
  - `WarehouseMap`: Visualizador gráfico dos Depósitos 1 e 2.
  - `PickingTerminal`: Terminal dedicado de separação e expedição por bipagem.
  - `SecurityLogs`: Tela de auditoria de pesquisas no estoque e sessões ativas.
- [ ] T031 Configurar roteamento, navegação lateral e alternância de tema escuro/claro em `frontend/src/app/App.tsx`.

---

## Phase 9: Seed, Validação Realista & Verificação Constitucional

**Purpose**: Dados de demonstração com produtos Helen Color da imagem, planilha de teste em chinês e testes de ponta a ponta.

- [ ] T032 Criar script de seed em `backend/src/adapters/out/database/seed.ts` com:
  - Depósito 1 (Galpão Principal) e Depósito 2 (Filial).
  - Ruas A, B, C e Prateleiras 01 a 05.
  - Caixa Master `HYYY-001-3` (1.200 pcs, 20kg, 56x53x27.5cm) contendo óleos de cutícula *Helen Color* com os 11 aromas da foto (Chocolate, Morango, Maçã, Café, etc.).
  - Códigos de barras prefixados para cada UoM (`UN-`, `DZ-`, `CXM-`).
  - Lotes com datas de validade para demonstrar o algoritmo FEFO.
- [ ] T033 [P] Criar planilha demonstrativa em chinês `invoice_exemplo_china.xlsx` com termos comerciais reais para testes de upload.
- [ ] T034 Executar teste completo de ponta a ponta validando todos os cenários de `specs/001-inventory-management/quickstart.md`.
- [ ] T035 Revisar conformidade com os princípios da Constituição do HelenBox (Zero Redundância, DRY, Arquitetura Hexagonal, FSD e Segurança).

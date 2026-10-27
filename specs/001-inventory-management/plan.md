# Implementation Plan: HelenBox WMS & Gestão Inteligente de Estoque

**Branch**: `001-inventory-management` | **Date**: 2026-10-26 | **Spec**: [spec.md](file:///c:/Users/David/Desktop/HelenBox/specs/001-inventory-management/spec.md)

**Input**: Feature specification from `specs/001-inventory-management/spec.md`

---

## Summary

O **HelenBox WMS** é um sistema completo de gestão física de estoque e expedição multicanal para importações da China.
A arquitetura foi desenhada com padrões rigorosos de engenharia:
- **Frontend**: **Feature-Sliced Design (FSD / Feature Tree)** em React 18+ com Vite e Tailwind/CSS.
- **Backend**: **Arquitetura Hexagonal (Ports & Adapters)** em Node.js com TypeScript puro, desacoplado de frameworks e bibliotecas externas.
- **Banco de Dados**: **Supabase Cloud (PostgreSQL)** com suporte a sincronização em tempo real entre o Galpão 1 e o Galpão 2.
- **Regras de Negócio Centrais**:
  1. Ingestão e tradução de invoices da China (SheetJS + IA) mapeando o código original do fornecedor (ex: `HYYY-001-3`).
  2. Múltiplas Unidades de Medida e Venda (UoM: UN, Dúzia, Pacote, Caixa Display, Caixa Master) com **códigos de barra Code-128 específicos com prefixos identificadores** (`UN-`, `DZ-`, `PCT-`, `CX-`, `CXM-`).
  3. Controle de lotes com validade e algoritmo **FEFO estrito (First-Expired, First-Out)** no roteiro de picking.
  4. Endereçamento físico WMS em 2 depósitos (Galpão, Ruas e Prateleiras).
  5. Saída de estoque blindada exclusivamente via leitura de código de barras, com regra inegociável de **Venda Sempre Prioritária**: produtos em processo de realocação física ou transferência continuam 100% vendáveis e podem ser bipados a qualquer momento sem travar o faturamento.
  6. Trilha completa de **Logs de Auditoria e Segurança** (registro de pesquisas no estoque, horários e sessões de login/logout).


---

## Technical Context

**Language/Version**: TypeScript 5+ (Node.js 20+ no Backend, React 18+ no Frontend).  
**Primary Dependencies**:
- *Backend (Hexagonal)*:
  - `core/domain`: TypeScript puro (zero dependências de framework).
  - `adapters/in/http`: Express / Fastify (adaptador de porta HTTP).
  - `adapters/out/database`: `@supabase/supabase-js` (PostgreSQL).
  - `adapters/out/parser`: `xlsx` (SheetJS).
  - `adapters/out/barcode`: `bwip-js` (Code-128 e EAN-13).
  - `adapters/in/mcp`: `@modelcontextprotocol/sdk` (Servidor MCP).
- *Frontend (Feature-Sliced Design)*:
  - React, Vite, Lucide Icons, `html5-qrcode` (Scanner por câmera), `@supabase/supabase-js`.  
**Storage**: Supabase Cloud (PostgreSQL) com Realtime e migrações versionadas em `supabase/migrations/`.  
**Testing**: Vitest / Jest para testes de portas e domínio; testes de integração para adaptadores.  
**Target Platform**: Desktop (Estações de estoque/caixa) e Mobile/Tablet (Estoquistas nos corredores).  
**Project Type**: Decoupled Web Application (Backend Hexagonal + Frontend FSD).  
**Performance Goals**: Leitura de código de barras em < 30ms; busca no estoque com debounce em < 50ms; feedback sonoro instantâneo.  

---

## Constitution Check

| Princípio Constitucional | Status | Avaliação e Conformidade |
|---|---|---|
| **I. Zero Redundância & DRY Estrito** | ✅ PASS | Tipos canônicos compartilhados em `shared/types.ts`. Toda regra de conversão de UoM e cálculo FEFO reside em `core/domain/services/`, sem replicação em controllers ou componentes de tela. |
| **II. Prevenção Ativa de Erros & Fail-Fast** | ✅ PASS | Validação em camadas através de Value Objects (`Barcode`, `UoMQuantity`, `ExpiryDate`). Códigos de barra incorretos são rejeitados antes de qualquer mutação de estado. |
| **III. Ciclo SDD Rigoroso** | ✅ PASS | `Specify` $\rightarrow$ `Clarify` $\rightarrow$ `Plan` $\rightarrow$ `Tasks` $\rightarrow$ `Implement`. |
| **IV. Arquitetura Modular e Desacoplada** | ✅ PASS | Arquitetura Hexagonal estrita no backend e Feature-Sliced Design no frontend. A camada de domínio não conhece Express nem Supabase. |
| **V. Rastreabilidade e Auditoria** | ✅ PASS | Auditoria completa de movimentações em `stock_movements` e trilha de auditoria de pesquisas e acessos em `action_audit_logs`. |

---

## Project Structure

```text
HelenBox/
├── .agents/
│   └── skills/                                 # Skills do Spec Kit
├── .specify/
│   ├── memory/constitution.md                  # Constituição
│   └── templates/                              # Templates oficiais
├── specs/
│   └── 001-inventory-management/
│       ├── spec.md                             # Especificação ratificada
│       ├── research.md                         # Pesquisa e decisões de arquitetura
│       ├── data-model.md                       # Modelo Supabase/PostgreSQL com FEFO
│       ├── contracts/api-spec.json             # Contratos REST OpenAPI
│       ├── quickstart.md                       # Roteiro de validação
│       ├── plan.md                             # Este plano de implementação
│       └── tasks.md                            # Lista de tarefas por camadas
├── supabase/
│   └── migrations/
│       └── 20261026000000_init_helenbox.sql    # Script SQL do Supabase
├── shared/
│   └── types.ts                                # Tipos Canônicos (Single Source of Truth)
├── backend/                                    # ARQUITETURA HEXAGONAL (Ports & Adapters)
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/                         # Domínio Puro
│   │   │   │   ├── entities/                   # Product, Variant, Lot, Warehouse, Location, Order, Log
│   │   │   │   ├── value-objects/              # Barcode (UN, DZ, PCT, CX, CXM), ExpiryDate
│   │   │   │   ├── services/                   # FefoPickingStrategy, PackagingConversionService
│   │   │   │   └── exceptions/                 # Erros de domínio tipados
│   │   │   └── ports/
│   │   │       ├── in/                         # Use Cases (Driver Ports)
│   │   │       └── out/                        # Repositórios e Serviços (Driven Ports)
│   │   ├── adapters/
│   │   │   ├── in/                             # HTTP REST Controllers & MCP Server
│   │   │   │   ├── http/
│   │   │   │   └── mcp/
│   │   │   └── out/                            # Supabase Repository, Excel Parser, Barcode Gen
│   │   │       ├── database/
│   │   │       ├── parser/
│   │   │       └── barcode/
│   │   └── index.ts                            # Bootstrap e injeção de dependências
│   ├── package.json
│   └── tsconfig.json
└── frontend/                                   # FEATURE-SLICED DESIGN (FSD / Feature Tree)
    ├── src/
    │   ├── app/                                # Provedores, roteamento, estilos globais
    │   ├── pages/                              # Telas da aplicação
    │   │   ├── Dashboard/
    │   │   ├── Invoices/
    │   │   ├── Products/
    │   │   ├── WarehouseMap/
    │   │   ├── PickingTerminal/
    │   │   └── SecurityLogs/
    │   ├── widgets/                            # Blocos compostos reutilizáveis
    │   │   ├── WarehouseGrid/
    │   │   ├── PickingConsole/
    │   │   └── InvoiceReconciliationTable/
    │   ├── features/                           # Ações de negócio
    │   │   ├── scan-out-barcode/
    │   │   ├── unbox-packaging/
    │   │   └── upload-chinese-invoice/
    │   ├── entities/                           # Modelos visuais das entidades
    │   │   ├── product/
    │   │   ├── lot/
    │   │   └── warehouse/
    │   └── shared/                             # Componentes UI, Supabase client, áudio, hooks
    ├── package.json
    └── vite.config.ts
```

---

## Phases & Deliverables

- **Phase 0**: Pesquisa $\rightarrow$ [research.md](file:///c:/Users/David/Desktop/HelenBox/specs/001-inventory-management/research.md)
- **Phase 1**: Modelo de Dados $\rightarrow$ [data-model.md](file:///c:/Users/David/Desktop/HelenBox/specs/001-inventory-management/data-model.md)
- **Phase 1**: Contratos da API $\rightarrow$ [contracts/api-spec.json](file:///c:/Users/David/Desktop/HelenBox/specs/001-inventory-management/contracts/api-spec.json)
- **Phase 1**: Guia Rápido $\rightarrow$ [quickstart.md](file:///c:/Users/David/Desktop/HelenBox/specs/001-inventory-management/quickstart.md)
- **Phase 2**: Próximo passo $\rightarrow$ Atualização das tarefas no [tasks.md](file:///c:/Users/David/Desktop/HelenBox/specs/001-inventory-management/tasks.md) organizadas pelas camadas Hexagonal e FSD.

# Feature Specification: HelenBox WMS & Gestão Inteligente de Estoque

**Feature Branch**: `001-inventory-management`  
**Created**: 2026-10-26  
**Status**: Ratified & Architecturally Aligned  
**Target System**: HelenBox WMS (Warehouse Management System)  
**Metodologia de Engenharia**: Spec-Driven Development (Spec Kit)  

---

## 🏛️ Diretrizes de Arquitetura Ratificadas

1. **Frontend**: **Feature-Sliced Design (FSD / Feature Tree)**
   - `app/`: Provedores globais, rotas e estilos base.
   - `pages/`: Telas e visões completas da aplicação.
   - `widgets/`: Blocos compostos autocontidos (ex.: grade física do galpão, terminal de bipagem).
   - `features/`: Casos de uso do usuário na UI (bipagem de saída, upload de invoice, descompactação de caixa).
   - `entities/`: Modelos de domínio com representações visuais (produtos, variações, lotes, depósitos, pedidos).
   - `shared/`: Componentes UI reutilizáveis, cliente Supabase, utilitários de áudio do scanner e hooks.

2. **Backend**: **Arquitetura Hexagonal (Ports & Adapters)** em Node.js com TypeScript puro
   - `core/domain/`: Entidades de negócio, Value Objects (`Barcode`, `UoM`, `ExpiryDate`), regras de negócio e cálculo FEFO.
   - `core/ports/`: Portas de Entrada (casos de uso / drivers) e Portas de Saída (repositórios e serviços externos / drivens).
   - `adapters/inbound/`: Controladores HTTP REST e Servidor MCP.
   - `adapters/outbound/`: Adaptadores Supabase/PostgreSQL, Parser de Invoices (SheetJS), Gerador de Barcodes (`bwip-js`) e Tradutor IA.

3. **Banco de Dados**: **Supabase (PostgreSQL Cloud)**
   - Sincronização em tempo real entre o Depósito 1 e o Depósito 2 via Supabase Realtime.
   - Suporte a Row Level Security (RLS) para controle de acesso por perfis (Admin, Operador, Visualizador).
   - Tabelas com integridade referencial estrita, constraints e índices para milhares de SKUs.

4. **Regra de Separação de Estoque (Picking)**: **FEFO Estrito (First-Expired, First-Out)**
   - Produtos perecíveis ou cosméticos com validade registram lote (`batch_number`) e data de expiração (`expiration_date`).
   - A rota de separação sempre prioriza a prateleira do lote com data de vencimento mais próxima.

5. **Múltiplas Unidades de Medida e Venda (UoM) com Códigos de Barras Próprios**:
   - Cada produto suporta múltiplas embalagens de venda:
     - `UN`: Unidade individual (ex.: 1 frasco de 5ml).
     - `DZ`: Dúzia (12 unidades).
     - `PCT`: Pacote (ex.: 6 ou 10 unidades).
     - `CX`: Caixa / Display intermediário (ex.: 24 ou 36 unidades).
     - `CXM`: Caixa Master de importação (ex.: 500, 1.200 ou 2.400 unidades).
   - Códigos de barras padrão **Code-128** com prefixos identificadores determinísticos (ex.: `UN-789...`, `DZ-789...`, `PCT-789...`, `CX-789...`, `CXM-789...`).
   - Ao bipar o código de barras no leitor, o sistema identifica imediatamente a unidade de medida e deduz o volume correto de unidades sem ambiguidades.

6. **Auditoria de Ações e Logs de Segurança**:
   - Trilha de auditoria completa registrando quem pesquisou no estoque, termo pesquisado e timestamp.
   - Histórico de logins e logouts.
   - Imutabilidade das movimentações de inventário.

---

## 🎯 User Scenarios & Testing (Priorizados)

### User Story 1 - Ingestão Inteligente e Tradução de Invoices da China (Priority: P1)
Como Administrador ou Estoquista, quero carregar a planilha de invoice em chinês recebida do fornecedor para que o sistema extraia os códigos de fábrica chineses (ex.: `HYYY-001-3`), traduza nomes, cores e especificações para português e prepare a conferência de entrada.

**Cenários de Aceite**:
1. **Given** o upload de uma planilha `.xlsx` em chinês, **When** o adaptador de ingestão processa o arquivo, **Then** as colunas e termos de cosméticos/unhas são traduzidos automaticamente para português.
2. **Given** um código de fábrica já associado a um SKU HelenBox, **When** a planilha é importada, **Then** o sistema faz o casamento automático com o produto correspondente.
3. **Given** um produto novo não identificado, **When** a invoice é importada, **Then** o sistema gera uma pendência de cadastro pré-preenchida com os dados traduzidos.

---

### User Story 2 - Catálogo Escalável, Esmaltes com Hashtag (#) e Códigos de Barras Prefixados (Priority: P1)
Como Administrador ou Estoquista, quero cadastrar produtos e suas variações com suporte dedicado ao carro-chefe da marca (**Esmaltes Helen Color com códigos de cor em Hashtag `#`, ex.: `#861 #50`**), exibindo amostra visual de cor (swatch) e gerando códigos de barras distintos para cada Unidade de Medida (UN, DZ, PCT, CX, CXM).

**Cenários de Aceite**:
1. **Given** um esmalte magnético com código de linha `#861` e cor `#50`, **When** o produto é cadastrado ou importado da China, **Then** o sistema extrai e indexa os identificadores `#861` e `#50`, exibe o badge visual com a cor e gera o SKU HelenBox `HB-ESM-861-50`.
2. **Given** a busca no estoque por `#50`, `861`, `#861 #50` ou pelo nome da cor, **When** o usuário digita na barra de pesquisa, **Then** o sistema filtra instantaneamente a variação correta sem confusão visual entre tons similares.
3. **Given** o cadastro de um produto com múltiplas embalagens de venda, **When** o usuário salva o item, **Then** o sistema gera códigos de barras Code-128 específicos com os prefixos `UN-`, `DZ-`, `PCT-`, `CX-` e `CXM-`.
4. **Given** a necessidade de impressão térmica, **When** o usuário clica em emitir etiquetas, **Then** o sistema gera o layout de etiqueta com foto, hashtag da cor (`#861 #50`), nome, variação, UoM e código de barras nítido.

---

### User Story 3 - Controle de Lotes, Validade e Descompactação de Embalagens (Priority: P1)
Como Operador, quero controlar os lotes com datas de validade e realizar a descompactação de caixas master em dúzias, pacotes ou unidades avulsas sem perdas contábeis de saldo.

**Cenários de Aceite**:
1. **Given** a entrada de um lote de produtos com data de validade, **When** o lote é armazenado, **Then** o sistema vincula a data de expiração àquela coordenada física (Galpão, Rua, Prateleira).
2. **Given** uma caixa master fechada de 1.200 unidades, **When** o operador executa o comando de descompactar 1 caixa master em dúzias, **Then** o sistema subtrai 1 caixa master e credita 100 dúzias (1.200 unidades) na localização.

---

### User Story 4 - Endereçamento Físico WMS nos 2 Depósitos (Galpão, Ruas e Prateleiras) (Priority: P2)
Como Funcionário ou Administrador, quero visualizar a distribuição de estoque entre os 2 depósitos físicos da empresa, sabendo exatamente em qual galpão, rua, prateleira e nível cada produto e lote estão alocados.

**Cenários de Aceite**:
1. **Given** a consulta do estoque consolidado, **When** o usuário filtra por produto, **Then** o sistema exibe o total disponível e a discriminação exata entre Depósito 1 e Depósito 2.
2. **Given** uma transferência entre galpões, **When** as caixas saem do Depósito 1, **Then** o sistema coloca o lote em status "Em Trânsito" até a bipagem de entrada no Depósito 2.

---

### User Story 5 - Saída de Estoque Rigorosa com Bipagem Obrigatória e Regra FEFO (Priority: P1)
Como Administrador, quero garantir que a baixa de saída de qualquer pedido só seja realizada mediante a leitura física do código de barras da embalagem, respeitando a regra FEFO, **garantindo que mercadorias em processo de movimentação interna ou realocação NUNCA travem as vendas e possam ser bipadas imediatamente**.

**Cenários de Aceite**:
1. **Given** um pedido de expedição contendo itens com validade, **When** o operador recebe a rota de separação, **Then** o sistema aponta prioritariamente para a rua e prateleira do lote que vence primeiro (FEFO).
2. **Given** mercadorias que estão sendo remanejadas de prateleira ou em trânsito entre galpões, **When** surge um pedido urgente de venda, **Then** o operador pode bipar o produto diretamente onde ele estiver; o sistema **NUNCA bloqueia a venda**, dá baixa atômica no saldo contabilizado e conclui a expedição normalmente.
3. **Given** o momento da conferência de saída, **When** o operador bipa a etiqueta correta (leitor USB/Bluetooth ou câmera), **Then** o sistema valida o prefixo de embalagem (UN, DZ, PCT, CX, CXM), dá baixa atômica no saldo correspondente e emite som de sucesso.
4. **Given** a tentativa de bipar um código que não pertence ao pedido ou ao produto solicitado, **When** o scanner é acionado, **Then** o sistema bloqueia imediatamente com feedback sonoro e visual de erro ("Item incorreto para este pedido").

---

### User Story 6 - Controle de Acesso por Papéis (RBAC) via Supabase Auth (Priority: P2)
Como Administrador, quero definir papéis de acesso (Visualizador, Operador, Administrador) para que funcionários de apoio possam apenas consultar localização física e quantidades sem permissão de alterar cadastros ou saldos.

---

### User Story 7 - Aba de Pedidos, Picking Inteligente e Servidor MCP (Priority: P2)
Como Gerente de Estoque, quero visualizar todos os pedidos recebidos (Shopee, WhatsApp, Manual), acompanhar a rota de picking e permitir que agentes inteligentes e sistemas externos consultem o estoque via MCP.

---

### User Story 8 - Auditoria de Ações, Pesquisas e Logs de Segurança (Priority: P2)
Como Administrador, quero ter acesso à tela de Logs de Segurança e Auditoria para rastrear quem pesquisou no estoque (termo e data/hora), histórico de acessos (login/logout) e todas as movimentações realizadas.

---

### User Story 9 - Realocação Ágil de Estoque com Disponibilidade Contínua de Venda (Priority: P1)
Como Administrador ou Estoquista, quero transferir caixas e produtos de uma rua/prateleira para outra com extrema facilidade (seja por 2 cliques no mapa ou via bipagem de caixa $\rightarrow$ bipagem de destino), **mantendo todo o estoque 100% ativo e vendável durante todo o processo**.

**Por que esta prioridade**: A reorganização física semanal é constante no galpão. O faturamento e o despacho de pedidos aos clientes jamais podem esperar a finalização de uma arrumação de prateleiras.

**Cenários de Aceite**:
1. **Given** a chegada de uma nova carga exigindo remanejamento de caixas, **When** o operador seleciona o lote na Rua A / Prateleira 02 e escolhe a Rua C / Prateleira 05 no mapa, **Then** o sistema transfere o saldo atomicamente e atualiza as coordenadas em tempo real.
2. **Given** um lote sendo movimentado entre ruas ou galpões, **When** uma venda desse produto é disparada, **Then** o sistema permite a bipagem de saída imediata da mercadoria, abatendo o saldo sem qualquer travamento.
3. **Given** a utilização do leitor no galpão, **When** o operador bipa a caixa no modo "Realocar" e em seguida bipa o código de barras da prateleira de destino, **Then** o sistema confirma a mudança de endereço com som positivo e registra a movimentação na auditoria.



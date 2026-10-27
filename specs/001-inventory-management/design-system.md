# HelenBox Design System & UI/UX Specification

**Feature**: HelenBox WMS & Gestão Inteligente de Estoque  
**Versão**: 1.0.0  
**Data**: 2026-10-27  
**Padrão Arquitetural**: Feature-Sliced Design (FSD)  
**Identidade Visual**: Helen Color (Preto & Vermelho Oficial) + HelenBox (📦 Caixa WMS)

---

## 🎨 1. Paleta de Cores e Tokens Visuais

Baseada nas cores oficiais do site institucional da **Helen Color** e adaptada para ambientes de alta densidade de informação (WMS):

### 1.1 Cores Primárias da Marca
- **Preto Profundo (Helen Black)**: `#111111` / `#18181B` (Base da marca, barras laterais, cabeçalhos fortes).
- **Vermelho Helen Color (Brand Accent)**: `#E51E2B` (Cor de destaque da marca para botões primários, badges ativos, logo monograma).
- **Vermelho Hover**: `#C41420` (Estado de hover e foco em elementos primários).
- **Branco Puro**: `#FFFFFF` (Superfície limpa de leitura e cartões no modo claro).

### 1.2 Cores Semânticas de Estoque e Operação
- **Verde Sucesso / Em Estoque**:
  - Claro: `#10B981` (Texto/Ícone), Fundo: `#ECFDF5`, Borda: `#A7F3D0`
  - Escuro: `#34D399` (Texto), Fundo: `rgba(16, 185, 129, 0.15)`, Borda: `rgba(16, 185, 129, 0.3)`
  - *Uso*: Produtos com estoque saudável, bipagem correta no scanner, conferência 100%.
- **Laranja/Âmbar Alerta / Estoque Baixo / Alerta FEFO**:
  - Claro: `#F59E0B` (Texto/Ícone), Fundo: `#FFFBEB`, Borda: `#FDE68A`
  - Escuro: `#FBBF24` (Texto), Fundo: `rgba(245, 158, 11, 0.15)`, Borda: `rgba(245, 158, 11, 0.3)`
  - *Uso*: Lotes próximos do vencimento (FEFO), prateleiras quase cheias, produtos com estoque crítico.
- **Vermelho Alerta / Esgotado / Erro de Bipagem**:
  - Claro: `#EF4444` (Texto), Fundo: `#FEF2F2`, Borda: `#FECACA`
  - Escuro: `#F87171` (Texto), Fundo: `rgba(239, 68, 68, 0.15)`, Borda: `rgba(239, 68, 68, 0.3)`
  - *Uso*: Produto esgotado, bipagem de item incorreto no pedido, lote vencido.
- **Azul Corporativo / Em Trânsito / Seleção**:
  - Claro: `#3B82F6` (Texto), Fundo: `#EFF6FF`, Borda: `#BFDBFE`
  - Escuro: `#60A5FA` (Texto), Fundo: `rgba(59, 130, 246, 0.15)`, Borda: `rgba(59, 130, 246, 0.3)`
  - *Uso*: Transferência entre Galpão 1 e Galpão 2, abas selecionadas, pedidos em separação.

### 1.3 Superfícies e Fundos (Dark & Light Theme)
- **Modo Escuro (Dark Mode Premium)**:
  - Background Geral: `#0B0B0E`
  - Superfície dos Cards: `#131317`
  - Superfície Elevada (Modais/Dropdowns): `#1C1C22`
  - Bordas e Divisores: `#27272F`
  - Texto Primário: `#F4F4F5`
  - Texto Secundário: `#A1A1AA`
- **Modo Claro (Clean Light Mode)**:
  - Background Geral: `#F8F9FA`
  - Superfície dos Cards: `#FFFFFF`
  - Superfície Elevada: `#FFFFFF` (com sombra suave `0 4px 20px rgba(0,0,0,0.06)`)
  - Bordas e Divisores: `#E5E7EB`
  - Texto Primário: `#111827`
  - Texto Secundário: `#6B7280`

---

## 🔤 2. Tipografia

- **Família Tipográfica**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
- **Pesos**:
  - Regular (400): Textos de descrição e dados de tabelas.
  - Medium (500): Rótulos de formulário, itens de menu e badges.
  - Semibold (600): Cabeçalhos de seção, nomes de produtos, códigos de hashtag `#`.
  - Bold (700): Valores de KPIs, títulos principais e alertas de leitor.
- **Monospace**: `JetBrains Mono`, `Fira Code`, `Consolas` para códigos de barra, SKUs internos e códigos de fábrica da China (ex.: `HYYY-001-3`, `DZ-789001234`).

---

## 📦 3. Identidade HelenBox (Logo & Ícone)

- **Monograma**: As letras **HC** da Helen Color com o **H** em preto e o **C** entrelaçado em vermelho `#E51E2B`.
- **Ícone do Sistema**: Uma caixa tridimensional geométrica (📦 Box) com fita vermelha estilizada e abertura superior, simbolizando recebimento, armazenagem e expedição.
- **Tipografia do Logo**:
  - `HELEN` em letras pretas firmes (Bold).
  - `BOX` em vermelho `#E51E2B` dentro de um retângulo arredondado de borda sutil.

---

## 📐 4. Arquitetura de Layout (Inspirada no Comlogik & PixelStore)

```text
+-----------------------------------------------------------------------------------------+
| [📦 HELENBOX]  | 🔍 Busca Global (Ctrl+K)   | 🏢 Galpão 1 v | 🔔 3 | 🌙 | 👤 Admin v     |
+-----------------------------------------------------------------------------------------+
| SIDEBAR        | CONTEÚDO PRINCIPAL                                    | PAINEL LATERAL |
|                |                                                       | (QUICK ACTIONS)|
| 📊 Dashboard   | [KPIs: Total Produtos | Caixas Master | Vencendo | ...] |                |
| 📦 Produtos    |-------------------------------------------------------| [Ações Rápidas]|
| 📄 Invoices CN | [Filtros: Todos (250) | Em Estoque | Alerta FEFO]     | • Novo Produto |
| 🗺️ Mapa Galpão |-------------------------------------------------------| • Importar XML |
| 🏷️ Bipagem Out | [TABELA DE PRODUTOS / GRADE DE RUAS / PEDIDOS]        | • Bipar Saída  |
| 📋 Pedidos     |                                                       |                |
| 🛡️ Logs Segur. | • Foto | Nome + #861 #50 | Saldo UoM | Rua/Prat | Ação| • Realocar     |
| ⚙️ Permissões  |                                                       |                |
+----------------+-------------------------------------------------------+----------------+
```

### 4.1 Barra de Navegação Lateral (Sidebar)
- Fundo escuro permanente no modo escuro ou branco clean no modo claro.
- Ícones nítidos com espaçamento confortável.
- Indicador de página ativa com pílula de fundo vermelha ou azul e texto em destaque.
- Rodapé da sidebar com status de conexão do galpão (Online / Sincronizado com Supabase) e botão de Logout.

### 4.2 Topbar Superior
- **Busca Global Instantânea**: Campo de busca com atalho de teclado `Ctrl + K` capaz de pesquisar por SKU HelenBox, código de fábrica da China (`HYYY-001-3`), código de barras ou Hashtag de cor do esmalte (`#861 #50`).
- **Seletor de Galpão**: Alternador rápido entre `🏢 Galpão Principal (Matriz)` e `🏢 Galpão 2 (Filial)` com atualização automática do mapa e saldos.
- **Indicador de Notificações**: Alertas de produtos vencendo (FEFO) e pedidos pendentes.
- **Botão de Alternância de Tema**: Toggle de Sol/Lua para troca imediata entre Dark e Light mode.
- **Avatar e Perfil**: Foto do usuário com badge do papel (`ADMIN`, `OPERADOR`, `VISUALIZADOR`).

---

## 🔒 5. Matriz de Permissões de Usuários (Tabela de Checkboxes)

Conforme solicitado no áudio 3, o Administrador possui uma **tabela interativa de caixas de seleção (checkboxes)** para conceder ou revogar permissões granulares ao cadastrar ou editar membros da equipe:

| Módulo do Sistema | Visualizar (Read) | Cadastrar (Create) | Editar / Realocar (Update) | Bipar / Baixar (Execute) | Excluir / Ajustar (Delete) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Catálogo de Produtos** | ☑️ | ☑️ | ☑️ | ⬜ | ☑️ |
| **Invoices da China (Tradução)** | ☑️ | ☑️ | ⬜ | ☑️ | ⬜ |
| **Mapa do Galpão & Realocação** | ☑️ | ⬜ | ☑️ (Mover Ruas) | ⬜ | ⬜ |
| **Bipagem de Saída (Expedição)**| ☑️ | ⬜ | ⬜ | ☑️ (Scanner Bip) | ⬜ |
| **Aba de Pedidos & Picking** | ☑️ | ☑️ | ☑️ | ☑️ | ⬜ |
| **Logs de Auditoria & Segurança**| ☑️ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Gestão de Usuários e Perfis** | ☑️ | ☑️ | ☑️ | ⬜ | ☑️ |

- Botões rápidos de preenchimento:
  - `[Selecionar Todos]`
  - `[Perfil Padrão: Operador de Estoque]` (Apenas Visualizar + Bipar Saída + Realocar)
  - `[Perfil Padrão: Visualizador / Vendedor]` (Apenas Visualizar)
  - `[Perfil Padrão: Administrador]` (Todas as caixas marcadas)

---

## 💅 6. Componentes Específicos do Domínio Helen Color

### 6.1 Badge de Esmalte com Hashtag (#) e Amostra de Cor
- **Estrutura**:
  - Amostra circular da cor real (`hex_color` ou gradiente perolado/magnético).
  - Linha da Coleção em badge cinza grafite: `[#861]`.
  - Código da Cor em badge destacado: `[#50]`.
  - Nome comercial da cor (ex.: *Olho de Gato Ouro Rosa*).
- **Etiqueta Térmica Preview**:
  - O modal de impressão renderiza fielmente o formato 100x50mm ou 50x30mm com os dados organizados, logotipo Helen Color e código de barras nítido Code-128.

### 6.2 Badges de Unidade de Medida (UoM)
- `[UN]` Azul Claro: Frasco ou peça avulsa.
- `[DZ]` Roxo Suave: Dúzia (12 unidades).
- `[PCT]` Laranja: Pacote.
- `[CX]` Ciano: Caixa display (24 ou 36 unidades).
- `[CXM]` Vermelho Helen Color: Caixa Master fechada (1.200 peças).

### 6.3 Grade Visual do Galpão (WarehouseGrid)
- Representação gráfica dos corredores e estantes do Galpão 1 e Galpão 2.
- Cores por ocupação:
  - Cinza claro: Posição livre.
  - Verde: Posição ocupada com produto.
  - Laranja: Lote com validade próxima (FEFO).
- **Interação de Realocação Ágil**:
  - Botão de transferência em 2 cliques (`Mover para...`) abrindo modal simples com seleção de Galpão, Rua e Prateleira de destino.

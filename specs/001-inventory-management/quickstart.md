# Guia Rápido de Teste e Validação (Quickstart)

**Feature**: HelenBox WMS & Gestão Inteligente de Estoque  
**Versão**: 1.0.0  

Este guia detalha o passo a passo para inicializar o sistema e validar cada um dos fluxos descritos na especificação.

---

## 🚀 1. Inicialização do Ambiente

O HelenBox é composto por:
- **Backend API**: Node.js/TypeScript em `backend/` rodando na porta `3001` (com banco SQLite `helenbox.db`).
- **Frontend Dashboard**: SPA React/Vite em `frontend/` rodando na porta `3000` (ou `5173`).

### Comandos de Inicialização:
```bash
# 1. No diretório do Backend:
cd backend
npm install
npm run dev

# 2. No diretório do Frontend:
cd frontend
npm install
npm run dev
```

---

## 🧪 2. Roteiro de Validação dos Fluxos

### Fluxo 1: Ingestão de Invoice Chinesa
1. Acesse o menu **"Invoices da China"** na barra lateral.
2. Clique em **"Carregar Invoice (.xlsx / .csv)"**.
3. Selecione a planilha de exemplo com termos em chinês e o código de fábrica `HYYY-001-3`.
4. Observe a tradução automática para português dos produtos (ex.: *Óleo de Cutícula Helen Color 5ml*) e a detecção de quantidades e caixas.
5. Confirme a entrada para gerar a conferência no estoque.

### Fluxo 2: Recadastro e Geração de Código de Barras
1. Acesse o menu **"Catálogo de Produtos"**.
2. Visualize o produto recadastrado com o SKU HelenBox `HB-CUT-OIL-MOR`.
3. Clique em **"Etiqueta de Código de Barras"** para visualizar a etiqueta gerada com formato térmico (Code-128 e foto).
4. Imprima ou teste a leitura da etiqueta.

### Fluxo 3: Mapa Físico dos Depósitos (Ruas e Prateleiras)
1. Acesse o menu **"Mapa de Estoque"**.
2. Alterne entre **"Depósito 1"** e **"Depósito 2"**.
3. Clique na **Rua B $\rightarrow$ Prateleira 03** para ver as caixas master de `HYYY-001-3` armazenadas ali.
4. Execute a ação de **"Abrir Caixa Master (Descompactar)"** para disponibilizar 100 displays de 12 pcs.

### Fluxo 4: Saída com Leitor de Código de Barras (Expedição)
1. Acesse a aba **"Pedidos & Separação"**.
2. Abra um pedido em aberto (ex.: Pedido Shopee `#SHP-1001`).
3. O sistema exibe os itens ordenados por localização (Rua e Prateleira).
4. Posicione o cursor no campo de conferência e use o **leitor USB/Bluetooth** ou clique em **"Abrir Câmera"**.
5. Ao bipar o código de barras correto:
   - Som de confirmação (*beep* agudo) e indicador verde.
   - O item é marcado como conferido (+1).
   - O saldo no depósito é baixado atomicamente.
6. Se tentar bipar um item diferente, o sistema bloqueia e emite alerta visual e sonoro de erro.

### Fluxo 5: Controle de Permissões (RBAC)
1. Alterne o perfil de login entre **Visualizador**, **Operador** e **Administrador**.
2. Verifique que o **Visualizador** consegue consultar todas as localizações e saldos, mas não possui os botões de edição de estoque nem baixa manual.

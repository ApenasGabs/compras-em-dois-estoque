# Issues — Módulo de Estoque

> Copie cada bloco abaixo como uma issue separada no GitHub.
> Ordem de implementação recomendada: **1 → 2 → 3 → 9 → 4 → 5 → 7 → 6 → 8**

---

## Issue 1 — [ÉPICO] Módulo de Gerenciamento de Estoque

**Título:** `[ÉPICO] Módulo de Gerenciamento de Estoque`

**Body:**

```
## Objetivo

Implementar o módulo completo de gerenciamento de estoque para o app **Compras em Dois** (Web/React + Supabase).

## Sub-issues

- [ ] #Issue2 — Criar tabelas do módulo de Estoque no Supabase
- [ ] #Issue3 — Criar funções de acesso a dados do estoque em `webData.ts`
- [ ] #Issue4 — Criar `stockStore.ts` (Zustand store para estoque)
- [ ] #Issue5 — Criar `StockPage.tsx` — tela principal do estoque
- [ ] #Issue6 — Auto-adicionar item à lista de compras ativa ao atingir mínimo
- [ ] #Issue7 — Consumo automático diário baseado em frequência configurada
- [ ] #Issue8 — Modo "Tela sempre ativa" (Wake Lock) na tela de estoque
- [ ] #Issue9 — Tela de histórico de movimentações por item
- [ ] #Issue10 — Adicionar rota `/stock` e link na Navbar

## Stack

React + TypeScript + Zustand + Supabase
```

---

## Issue 2 — Criar tabelas do módulo de Estoque no Supabase

**Título:** `[ESTOQUE] Criar tabelas do módulo de Estoque no Supabase`

**Body:**

```
## Contexto

Criar as tabelas `stock_items` e `stock_movements` no Supabase com RLS, constraints e trigger de `atualizado_em`.

## Subtarefas

- [ ] Criar tabela `stock_items` com campos: `id`, `grupo_id`, `nome`, `quantidade`, `quantidade_minima`, `unidade`, `tamanhoPorcao`, `auto_adicionar_lista`, `ultimo_consumo_auto_em`, `criado_em`, `atualizado_em`
- [ ] Criar tabela `stock_movements` com campos: `id`, `item_id`, `tipo` (entrada/saida/ajuste/consumo_auto), `quantidade`, `observacao`, `criado_por`, `criado_em`
- [ ] Adicionar check constraint `quantidade >= 0` em `stock_items`
- [ ] Criar trigger `set_atualizado_em` para atualizar `atualizado_em` automaticamente
- [ ] Habilitar RLS em ambas as tabelas
- [ ] Criar policies: usuários só acessam itens do próprio grupo

## Critérios de Aceite

- Tabelas criadas e acessíveis via Supabase client
- RLS bloqueando acesso a outros grupos
- Constraint impedindo `quantidade < 0`
- Trigger atualizando `atualizado_em` em cada UPDATE

## Dependências

Nenhuma
```

---

## Issue 3 — Criar funções de acesso a dados do estoque em `webData.ts`

**Título:** `[ESTOQUE] Criar funções de acesso a dados do estoque em webData.ts`

**Body:**

```
## Contexto

Adicionar funções tipadas de CRUD para `stock_items` e `stock_movements` em `web/src/services/webData.ts`, seguindo o padrão já existente no arquivo.

## Subtarefas

- [ ] Criar tipos `StockItem` e `StockMovement` em `web/src/types/`
- [ ] `getStockItems(groupId: string): Promise<StockItem[]>`
- [ ] `upsertStockItem(item: Partial<StockItem>): Promise<StockItem>`
- [ ] `deleteStockItem(id: string): Promise<void>`
- [ ] `recordStockMovement(movement: Omit<StockMovement, 'id' | 'criado_em'>): Promise<void>` — deve rejeitar se `quantidade <= 0`
- [ ] `getStockMovements(itemId: string, limit?: number): Promise<StockMovement[]>`
- [ ] `autoAddToShoppingList(groupId: string, itemName: string): Promise<void>` — chama `ensureActiveListForGroup`, verifica duplicata com ILIKE antes de inserir

## Critérios de Aceite

- Todas as funções com tipagem explícita (sem `any`)
- `recordStockMovement` lança erro se `quantidade <= 0`
- `autoAddToShoppingList` não duplica itens na lista ativa

## Dependências

- Issue 2 (tabelas criadas)
```

---

## Issue 4 — Criar `stockStore.ts` (Zustand store para estoque)

**Título:** `[ESTOQUE] Criar stockStore.ts (Zustand store para estoque)`

**Body:**

```
## Contexto

Criar o store Zustand para o módulo de estoque em `web/src/store/stockStore.ts`, seguindo o padrão de `groupStore.ts`.

## Subtarefas

- [ ] Definir interface `StockState` com: `items`, `loading`, `keepScreenOn`, `fetchItems`, `upsertItem`, `updateItemQuantity`, `removeItem`, `clearStock`
- [ ] Implementar `updateItemQuantity` com clamp mínimo em `0` (nunca negativo)
- [ ] Implementar `keepScreenOn: boolean` com setter `setKeepScreenOn`
- [ ] Chamar `clearStock` no logout (integrar com `authStore` ou equivalente)
- [ ] Adicionar `persist` middleware para `keepScreenOn`

## Critérios de Aceite

- Store acessível via `useStockStore()`
- `updateItemQuantity` nunca resulta em quantidade negativa
- `clearStock` limpa state ao fazer logout
- `keepScreenOn` persiste entre reloads

## Dependências

- Issue 3 (funções de dados)
```

---

## Issue 5 — Criar `StockPage.tsx` — tela principal do estoque

**Título:** `[ESTOQUE] Criar StockPage.tsx — tela principal do estoque`

**Body:**

```
## Contexto

Criar a tela principal do módulo de estoque em `web/src/pages/StockPage.tsx`.

## Subtarefas

- [ ] Listar itens do estoque por grupo, agrupados por status
- [ ] Status badge por item: `OK` / `Perto do mínimo` (quantidade <= minimo * 1.2) / `Sem estoque` (quantidade == 0)
- [ ] Botões `+` / `−` por item, respeitando `tamanhoPorcao` configurado
- [ ] Modal de criação/edição de item com campos: nome, quantidade inicial, mínimo, unidade, tamanho de porção, auto-adicionar à lista
- [ ] Botão para abrir `StockHistoryModal` por item
- [ ] Subscription realtime Supabase no canal `stock-{groupId}`
- [ ] Toggle "Tela sempre ativa" (usa hook `useWakeLock`)
- [ ] Chamar `runAutoConsumption` no mount da página

## Critérios de Aceite

- Lista atualiza em tempo real via Supabase Realtime
- Botões `+`/`−` registram movimento e atualizam quantidade
- Modal valida campos obrigatórios antes de salvar
- Status badge muda conforme quantidade atual vs mínima

## Dependências

- Issues 2, 3, 4, 9 (rota), 7 (Wake Lock), 6 (consumo auto)
```

---

## Issue 6 — Auto-adicionar item à lista de compras ativa ao atingir mínimo

**Título:** `[ESTOQUE] Auto-adicionar item à lista de compras ativa ao atingir mínimo`

**Body:**

```
## Contexto

Após cada movimentação de saída, verificar se `quantidade <= quantidade_minima && auto_adicionar_lista === true`. Se sim, adicionar automaticamente o item à lista de compras ativa do grupo.

## Subtarefas

- [ ] Lógica dentro de `recordStockMovement` (ou chamada logo após)
- [ ] Chamar `ensureActiveListForGroup(groupId)` para obter/criar lista ativa
- [ ] Verificar duplicata com ILIKE: não inserir se item já está na lista ativa
- [ ] Exibir toast de confirmação ao usuário quando item for adicionado automaticamente

## Critérios de Aceite

- Item não é duplicado na lista de compras
- Toast aparece quando item é adicionado automaticamente
- Lógica não é acionada quando `auto_adicionar_lista === false`

## Dependências

- Issues 3, 4
```

---

## Issue 7 — Consumo automático diário baseado em frequência configurada

**Título:** `[ESTOQUE] Consumo automático diário baseado em frequência configurada`

**Body:**

```
## Contexto

Implementar a função `runAutoConsumption` que desconta automaticamente do estoque com base na frequência configurada por item.

## Subtarefas

- [ ] Criar função `getDailyConsumption(item: StockItem): number` que suporta frequências: `daily`, `weekly`, `monthly`, `custom`
- [ ] Criar função `runAutoConsumption(groupId: string): Promise<void>`
  - Filtra itens com `consumo_auto > 0`
  - Usa `ultimo_consumo_auto_em` para calcular delta de dias
  - Chama `recordStockMovement` com `tipo: 'consumo_auto'`
  - Atualiza `ultimo_consumo_auto_em`
- [ ] Chamar `runAutoConsumption` no mount de `StockPage`
- [ ] A movimentação gerada alimenta a lógica da Issue 5 (auto-add à lista)

## Critérios de Aceite

- Consumo descontado proporcionalmente aos dias desde último consumo
- `ultimo_consumo_auto_em` atualizado após cada execução
- Não desconta abaixo de `0`

## Dependências

- Issues 3, 4, 5
```

---

## Issue 8 — Modo "Tela sempre ativa" (Wake Lock) na tela de estoque

**Título:** `[ESTOQUE] Modo "Tela sempre ativa" (Wake Lock) na tela de estoque`

**Body:**

```
## Contexto

Criar o hook `useWakeLock` usando a Web Wake Lock API para manter a tela acesa enquanto o usuário estoca produtos.

## Subtarefas

- [ ] Criar `web/src/hooks/useWakeLock.ts`
- [ ] Interface: `{ isActive: boolean, isSupported: boolean, request: () => void, release: () => void }`
- [ ] Re-adquirir lock ao evento `visibilitychange` (página volta ao foco)
- [ ] Liberar lock no `unmount` do componente
- [ ] Toggle na `StockPage` — ocultar botão se `isSupported === false`
- [ ] Persistir preferência em `stockStore` (`keepScreenOn`)

## Critérios de Aceite

- Tela não apaga enquanto Wake Lock estiver ativo
- Lock é re-adquirido quando usuário volta à aba
- Botão de toggle reflete estado atual
- Graceful degradation quando API não suportada

## Dependências

- Issue 4 (stockStore para persistência)
```

---

## Issue 9 — Tela de histórico de movimentações por item

**Título:** `[ESTOQUE] Tela de histórico de movimentações por item`

**Body:**

```
## Contexto

Criar o componente `StockHistoryModal` que exibe o histórico de movimentações de um item de estoque.

## Subtarefas

- [ ] Criar `web/src/components/StockHistoryModal.tsx`
- [ ] Buscar movimentações via `getStockMovements(itemId, limit)` com paginação
- [ ] Ícone e cor diferente por tipo: `entrada` (verde/↑), `saida` (vermelho/↓), `ajuste` (azul/↔), `consumo_auto` (laranja/⚙)
- [ ] Data formatada em pt-BR (ex: "12 de abr. de 2026 às 14:30")
- [ ] Botão "Carregar mais" para paginação
- [ ] Exibir observação quando presente

## Critérios de Aceite

- Histórico ordenado do mais recente para o mais antigo
- Tipos de movimento visualmente distintos
- Paginação funcional

## Dependências

- Issues 2, 3
```

---

## Issue 10 — Adicionar rota `/stock` e link na Navbar

**Título:** `[ESTOQUE] Adicionar rota /stock e link na Navbar`

**Body:**

```
## Contexto

Registrar a rota `/stock` no roteador da aplicação e adicionar o link na Navbar, com guards de autenticação e grupo.

## Subtarefas

- [ ] Adicionar `<Route path="/stock" element={<RequireAuth><RequireGroup><StockPage /></RequireGroup></RequireAuth>} />` em `App.tsx`
- [ ] Adicionar botão/link "Estoque" na Navbar (seguindo padrão dos outros itens de menu)
- [ ] Garantir que `StockPage` só renderiza quando `groupId` está disponível

## Critérios de Aceite

- Rota `/stock` acessível apenas para usuários autenticados com grupo
- Link aparece na Navbar
- Redirecionamento correto quando sem autenticação ou grupo

## Dependências

- Issues 3, 4 (store e dados prontos antes de rotear)
```

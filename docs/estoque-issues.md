# Issues — Módulo de Gerenciamento de Estoque

> **Contexto:** App Web/React com backend Supabase/Postgres.  
> Schema relevante: `shopping_lists (id, group_id, ativa, ...)`, `items (id, list_id, nome, quantidade, categoria, comprado, criado_por, criado_em, preco)`, `groups`, `group_members`, `profiles`.  
> A vinculação entre estoque e lista de compras é feita **por ID** (`items.id`).

---

## Issue 1 — Base de dados do módulo de estoque (tabelas, colunas, policies e migrações)

**Labels sugeridas:** `feat`, `backend`, `database`, `supabase`

### Objetivo

Criar as tabelas e políticas no Supabase/Postgres que suportam o módulo de estoque, sem quebrar o schema atual.

### Contexto

O schema atual registra o histórico de compras via `shopping_lists` + `items`. O estoque é uma entidade separada (`stock_items`) que pode ser vinculada a um `items.id` da lista de compras para evitar duplicações quando o item é adicionado automaticamente.

### Tabelas a criar

#### `stock_items`

| Coluna | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | sim | `gen_random_uuid()` | PK |
| `group_id` | `uuid` | sim | — | FK → `groups.id` (estoque por grupo) |
| `nome` | `text` | sim | — | Nome do item |
| `unidade` | `text` | sim | `'un'` | Unidade base (g, kg, ml, L, un) |
| `quantidade` | `numeric` | sim | `0` | Quantidade atual |
| `quantidade_minima` | `numeric` | não | `null` | Limiar para auto-add na lista |
| `quantidade_ideal` | `numeric` | não | `null` | Quantidade-alvo para sugestão de compra |
| `tamanho_porcao` | `numeric` | não | `null` | Passo do botão −/+ |
| `auto_add_lista` | `boolean` | sim | `false` | Liga/desliga auto-add |
| `item_lista_id` | `uuid` | não | `null` | FK → `items.id` (vínculo com item na lista) |
| `consumo_automatico` | `boolean` | sim | `false` | Liga/desliga consumo automático |
| `consumo_quantidade` | `numeric` | não | `null` | Quanto é consumido por período |
| `consumo_periodo` | `text` | não | `null` | `daily`, `weekly`, `monthly`, `custom` |
| `consumo_dias_custom` | `integer` | não | `null` | Usado quando `consumo_periodo = 'custom'` |
| `ultimo_consumo_em` | `timestamptz` | não | `null` | Data da última execução do consumo automático |
| `criado_por` | `uuid` | não | `null` | FK → `auth.users(id)` |
| `criado_em` | `timestamptz` | sim | `now()` | |
| `atualizado_em` | `timestamptz` | sim | `now()` | Atualizado via trigger |

#### `stock_movements`

| Coluna | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | sim | `gen_random_uuid()` | PK |
| `stock_item_id` | `uuid` | sim | — | FK → `stock_items.id` |
| `tipo` | `text` | sim | — | `in`, `out`, `adjust`, `auto_out` |
| `quantidade` | `numeric` | sim | — | Valor absoluto da movimentação |
| `quantidade_antes` | `numeric` | sim | — | Snapshot antes da operação |
| `quantidade_depois` | `numeric` | sim | — | Snapshot depois da operação |
| `observacao` | `text` | não | `null` | Nota livre |
| `criado_por` | `uuid` | não | `null` | FK → `auth.users(id)` (`null` = automático) |
| `criado_em` | `timestamptz` | sim | `now()` | |

### Policies RLS (Row Level Security)

- `stock_items`: leitura e escrita apenas para membros do mesmo `group_id` (join via `group_members`).
- `stock_movements`: leitura e escrita apenas para membros do grupo do `stock_item` associado.

### Trigger

- `update_stock_items_atualizado_em`: atualiza `atualizado_em = now()` em qualquer UPDATE na tabela `stock_items`.

### Migração

- Arquivo: `supabase/migrations/<timestamp>_create_stock_tables.sql`
- Deve ser idempotente (`CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`).
- Não altera tabelas existentes (`shopping_lists`, `items`, `groups`, etc.).
- Defaults garantem que novos campos não quebram código antigo.

### Critérios de aceitação

- [ ] Migrations aplicadas localmente com `supabase db push` sem erros.
- [ ] RLS habilitado e testado: usuário fora do grupo não consegue ler nem escrever.
- [ ] Inserção básica de um `stock_item` e um `stock_movement` funciona via Supabase client.
- [ ] Nenhuma migration anterior é alterada.

### Subtarefas

- [ ] Escrever SQL da migration `create_stock_tables.sql`
- [ ] Criar trigger `update_stock_items_atualizado_em`
- [ ] Definir e aplicar policies RLS
- [ ] Documentar colunas no README do módulo (`docs/estoque-schema.md`)

### Dependências

Nenhuma (é a issue base de todas as demais).

---

## Issue 2 — UI de Estoque: listagem, criação/edição e ações rápidas (+/−)

**Labels sugeridas:** `feat`, `frontend`, `react`

### Objetivo

Criar a tela principal do módulo de estoque (`/estoque`) com lista de itens, formulário de criação/edição e botões de ação rápida.

### Rota

`/estoque` — protegida (requer grupo ativo, igual às demais rotas do app).

### Componentes a criar

| Componente | Descrição |
|---|---|
| `StockPage` | Página principal (`src/pages/StockPage.tsx`) |
| `StockItemList` | Lista de cards de itens (`src/components/Stock/StockItemList.tsx`) |
| `StockItemCard` | Card individual com nome, quantidade, status e botões +/− (`src/components/Stock/StockItemCard.tsx`) |
| `StockItemForm` | Formulário de criação/edição com todos os campos configuráveis (`src/components/Stock/StockItemForm.tsx`) |
| `StockItemModal` | Modal que encapsula `StockItemForm` |

### Regras de negócio na UI

- Status visual:
  - `quantidade > quantidade_minima` → badge verde "OK"
  - `quantidade <= quantidade_minima && quantidade > 0` → badge amarelo "Perto do mínimo"
  - `quantidade === 0` → badge vermelho "Sem estoque"
  - `quantidade_minima` não configurada → sem badge de status
- Botão `−`:
  - Decrementa `tamanho_porcao` se configurado; caso contrário abre modal pedindo quantidade.
  - Nunca permite `quantidade < 0` (travar em 0 com toast de aviso).
- Botão `+`:
  - Incrementa `tamanho_porcao` se configurado; caso contrário abre modal pedindo quantidade.
- Após qualquer alteração de quantidade: chamar lógica de auto-add (Issue 3).
- Utilizar componentes daisyUI existentes no projeto (`btn`, `card`, `badge`, `modal`, `input`, etc.).

### Funções de dados a criar (`src/lib/webData.ts`)

```typescript
loadStockItems(groupId: string): Promise<StockItemRecord[]>
createStockItem(input: CreateStockItemInput): Promise<StockItemRecord>
updateStockItem(id: string, input: UpdateStockItemInput): Promise<void>
deleteStockItem(id: string): Promise<void>
adjustStockQuantity(id: string, delta: number, tipo: MovementType, observacao?: string): Promise<void>
```

### Critérios de aceitação

- [ ] Rota `/estoque` renderiza sem erros para usuário autenticado com grupo.
- [ ] Consigo criar, editar e remover um item de estoque.
- [ ] Botões +/− funcionam e refletem nova quantidade imediatamente.
- [ ] Status visual muda conforme quantidade e mínimo.
- [ ] Toda alteração de quantidade gera uma `stock_movement` no Supabase.

### Subtarefas

- [ ] Criar rota `/estoque` em `App.tsx`
- [ ] Criar `StockPage`, `StockItemList`, `StockItemCard`, `StockItemForm`, `StockItemModal`
- [ ] Implementar funções de dados em `webData.ts`
- [ ] Adicionar link de navegação na `Navbar`
- [ ] Escrever testes unitários de lógica pura em `src/domain/stockRules.ts`

### Dependências

- Issue 1 (tabelas no Supabase)

---

## Issue 3 — Auto-adicionar item à lista de compras ao atingir o mínimo (anti-duplicação por ID)

**Labels sugeridas:** `feat`, `frontend`, `backend`, `business-logic`

### Objetivo

Quando a quantidade de um item de estoque cair para `<= quantidade_minima`, adicioná-lo automaticamente à lista de compras ativa do grupo, sem criar duplicatas.

### Regras de negócio

1. Verificar `auto_add_lista === true` no `stock_item`.
2. Verificar `quantidade <= quantidade_minima` após a movimentação.
3. Buscar a lista de compras ativa do grupo (`shopping_lists` WHERE `group_id = X AND ativa = true`).
4. Verificar se já existe um item na lista com o mesmo `stock_items.item_lista_id`:
   - Se `item_lista_id` estiver preenchido: buscar `items` WHERE `id = item_lista_id AND list_id = lista_ativa.id`.
   - Se `item_lista_id` for null: buscar `items` WHERE `nome = stock_item.nome AND list_id = lista_ativa.id` (fallback por nome normalizado).
5. Se não existir: inserir novo item na lista (`addListItem`) e, se `item_lista_id` era null, atualizar `stock_items.item_lista_id` com o novo `items.id`.
6. Se já existir: não fazer nada (sem duplicata).
7. Registrar movimentação ou log informando que o item foi adicionado à lista.

### Função a criar

```typescript
// src/lib/stockAutoAdd.ts
checkAndAutoAddToList(stockItemId: string, groupId: string): Promise<void>
```

Esta função deve ser chamada após qualquer `adjustStockQuantity`.

### Quantidade sugerida na lista de compras

- Se `quantidade_ideal` estiver definida: sugerir `Math.max(0, quantidade_ideal - quantidade_atual)` como quantidade na lista.
- Se não: deixar `quantidade = '1 ' + unidade`.

### Critérios de aceitação

- [ ] Reduzir quantidade de um item para `<= minimo` com `auto_add_lista=true` adiciona o item à lista ativa.
- [ ] Reduzir novamente não cria duplicata (nem por ID nem por nome).
- [ ] Com `auto_add_lista=false`, nenhuma adição automática ocorre.
- [ ] Funciona tanto por decremento manual quanto por consumo automático (Issue 6).
- [ ] Vínculo `item_lista_id` é salvo no `stock_item` na primeira adição automática.

### Subtarefas

- [ ] Criar `src/lib/stockAutoAdd.ts` com `checkAndAutoAddToList`
- [ ] Chamar `checkAndAutoAddToList` ao final de `adjustStockQuantity`
- [ ] Chamar `checkAndAutoAddToList` após execução do consumo automático
- [ ] Escrever testes unitários para `checkAndAutoAddToList`

### Dependências

- Issue 1 (tabelas)
- Issue 2 (função `adjustStockQuantity`)

---

## Issue 4 — Porções: decremento e incremento fixo por clique (ex.: −200 g)

**Labels sugeridas:** `feat`, `frontend`, `business-logic`

### Objetivo

Cada item de estoque pode ter um `tamanho_porcao` configurado. Ao clicar em `−` ou `+`, a quantidade muda exatamente por esse valor.

### Campos relevantes

- `stock_items.tamanho_porcao` (numeric, opcional)
- `stock_items.unidade` (define a unidade do passo)

### Comportamento do botão `−`

1. Se `tamanho_porcao` está definido:
   - Calcular `nova_quantidade = quantidade - tamanho_porcao`
   - Se `nova_quantidade < 0`: setar `nova_quantidade = 0` e exibir toast "Estoque zerado".
   - Chamar `adjustStockQuantity(id, -tamanho_porcao, 'out')`.
2. Se `tamanho_porcao` não está definido:
   - Abrir modal pedindo quantidade a remover.
   - Validar que o valor é > 0 e <= quantidade atual.

### Comportamento do botão `+`

Simétrico ao `−`, usando `tipo = 'in'`.

### Regras de segurança

- `quantidade` nunca pode ser negativa no banco (constraint `CHECK (quantidade >= 0)` na migration).
- A UI deve prevenir antes de enviar ao backend.

### Exibição

- No card do item, mostrar `tamanho_porcao` como dica: `"Porção: 200 g"`.
- Botões `−` e `+` devem estar sempre visíveis e acessíveis (tamanho adequado para mobile).

### Critérios de aceitação

- [ ] Item com porção 200 g: clicar `−` reduz exatamente 200 g.
- [ ] Item com porção 200 g e quantidade 100 g: clicar `−` zera e exibe aviso.
- [ ] Item sem porção configurada: clicar `−` abre modal de quantidade.
- [ ] Movimentação `out` com `quantidade = tamanho_porcao` é registrada em `stock_movements`.

### Subtarefas

- [ ] Adicionar campo `tamanho_porcao` no formulário de criação/edição (Issue 2)
- [ ] Implementar lógica de decremento/incremento por porção em `adjustStockQuantity`
- [ ] Criar modal de quantidade para itens sem porção
- [ ] Escrever testes unitários para a lógica de porção

### Dependências

- Issue 2 (UI e função `adjustStockQuantity`)

---

## Issue 5 — Tela de monitoramento: modo "tela sempre ativa" (Wake Lock)

**Labels sugeridas:** `feat`, `frontend`, `react`, `ux`

### Objetivo

Criar um modo de monitoramento na tela de estoque onde a tela do dispositivo permanece ligada para acompanhamento em tempo real.

### Comportamento

- Toggle visível na `StockPage`: **"Manter tela ativa"**.
- Quando ativado:
  - Solicitar `WakeLockSentinel` via **Wake Lock API** (`navigator.wakeLock.request('screen')`).
  - Exibir indicador visual de que o modo está ativo (ex.: badge "Tela ativa").
  - Reativar automaticamente se o documento voltar ao foco (`visibilitychange`).
- Quando desativado ou ao sair da tela:
  - Chamar `wakeLock.release()`.
  - Remover listener de `visibilitychange`.
- Atualização em tempo real dos dados:
  - Usar Supabase Realtime (`supabase.channel`) para escutar INSERT/UPDATE em `stock_items` do grupo atual.
  - Atualizar a lista local sem recarregar a página.

### Compatibilidade

| Plataforma | Suporte Wake Lock |
|---|---|
| Chrome/Edge (desktop e Android) | Nativo |
| Safari (iOS 16.4+) | Nativo |
| Firefox | Não suportado |

- Se API não disponível: exibir aviso discreto "Wake Lock não suportado neste navegador" e desabilitar o toggle.
- Não usar `setInterval` como fallback — a ausência de Wake Lock não é um erro crítico.

### Hook a criar

```typescript
// src/hooks/useWakeLock.ts
const useWakeLock = (): {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
} => { ... }
```

### Critérios de aceitação

- [ ] Toggle "Manter tela ativa" aparece na `StockPage`.
- [ ] Ativar o toggle em navegador compatível mantém a tela ligada.
- [ ] Ao navegar para outra rota, o Wake Lock é liberado automaticamente.
- [ ] Em navegador sem suporte, o toggle fica desabilitado com mensagem explicativa.
- [ ] Alterações no estoque feitas em outra aba/dispositivo aparecem em tempo real.

### Subtarefas

- [ ] Criar `src/hooks/useWakeLock.ts`
- [ ] Integrar hook na `StockPage` com toggle daisyUI
- [ ] Configurar Supabase Realtime para `stock_items` na `StockPage`
- [ ] Escrever testes para o hook (mock de `navigator.wakeLock`)

### Dependências

- Issue 2 (tela de estoque)

---

## Issue 6 — Consumo automático diário proporcional (config + execução + movimentações)

**Labels sugeridas:** `feat`, `backend`, `frontend`, `business-logic`

### Objetivo

Permitir configurar consumo recorrente por item e reduzir a quantidade automaticamente de forma proporcional ao passar dos dias.

### Configuração por item (campos já na Issue 1)

| Campo | Tipo | Exemplo |
|---|---|---|
| `consumo_automatico` | boolean | `true` |
| `consumo_quantidade` | numeric | `5` (5 kg) |
| `consumo_periodo` | text | `weekly` |
| `consumo_dias_custom` | integer | `10` (para `custom`) |
| `ultimo_consumo_em` | timestamptz | `2024-01-15T00:00:00Z` |

### Cálculo do consumo diário

```
consumo_diario = consumo_quantidade / N

Onde N:
  daily   → 1
  weekly  → 7
  monthly → 30
  custom  → consumo_dias_custom
```

### Lógica de execução

```
dias_passados = floor((agora - ultimo_consumo_em) / 86400000)
Se dias_passados >= 1:
  reducao = consumo_diario * dias_passados
  nova_quantidade = max(0, quantidade - reducao)
  Registrar stock_movement(tipo='auto_out', quantidade=reducao)
  Atualizar stock_items.ultimo_consumo_em = agora
  Chamar checkAndAutoAddToList (Issue 3)
```

### Quando executar

- **Ao carregar a `StockPage`** (client-side, simples e sem servidor extra).
- Usar função `runAutoConsumption(groupId: string)` que itera sobre todos os itens com `consumo_automatico = true` do grupo.
- Guardar `ultimo_consumo_em` por item (não global) para precisão.

### Função a criar

```typescript
// src/lib/stockAutoConsumption.ts
runAutoConsumption(groupId: string): Promise<void>
```

### Proteções

- Se `ultimo_consumo_em` for null: usar `criado_em` como base.
- Se `consumo_quantidade` ou `consumo_periodo` for null com `consumo_automatico = true`: logar aviso e ignorar o item.
- Não executar mais de uma vez por sessão de carregamento (usar flag em memória ou `sessionStorage`).
- Arredondamento: 2 casas decimais (`Math.round(value * 100) / 100`) para evitar drift.

### Formulário de configuração (UI)

Adicionar seção "Consumo automático" no `StockItemForm`:
- Toggle liga/desliga
- Campo `consumo_quantidade` (numérico)
- Select `consumo_periodo` (`Diário`, `Semanal`, `Mensal`, `Personalizado`)
- Campo `consumo_dias_custom` (aparece apenas quando `Personalizado` selecionado)

### Critérios de aceitação

- [ ] Configurar "5 kg por mês" e simular 15 dias passados reduz ~2.5 kg.
- [ ] Não executa duas vezes no mesmo dia (mesmo reabrindo a página).
- [ ] Movimentação `auto_out` é registrada com data e quantidade.
- [ ] Ao zerar (ou atingir mínimo), auto-add na lista é disparado.
- [ ] Item sem `consumo_quantidade` configurado é ignorado sem travar a execução.

### Subtarefas

- [ ] Criar `src/lib/stockAutoConsumption.ts` com `runAutoConsumption`
- [ ] Chamar `runAutoConsumption` no `useEffect` de carregamento da `StockPage`
- [ ] Adicionar seção de configuração no `StockItemForm`
- [ ] Escrever testes unitários para cálculo de consumo diário e execução

### Dependências

- Issue 1 (tabelas)
- Issue 2 (UI e `adjustStockQuantity`)
- Issue 3 (`checkAndAutoAddToList`)

---

## Issue 7 — Histórico de movimentações do estoque (UI)

**Labels sugeridas:** `feat`, `frontend`, `react`

### Objetivo

Exibir ao usuário o histórico completo de entradas, saídas e ajustes de cada item para auditoria e rastreabilidade.

### Acesso

- Botão "Ver histórico" no `StockItemCard` → abre `StockMovementsModal`.

### Componente a criar

`StockMovementsModal` (`src/components/Stock/StockMovementsModal.tsx`):
- Lista de movimentações ordenada da mais recente para a mais antiga.
- Para cada movimentação:
  - Data/hora formatada (`Intl.DateTimeFormat` com locale `pt-BR`)
  - Tipo (ícone + label): `in` → Entrada, `out` → Saída, `adjust` → Ajuste, `auto_out` → Saída Automática
  - Quantidade (com sinal: `+200 g` / `−200 g`)
  - Quantidade antes → depois (`5 kg → 4,8 kg`)
  - Observação (se existir)
- Filtro por tipo (opcional, mas desejável).
- Paginação ou scroll infinito (limite inicial: 50 registros).

### Função de dados a criar

```typescript
loadStockMovements(stockItemId: string, limit?: number): Promise<StockMovementRecord[]>
```

### Critérios de aceitação

- [ ] Modal exibe movimentações reais do banco para o item selecionado.
- [ ] Tipo `auto_out` é claramente distinguível de `out` manual.
- [ ] Data/hora no fuso horário do usuário.
- [ ] Modal fecha sem erros e sem memory leaks.

### Subtarefas

- [ ] Criar `StockMovementsModal`
- [ ] Implementar `loadStockMovements` em `webData.ts`
- [ ] Adicionar botão "Histórico" no `StockItemCard`
- [ ] Escrever testes de renderização do modal

### Dependências

- Issue 1 (tabela `stock_movements`)
- Issue 2 (tela de estoque)

---

## Issue 8 — Migração de compatibilidade e testes de integração

**Labels sugeridas:** `chore`, `test`, `database`, `supabase`

### Objetivo

Garantir que o app funciona corretamente com e sem dados de estoque, que as migrations são seguras e que a lógica de negócio tem cobertura de testes.

### Compatibilidade de schema

- Todas as novas colunas em `stock_items` devem ter DEFAULT ou aceitar NULL.
- Nenhuma coluna existente em `items`, `shopping_lists`, `groups` etc. é alterada.
- Se o usuário não tiver dados de estoque, o app não deve travar (arrays vazios, não null).

### Testes unitários (`src/domain/stockRules.ts` + `stockRules.test.ts`)

Cobrir obrigatoriamente:

| Função | Casos de teste |
|---|---|
| `calcularConsumoDiario` | `weekly`, `monthly`, `custom`, divisão por zero |
| `calcularReducao` | 0 dias, 1 dia, 15 dias, quantidade que ficaria negativa |
| `deveAutoAdd` | `auto_add=false`, `quantidade > minimo`, `quantidade = minimo`, `quantidade < minimo` |
| `detectarDuplicata` | item na lista com mesmo ID, mesmo nome, nenhum match |
| `normalizarQuantidade` | arredondamento 2 casas, zero, negativo |

### Testes E2E (opcional, se `playwright` já configurado)

- Fluxo: criar item de estoque → decrementar com porção → verificar adição à lista.
- Fluxo: configurar consumo semanal → simular passagem de dias → verificar movimentação `auto_out`.

### Critérios de aceitação

- [ ] App abre normalmente sem dados de estoque (zero erros no console).
- [ ] Migrations aplicam sem erros em banco limpo e em banco com dados existentes.
- [ ] Todos os testes unitários de `stockRules.test.ts` passam.
- [ ] `npm run lint` passa sem erros nas novas classes/componentes.
- [ ] `npm run build` finaliza sem erros de TypeScript.

### Subtarefas

- [ ] Criar `src/domain/stockRules.ts` com funções puras de negócio
- [ ] Criar `src/domain/stockRules.test.ts` com todos os casos
- [ ] Revisar migration para garantir idempotência e compatibilidade
- [ ] Executar `npm run test` e `npm run build` e corrigir falhas

### Dependências

- Issues 1–7 (melhor rodar após todas as implementações)

---

## Ordem de implementação sugerida

```
Issue 1 (DB) → Issue 2 (UI base) → Issue 4 (Porções)
                                  → Issue 3 (Auto-add)
                                              ↓
                                         Issue 6 (Consumo automático)
                Issue 5 (Wake Lock) → pode rodar em paralelo com 3/4
                Issue 7 (Histórico) → pode rodar em paralelo com 5/6
Issue 8 (Testes) → roda ao final
```

---

## Labels sugeridas para o repositório

| Label | Cor | Uso |
|---|---|---|
| `feat` | `#0075ca` | Nova funcionalidade |
| `frontend` | `#e4e669` | Alterações na UI/React |
| `backend` | `#d93f0b` | Banco de dados / Supabase |
| `database` | `#c2e0c6` | Migrations / schema |
| `business-logic` | `#bfd4f2` | Regras de negócio puras |
| `ux` | `#f9d0c4` | Experiência do usuário |
| `test` | `#0e8a16` | Testes unitários / E2E |
| `chore` | `#e4e669` | Infraestrutura / configuração |

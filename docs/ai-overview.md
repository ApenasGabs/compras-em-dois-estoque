# Resumo da Aplicacao para IA

## O que este app faz

Compras em Dois e um app web (Vite + React + TypeScript) para listas de compras colaborativas e gerenciamento de estoque em tempo real.

Objetivos principais:

- Sincronizar lista de compras entre membros do grupo.
- Controlar estoque por item com minimo, consumo automatico e historico.
- Facilitar entrada de dados via importacao textual de cupons/notas.

## Fluxo funcional (visao simples)

1. Usuario cria conta ou faz login.
2. Usuario cria grupo (com codigo de convite) ou entra em grupo existente.
3. Grupo possui lista ativa para planejamento de compras.
4. Membros adicionam itens, marcam comprados, ajustam preco e finalizam lista.
5. Itens podem ser gerenciados no modulo de estoque (`/stock`) com entradas/saidas e alertas de minimo.
6. Compras podem ser importadas por texto para Lista e Estoque (origens: Auto, Tenda, Pague Menos).
7. Estoque exibe validade de pereciveis com base em `data_compra` e `data_validade`.

## Como os dados sao organizados

Entidades principais no Supabase:

- `groups`: grupos de compras (`codigo_convite`).
- `group_members`: relacao entre usuarios e grupos.
- `shopping_lists`: listas por grupo (ativa/finalizada).
- `items`: itens da lista (nome, quantidade, categoria, comprado, preco).
- `stock_items`: itens de estoque (quantidade, minimo, consumo, validade).
- `stock_movements`: historico de movimentos de estoque.
- `profiles`: dados de usuario.

## Arquitetura em alto nivel

- Frontend SPA em React + TypeScript.
- Backend gerenciado pelo Supabase (Auth + Postgres + Realtime + RPC opcional).
- Estado global com Zustand.
- Persistencia local para contexto de grupo e preferencias (ex.: wake lock).

## Stack tecnica

- UI/runtime:
  - React
  - TypeScript
  - Vite
  - Tailwind + daisyUI
- Dados:
  - `@supabase/supabase-js`
  - Supabase Auth
  - Supabase Postgres
  - Supabase Realtime (`postgres_changes`)
- Estado local:
  - Zustand (com `persist`)
- Testes:
  - Vitest
  - Playwright

## Onde estao as partes principais no codigo

- Cliente Supabase:
  - `src/lib/supabase.ts`
- Camada de dados:
  - `src/lib/webData.ts`
- Paginas:
  - `src/pages/ListPage.tsx`
  - `src/pages/StockPage.tsx`
  - `src/pages/HistoryPage.tsx`
  - `src/pages/ProfilePage.tsx`
- Stores:
  - `src/stores/authStore.ts`
  - `src/stores/groupStore.ts`
  - `src/stores/stockStore.ts`
- Parsers de importacao:
  - `src/domain/stockImportParser.ts`
  - `src/domain/shoppingImportParser.ts`

## Comportamentos importantes para outra IA entender

- Nao existe backend HTTP proprio: app fala direto com Supabase.
- Existe RPC `create_group` com fallback para inserts diretos quando necessario.
- Lista e estoque usam Realtime para refletir mudancas rapidamente entre clientes.
- `recordStockMovement` valida quantidade > 0 e dispara auto-adicao na lista quando atinge minimo.
- `runAutoConsumption` aplica consumo acumulado por frequencia (daily/weekly/monthly).
- Importacao textual usa parser por origem (auto/tenda/pague-menos).

## Configuracao essencial

Variaveis de ambiente obrigatorias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Sem elas, autenticacao e sincronizacao nao funcionam.

## TL;DR para agentes

App web de compras e estoque colaborativo com Supabase, foco em sincronizacao em tempo real, importacao de cupons por texto e controle de estoque com consumo automatico e validade de pereciveis.

## Compras em Dois

Aplicacao web (PWA-ready) para gerenciar listas de compras compartilhadas em tempo real, com autenticacao e sincronizacao via Supabase.

### Funcionalidades

- **Autenticacao com Supabase**: cadastro, login e logout.
- **Grupos de compra**: criacao de grupo com codigo de convite e entrada por codigo.
- **Lista ativa**: adicao de itens, marcacao de comprado, atualizacao de preco e exclusao.
- **Historico**: listas finalizadas com total e itens.
- **Tempo real**: sincronizacao de mudancas de itens via Realtime.
- **Estoque**: modulo completo com cadastro de itens, ajuste de quantidade, status de minimo, historico de movimentacoes e consumo automatico.
- **Importacao por texto**: importacao de compras para Estoque e Lista com selecao de origem (Auto, Tenda, Pague Menos).
- **Validade de pereciveis**: suporte a data de compra e data de validade no estoque, com badge visual de vencimento.

### Stack

- **Vite + React + TypeScript**
- **Supabase** (`@supabase/supabase-js`)
- **React Router** para navegacao
- **Zustand** para estado global

### Pre-requisitos

- Node.js LTS
- Projeto Supabase com schema e policies configurados

### Configuracao do ambiente

A aplicacao web usa `import.meta.env`, entao as variaveis precisam existir com prefixo `VITE_`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Exemplo de arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

O cliente web le essas variaveis em `src/lib/supabase.ts`.

### Instalacao

```bash
npm install
```

### Execucao

- **Desenvolvimento**:

```bash
npm run dev
```

- **Testes**:

```bash
npm run test
```

- **Build de producao**:

```bash
npm run build
```

### Estrutura basica

- `src/pages` - paginas de autenticacao, grupo, lista, historico e perfil.
- `src/pages/StockPage.tsx` - tela principal do modulo de estoque.
- `src/lib/supabase.ts` - cliente Supabase.
- `src/lib/webData.ts` - camada de operacoes de dados.
- `src/stores` - stores de sessao, auth e grupo.
- `src/domain/stockImportParser.ts` - parser de importacao textual para estoque.
- `src/domain/shoppingImportParser.ts` - parser de importacao textual para lista com preco.

### Notas de Supabase

Documentacao detalhada:

- `docs/endpoints.md`
- `docs/stock-supabase-schema.sql`
- `docs/supabase-schema-reconciliation.md` (erros comuns encontrados, SQL de auditoria e SQL idempotente de correcao)
- `docs/ai-overview.md`
- `docs/feasibility-selfhost-pwa.md`
- `docs/web-migration-checklist.md`

### PWA baseline

Arquivos principais:

- `public/manifest.webmanifest`
- `public/sw.js`
- registro do service worker em `src/main.tsx`

Schema principal esperado:

- `groups` - grupos de compra (inclui `codigo_convite`).
- `group_members` - relacao entre usuarios e grupos.
- `shopping_lists` - listas de compras (campos `ativa`, `finalizada_em`, etc.).
- `items` - itens de cada lista (campos `nome`, `quantidade`, `categoria`, `comprado`, `criado_por`, `list_id`).
- `stock_items` - itens de estoque (inclui `consumo_*`, `data_compra`, `data_validade`).
- `stock_movements` - historico de entradas, saidas, ajustes e consumo automatico.

Verifique se as policies RLS da sua instancia Supabase permitem:

- Usuario autenticado criar/ler/atualizar/deletar apenas dados do seu grupo.
- Eventos de `postgres_changes` na tabela `items` para atualizacao em tempo real.

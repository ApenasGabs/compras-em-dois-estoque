## Compras em Dois

Aplicacao **web (PWA-ready)** para gerenciar listas de compras compartilhadas em tempo real, com autenticacao e sincronizacao via **Supabase**.

### Funcionalidades

- **Autenticacao com Supabase**: cadastro, login e logout.
- **Grupos de compra**: criacao de grupo com codigo de convite e entrada por codigo.
- **Lista ativa**: adicao de itens, marcacao de comprado, atualizacao de preco e exclusao.
- **Historico**: listas finalizadas com total e itens.
- **Tempo real**: sincronizacao de mudancas de itens via Realtime.

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

Exemplo de arquivo `web/.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

O cliente web le essas variaveis em `web/src/lib/supabase.ts`.

### Instalacao

```bash
cd web
npm install
```

### Execucao

- **Desenvolvimento**:

```bash
cd web
npm run dev
```

- **Testes**:

```bash
cd web
npm run test
```

- **Build de producao**:

```bash
cd web
npm run build
```

### Estrutura basica

- `web/src/pages` - paginas de autenticacao, grupo, lista, historico e perfil.
- `web/src/lib/supabase.ts` - cliente Supabase.
- `web/src/lib/webData.ts` - camada de operacoes de dados.
- `web/src/store` - stores de sessao e grupo.

### Notas de Supabase

Documentacao detalhada:

- `docs/endpoints.md`
- `docs/supabase-schema-reconciliation.md` (erros comuns encontrados, SQL de auditoria e SQL idempotente de correcao)
- `docs/ai-overview.md`
- `docs/feasibility-selfhost-pwa.md`
- `docs/web-migration-checklist.md`

### PWA baseline

Arquivos principais:

- `web/public/manifest.webmanifest`
- `web/public/sw.js`
- registro do service worker em `web/src/main.tsx`

Schema principal esperado:

- `groups` - grupos de compra (inclui `codigo_convite`).
- `group_members` - relacao entre usuarios e grupos.
- `shopping_lists` - listas de compras (campos `ativa`, `finalizada_em`, etc.).
- `items` - itens de cada lista (campos `nome`, `quantidade`, `categoria`, `comprado`, `criado_por`, `list_id`).

Verifique se as policies RLS da sua instancia Supabase permitem:

- Usuario autenticado criar/ler/atualizar/deletar apenas dados do seu grupo.
- Eventos de `postgres_changes` na tabela `items` para atualizacao em tempo real.

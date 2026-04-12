# Documentacao de Endpoints

## Visao geral

Este projeto nao expoe backend HTTP proprio.
Toda comunicacao de dados e feita pelo cliente Supabase da aplicacao web em `web/src/lib/supabase.ts`.

Os "endpoints" usados pelo app sao:

- Auth do Supabase
- Operacoes em tabelas (`from(...).select/insert/update/delete`)
- RPC Postgres opcional (`rpc("create_group")`, com fallback no codigo)
- Realtime (`channel().on("postgres_changes", ...)`)

## Base de conexao

- URL base: `VITE_SUPABASE_URL`
- Chave anonima: `VITE_SUPABASE_ANON_KEY`
- Cliente: `web/src/lib/supabase.ts`

## 1) Auth

### Login

- Operacao: `supabase.auth.signInWithPassword({ email, password })`
- Onde e usado: camada de autenticacao web

### Cadastro

- Operacao: `supabase.auth.signUp({ email, password, options: { data: { nome } } })`
- Onde e usado: camada de autenticacao web

### Logout

- Operacao: `supabase.auth.signOut()`

### Sessao e usuario atual

- `supabase.auth.getSession()`
- `supabase.auth.getUser()`

## 2) RPC

### Criacao de grupo (opcional)

- Operacao: `supabase.rpc("create_group", { group_name, invite_code })`
- Onde e usado: `web/src/lib/webData.ts` (`createGroupForCurrentUser`)
- Observacao: se a RPC nao existir, o codigo usa fallback com insert em `groups` + `group_members`.

## 3) Operacoes por tabela

### `groups`

- Listar grupos do usuario:
  - `select("id, nome, codigo_convite, group_members!inner(user_id)").eq("group_members.user_id", userId)`
- Buscar por codigo:
  - `.eq("codigo_convite", normalizedCode).maybeSingle()`
- Buscar grupo criado:
  - `.eq("id", groupId).maybeSingle()`

### `group_members`

- Verificar se usuario ja participa:
  - `.eq("group_id", group.id).eq("user_id", userId).maybeSingle()`
- Adicionar membro:
  - `.insert({ group_id, user_id })`
- Remover membro:
  - `.delete().eq("group_id", groupId).eq("user_id", userId)`

### `profiles`

- Resolver nomes dos membros:
  - `.select("id, nome").in("id", userIds)`

### `shopping_lists`

- Buscar lista ativa:
  - `.select("id, ativa, finalizada_em, total, group_id").eq("group_id", groupId).eq("ativa", true).maybeSingle()`
- Criar lista ativa:
  - `.insert({ group_id, ativa: true }).select(...).single()`
- Finalizar lista:
  - `.update({ ativa: false, finalizada_em, total }).eq("id", listId)`
- Buscar historico:
  - `.select("id, ativa, finalizada_em, total, group_id, items(*)").eq("group_id", groupId).eq("ativa", false)`

### `items`

- Listar itens da lista:
  - `.select("id, nome, quantidade, categoria, comprado, preco, criado_por, list_id").eq("list_id", listId)`
- Inserir item:
  - `.insert({ list_id, nome, quantidade, categoria, comprado, criado_por })`
- Marcar comprado:
  - `.update({ comprado }).eq("id", itemId)`
- Atualizar preco:
  - `.update({ preco }).eq("id", itemId)`
- Remover item:
  - `.delete().eq("id", itemId)`

## 4) Realtime

- Canal de lista:
  - `supabase.channel("list-channel")`
- Evento de mudancas:
  - `postgres_changes` na tabela `items`

## Notas importantes

- O codigo web nao depende da coluna `shopping_lists.titulo`.
- Em pontos onde 0 linhas sao validas, usamos `.maybeSingle()` para evitar `PGRST116`.
- Para troubleshooting de schema/policies, consulte `docs/supabase-schema-reconciliation.md`.

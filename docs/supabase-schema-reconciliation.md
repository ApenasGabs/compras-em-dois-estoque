# Supabase Schema Reconciliation

Este documento registra os problemas encontrados durante a migracao para web e os comandos usados para auditar/corrigir o schema.

## Problemas encontrados

- RPC `create_group` ausente no cache do PostgREST.
- Policy de `group_members` com recursao infinita.
- Erro `PGRST116` ao usar `.single()` em consultas que podiam retornar 0 linhas.
- Coluna inexistente `shopping_lists.titulo` em bancos antigos.

## Ajustes aplicados no codigo

- Fallback para criacao de grupo sem depender obrigatoriamente de `rpc("create_group")`.
- Troca de `.single()` por `.maybeSingle()` em pontos onde ausencia de registro e valida.
- Remocao da dependencia de `shopping_lists.titulo` na versao web.

## Auditoria do schema atual

Use a query abaixo para verificar rapidamente colunas essenciais por tabela:

```sql
with expected(table_name, column_name) as (
  values
    ('profiles','id'),
    ('profiles','nome'),

    ('groups','id'),
    ('groups','nome'),
    ('groups','codigo_convite'),

    ('group_members','id'),
    ('group_members','group_id'),
    ('group_members','user_id'),

    ('shopping_lists','id'),
    ('shopping_lists','group_id'),
    ('shopping_lists','ativa'),
    ('shopping_lists','finalizada_em'),
    ('shopping_lists','total'),

    ('items','id'),
    ('items','list_id'),
    ('items','nome'),
    ('items','quantidade'),
    ('items','categoria'),
    ('items','comprado'),
    ('items','preco'),
    ('items','criado_por'),
    ('items','criado_em'),

    ('rate_limits','id'),
    ('rate_limits','user_id'),
    ('rate_limits','action'),
    ('rate_limits','created_at')
)
select
  e.table_name,
  e.column_name,
  case when c.column_name is null then 'MISSING' else 'OK' end as status
from expected e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.table_name
 and c.column_name = e.column_name
order by e.table_name, e.column_name;
```

## SQL idempotente de correcao

Execute no SQL Editor do Supabase para criar/ajustar estrutura faltante sem quebrar bancos ja corrigidos:

```sql
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo_convite text unique not null
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unique (group_id, user_id)
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  ativa boolean not null default true,
  finalizada_em timestamptz,
  total numeric
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  nome text not null,
  quantidade text,
  categoria text,
  comprado boolean not null default false,
  preco numeric,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists nome text;

alter table public.groups add column if not exists nome text;
alter table public.groups add column if not exists codigo_convite text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_codigo_convite_key'
      and conrelid = 'public.groups'::regclass
  ) then
    alter table public.groups add constraint groups_codigo_convite_key unique (codigo_convite);
  end if;
end $$;

alter table public.group_members add column if not exists group_id uuid;
alter table public.group_members add column if not exists user_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_members_group_id_fkey'
      and conrelid = 'public.group_members'::regclass
  ) then
    alter table public.group_members
      add constraint group_members_group_id_fkey
      foreign key (group_id) references public.groups(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_members_user_id_fkey'
      and conrelid = 'public.group_members'::regclass
  ) then
    alter table public.group_members
      add constraint group_members_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_members_group_id_user_id_key'
      and conrelid = 'public.group_members'::regclass
  ) then
    alter table public.group_members
      add constraint group_members_group_id_user_id_key
      unique (group_id, user_id);
  end if;
end $$;

alter table public.shopping_lists add column if not exists group_id uuid;
alter table public.shopping_lists add column if not exists ativa boolean;
alter table public.shopping_lists add column if not exists finalizada_em timestamptz;
alter table public.shopping_lists add column if not exists total numeric;

alter table public.shopping_lists alter column ativa set default true;
update public.shopping_lists set ativa = true where ativa is null;
alter table public.shopping_lists alter column ativa set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shopping_lists_group_id_fkey'
      and conrelid = 'public.shopping_lists'::regclass
  ) then
    alter table public.shopping_lists
      add constraint shopping_lists_group_id_fkey
      foreign key (group_id) references public.groups(id) on delete cascade;
  end if;
end $$;

alter table public.items add column if not exists list_id uuid;
alter table public.items add column if not exists nome text;
alter table public.items add column if not exists quantidade text;
alter table public.items add column if not exists categoria text;
alter table public.items add column if not exists comprado boolean;
alter table public.items add column if not exists preco numeric;
alter table public.items add column if not exists criado_por uuid;
alter table public.items add column if not exists criado_em timestamptz;

alter table public.items alter column comprado set default false;
update public.items set comprado = false where comprado is null;
alter table public.items alter column comprado set not null;

alter table public.items alter column criado_em set default now();
update public.items set criado_em = now() where criado_em is null;
alter table public.items alter column criado_em set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'items_list_id_fkey'
      and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_list_id_fkey
      foreign key (list_id) references public.shopping_lists(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'items_criado_por_fkey'
      and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_criado_por_fkey
      foreign key (criado_por) references auth.users(id);
  end if;
end $$;

alter table public.rate_limits add column if not exists user_id uuid;
alter table public.rate_limits add column if not exists action text;
alter table public.rate_limits add column if not exists created_at timestamptz;

alter table public.rate_limits alter column created_at set default now();
update public.rate_limits set created_at = now() where created_at is null;
alter table public.rate_limits alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rate_limits_user_id_fkey'
      and conrelid = 'public.rate_limits'::regclass
  ) then
    alter table public.rate_limits
      add constraint rate_limits_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;
```

## Politicas RLS

Se houver recursao em `group_members`, revise policies que consultam a propria `group_members` sem condicao de escape. Prefira regras simples e nao-recursivas por operacao (`select`, `insert`, `delete`).

## Checklist rapido depois da correcao

1. Login e cadastro funcionam.
2. Criacao de grupo funciona com ou sem RPC `create_group`.
3. Entrada por codigo de convite funciona.
4. Lista ativa e criada automaticamente quando necessario.
5. Historico abre sem depender de colunas removidas.

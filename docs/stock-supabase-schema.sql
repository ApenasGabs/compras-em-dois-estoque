-- Schema base para o modulo de estoque (issue #11)

create extension if not exists pgcrypto;

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  nome text not null,
  categoria text not null default 'Outros',
  unidade text not null default 'un',
  quantidade numeric not null default 0,
  quantidade_minima numeric not null default 0,
  tamanho_porcao numeric not null default 1,
  na_lista boolean not null default false,
  auto_adicionar_lista boolean not null default false,
  consumo_frequencia text not null default 'weekly' check (consumo_frequencia in ('daily', 'weekly', 'monthly')),
  consumo_valor numeric not null default 0,
  data_compra date,
  data_validade date,
  ultimo_consumo_auto_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint stock_items_quantidade_non_negative check (quantidade >= 0),
  constraint stock_items_quantidade_minima_non_negative check (quantidade_minima >= 0),
  constraint stock_items_tamanho_porcao_positive check (tamanho_porcao > 0),
  constraint stock_items_consumo_valor_non_negative check (consumo_valor >= 0)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.stock_items(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste', 'consumo_auto')),
  quantidade numeric not null,
  observacao text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint stock_movements_quantidade_positive check (quantidade > 0)
);

create index if not exists idx_stock_items_group_id on public.stock_items(group_id);
create index if not exists idx_stock_items_nome on public.stock_items(nome);
create index if not exists idx_stock_items_data_validade on public.stock_items(data_validade);
create index if not exists idx_stock_movements_item_id on public.stock_movements(item_id);
create index if not exists idx_stock_movements_criado_em on public.stock_movements(criado_em desc);

create or replace function public.set_atualizado_em_stock_items()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_set_atualizado_em_stock_items on public.stock_items;
create trigger trg_set_atualizado_em_stock_items
before update on public.stock_items
for each row
execute function public.set_atualizado_em_stock_items();

alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "stock_items_select_by_group_member" on public.stock_items;
create policy "stock_items_select_by_group_member"
on public.stock_items
for select
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = stock_items.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "stock_items_insert_by_group_member" on public.stock_items;
create policy "stock_items_insert_by_group_member"
on public.stock_items
for insert
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = stock_items.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "stock_items_update_by_group_member" on public.stock_items;
create policy "stock_items_update_by_group_member"
on public.stock_items
for update
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = stock_items.group_id
      and gm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = stock_items.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "stock_items_delete_by_group_member" on public.stock_items;
create policy "stock_items_delete_by_group_member"
on public.stock_items
for delete
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = stock_items.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "stock_movements_select_by_group_member" on public.stock_movements;
create policy "stock_movements_select_by_group_member"
on public.stock_movements
for select
using (
  exists (
    select 1
    from public.stock_items si
    join public.group_members gm on gm.group_id = si.group_id
    where si.id = stock_movements.item_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "stock_movements_insert_by_group_member" on public.stock_movements;
create policy "stock_movements_insert_by_group_member"
on public.stock_movements
for insert
with check (
  exists (
    select 1
    from public.stock_items si
    join public.group_members gm on gm.group_id = si.group_id
    where si.id = stock_movements.item_id
      and gm.user_id = auth.uid()
  )
);

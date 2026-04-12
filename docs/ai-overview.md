# Resumo da Aplicacao para IA

## O que este app faz

`Compras em Dois` e um app mobile (Expo/React Native) para listas de compras compartilhadas em tempo real.

Objetivo principal:

- Permitir que pessoas de um mesmo grupo criem e mantenham uma lista de compras colaborativa.
- Sincronizar mudancas ao vivo entre participantes.
- Guardar historico de compras finalizadas.

## Fluxo funcional (visao simples)

1. Usuario cria conta ou faz login.
2. Usuario cria um grupo (gera codigo) ou entra em grupo existente por codigo.
3. O grupo tem uma lista ativa da semana.
4. Membros adicionam itens, marcam como comprados, editam preco e removem itens.
5. Ao finalizar compra, a lista ativa e arquivada no historico e uma nova lista ativa e criada.
6. No perfil, usuario troca de grupo, copia codigo de convite, ve membros e pode sair do grupo.

## Como os dados sao organizados

Entidades principais no Supabase:

- `groups`: grupos de compras, com `codigo_convite`.
- `group_members`: relacao entre usuarios e grupos.
- `shopping_lists`: listas por grupo (`ativa` ou finalizada).
- `items`: itens de uma lista (nome, quantidade, categoria, comprado, preco).
- `profiles`: dados basicos de usuario (ex.: nome).
- `rate_limits`: registro de acoes para controle de abuso.

## Arquitetura em alto nivel

- Frontend unico em React Native com Expo Router.
- Backend gerenciado pelo Supabase (Auth + Postgres + Realtime + RPC).
- Estado global local com Zustand.
- Sessao e estado de grupo persistidos para restaurar contexto do usuario.

## Stack tecnica

- Runtime/UI:
  - React 19
  - React Native 0.81
  - Expo 54
  - Expo Router
- Dados e autenticacao:
  - `@supabase/supabase-js`
  - Supabase Auth (login, cadastro, sessao)
  - Supabase Postgres (CRUD e RPC)
  - Supabase Realtime (`postgres_changes`)
- Estado local:
  - Zustand
  - Persist middleware + AsyncStorage
- Armazenamento seguro de sessao:
  - `expo-secure-store` (mobile)
  - `localStorage` (web)
- UX/utilitarios:
  - `react-native-gesture-handler` (swipe para remover item)
  - `expo-clipboard` (copiar codigo de convite)
  - Toast para feedback visual

## Onde estao as partes principais no codigo

- Roteamento e bootstrap de sessao:
  - `app/_layout.tsx`
- Autenticacao:
  - `app/(auth)/login.tsx`
  - `app/(auth)/register.tsx`
- Fluxo de grupos:
  - `app/(app)/group.tsx`
  - `app/(app)/profile.tsx`
- Lista em tempo real e finalizacao de compra:
  - `app/(app)/list.tsx`
  - `components/addItemModal.tsx`
- Historico:
  - `app/(app)/history.tsx`
- Cliente Supabase:
  - `lib/supabase.ts`
- Estado global:
  - `stores/useAuthStore.ts`
  - `stores/useGroupStore.ts`

## Comportamentos importantes para outra IA entender

- Nao existe API REST propria do projeto; o app conversa direto com Supabase.
- Existe RPC `create_group` no banco que faz parte do fluxo de criacao de grupo.
- A lista e atualizada em tempo real por assinatura de mudancas no Postgres.
- O app suporta multiplos grupos por usuario e troca de contexto de grupo.
- A lista ativa e unica por grupo no fluxo esperado do app.

## Configuracao essencial

Variaveis de ambiente esperadas:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Sem essas variaveis, o app nao autentica nem sincroniza dados.

## Resumo curto (TL;DR para agentes)

App de lista de compras colaborativa em tempo real, feito em Expo/React Native, com Supabase como backend completo (Auth + Postgres + Realtime + RPC) e Zustand para estado local/persistencia de contexto de usuario e grupo.

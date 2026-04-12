---
name: "Tarefa de banco de dados / migração"
about: "Alteração de schema, migration ou policy no Supabase"
title: "chore(db): "
labels: database, backend
assignees: ''
---

## Objetivo

<!-- O que precisa ser alterado no banco de dados? -->

## Tabelas / colunas afetadas

<!-- Liste as tabelas e colunas criadas, alteradas ou removidas -->

| Tabela | Operação | Detalhes |
|---|---|---|
| | | |

## SQL da migration

```sql
-- Arquivo: supabase/migrations/<timestamp>_<nome>.sql
```

## Policies RLS

<!-- Descreva as policies de segurança necessárias -->

## Compatibilidade

<!-- A migration é retrocompatível? Possui DEFAULT para novas colunas? -->

- [ ] Migration idempotente (`IF NOT EXISTS`)
- [ ] Não altera tabelas existentes de forma destrutiva
- [ ] Novos campos possuem DEFAULT ou aceitam NULL
- [ ] RLS habilitado nas novas tabelas

## Critérios de aceitação

- [ ] `supabase db push` executa sem erros
- [ ] RLS testado manualmente
- [ ] Documentação do schema atualizada

## Dependências

Nenhuma / Issue #X

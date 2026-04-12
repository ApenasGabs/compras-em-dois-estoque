# Checklist de Migracao Web (Vite + PWA + TDD)

## Status geral

- [x] 1. Definir abordagem: migracao para Vite padrao em pasta separada `web/`
- [x] 2. Criar app web base com Vite + React + TypeScript
- [x] 3. Configurar roteamento web (auth, grupos, lista, historico, perfil)
- [x] 4. Configurar cliente Supabase para web
- [x] 5. Portar estado global essencial (auth e grupo)
- [x] 6. Configurar testes unitarios com Vitest + Testing Library
- [x] 7. Escrever primeiros testes (TDD) para regras criticas
- [x] 8. Implementar PWA baseline (manifest + service worker)
- [x] 9. Validar build web e executar testes
- [x] 10. Documentar como rodar web/testes/PWA

## Regras de execucao

- Cada etapa so e marcada como concluida apos validacao local.
- Sempre criar/atualizar testes antes ou junto das funcionalidades portadas.

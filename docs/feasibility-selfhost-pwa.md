# Estudo de Viabilidade: Self-Hosted + Acesso Remoto + PWA

## Contexto atual

O app hoje:

- e um cliente Expo/React Native
- usa Supabase gerenciado para Auth, Postgres, Realtime e RPC
- depende de operacoes SQL e da funcao RPC `create_group`
- usa assinatura realtime em `items` e `shopping_lists`

Conclusao inicial: a camada de backend nao e custom REST; e fortemente acoplada ao ecossistema Supabase. Isso favorece migracao para **Supabase self-hosted** e torna inviavel uma troca rapida para backend totalmente diferente sem retrabalho alto.

---

## Parte 1: Viabilidade de rodar "tudo local" e ainda acessar remotamente

## 1.1 O que significa "tudo local"

Ha 2 interpretacoes praticas:

1. Rodar tudo em uma maquina local (on-prem/home server), com acesso externo via tunel/VPN.
2. Rodar em um servidor proprio na nuvem (VPS), sem usar Supabase Cloud.

Ambas sao viaveis. A opcao 2 e mais estavel para producao.

## 1.2 Opcoes de arquitetura

### Opcao A: Self-host em maquina local + tunel

- Infra:
  - Docker Compose do Supabase self-hosted
  - Nginx/Caddy como reverse proxy
  - Tunel remoto (Cloudflare Tunnel, Tailscale Funnel, ou similar)
- Pro:
  - custo baixo inicial
  - controle total local
- Contra:
  - dependencia de energia/internet residencial
  - maior risco de indisponibilidade
  - operacao e seguranca mais sensiveis
- Viabilidade: **tecnicamente alta**, operacional **media/baixa** para producao publica.

### Opcao B: Self-host em VPS (recomendado)

- Infra:
  - Docker Compose do Supabase self-hosted
  - Postgres com volume persistente
  - reverse proxy + TLS (Let's Encrypt)
  - backup automatico
- Pro:
  - disponibilidade melhor
  - acesso remoto nativo por dominio publico
  - operacao previsivel
- Contra:
  - custo mensal de VPS
  - exige rotina de observabilidade e update
- Viabilidade: **alta** (melhor equilibrio para app publicado).

### Opcao C: Hibrido (dev local, prod self-host VPS)

- Local para desenvolvimento e testes
- VPS para ambiente remoto oficial
- Viabilidade: **muito alta** e e o caminho mais seguro.

## 1.3 O que precisa ser migrado do Supabase Cloud

Checklist minimo:

- schema SQL completo (tabelas + indices + constraints)
- politicas RLS
- funcoes RPC (ex.: `create_group`)
- triggers/funcoes auxiliares (se existirem, ex.: rate limit)
- configuracoes de Auth (providers, templates de email, redirect URLs)
- armazenamento de segredos e variaveis

Risco principal: perder detalhes de RLS e funcoes SQL na migracao.
Mitigacao: versionar migrations SQL e testar cenarios de permissao por perfil de usuario.

## 1.4 Requisitos de operacao para ficar publico

- dominio publico (ex.: `api.seudominio.com`)
- TLS valido (HTTPS obrigatorio)
- rotinas de backup e restore testado
- monitoramento (uptime, logs, CPU, RAM, disco)
- politicas de firewall e atualizacao de imagens
- plano de rollback

Sem esses itens, "self-host" tende a falhar em disponibilidade e seguranca.

## 1.5 Esforco estimado (self-host)

- Prova de conceito local: 1 a 2 dias
- Ambiente remoto minimamente confiavel: 3 a 7 dias
- Hardening para producao (backup, monit, alerta, runbook): +3 a 7 dias

Total realista para producao robusta: **1 a 3 semanas**, dependendo de experiencia DevOps.

## 1.6 Decisao de viabilidade (self-host)

- Viavel? **Sim, altamente viavel tecnicamente**.
- Recomendacao: **Supabase self-hosted em VPS** + ambiente local separado para dev.
- Nao recomendado para publico amplo: host residencial sem camada de resiliencia.

---

## Parte 2: Viabilidade de traduzir app para React Web como PWA

## 2.1 Estado atual da base

A base ja usa:

- Expo Router
- `react-native-web`
- script `expo start --web`
- fallback de storage no web (`localStorage`) para sessao Supabase

Conclusao inicial: ja existe base para web, entao a evolucao para PWA e viavel.

## 2.2 O que "PWA" exige alem do web atual

Para ser PWA de fato, precisa:

- manifesto web completo (nome, icones, start_url, display)
- service worker
- estrategia de cache (assets + possivel cache de dados)
- pagina offline/fallback
- HTTPS em producao

Observacao: rodar "web" no Expo em dev nao significa que o app ja seja PWA completo.

## 2.3 Viabilidade tecnica por area

### UI/Compatibilidade

- Componentes atuais sao majoritariamente compativeis com `react-native-web`.
- Ponto de atencao: `Swipeable` no web pode ter UX inferior dependendo de browser/input.
- Viabilidade: **alta**, com ajustes pontuais.

### Auth e sessao

- Ja existe suporte web em `lib/supabase.ts` via `localStorage`.
- Necessario revisar cookies/redirect e dominios de auth no ambiente publico.
- Viabilidade: **alta**.

### Realtime

- Supabase Realtime funciona no web via websocket.
- Requer validar proxy/firewall para conexoes websocket no self-host.
- Viabilidade: **alta**.

### Offline

- Offline total e limitado porque app depende de backend em tempo real.
- Possivel oferecer "offline parcial" (shell + ultimos dados cacheados).
- Viabilidade: **media**, depende de escopo de sincronizacao offline.

## 2.4 Esforco estimado (PWA)

- Web funcional (sem PWA completo): ja existe base, 1 a 3 dias de ajustes
- PWA baseline (manifest + service worker + instalavel): 3 a 7 dias
- PWA com estrategia offline util: +1 a 2 semanas

## 2.5 Riscos principais (PWA)

- divergencia de UX mobile vs desktop
- comportamentos de gestos/touch no browser
- cache mal configurado causar dados desatualizados
- expectativa de "funciona offline sempre" sem arquitetura offline-first

## 2.6 Decisao de viabilidade (PWA)

- Viavel? **Sim**.
- Nivel de esforco:
  - PWA instalavel basico: **medio**
  - PWA com offline robusto: **medio/alto**
- Recomendacao: comecar por PWA baseline, sem prometer offline transacional no inicio.

---

## Plano recomendado (pratico)

## Fase 1 - Infra self-host segura

1. Subir Supabase self-hosted em VPS com Docker Compose.
2. Configurar dominio + HTTPS + proxy.
3. Migrar schema/RLS/RPC e validar fluxos criticos.
4. Configurar backup + monitoramento basico.

## Fase 2 - App apontando para novo backend

1. Trocar `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. Rodar suite de testes manuais de auth, grupo, lista, historico, realtime.
3. Publicar ambiente staging antes de producao.

## Fase 3 - Web/PWA

1. Consolidar build web de producao.
2. Adicionar manifesto + service worker + estrategia de cache inicial.
3. Definir limites de offline e comunicar claramente para usuarios.

---

## Matriz de viabilidade (resumo executivo)

- Self-host local + remoto: **Viavel (alto)**
- Self-host com qualidade de producao: **Viavel (medio/alto em operacao)**
- Migracao para React Web PWA: **Viavel (alto)**
- Offline completo sincronizado: **Viavel parcial (medio)**

## Recomendacao final

- Sim, e viavel sair do Supabase Cloud para self-host sem reescrever o app.
- Melhor caminho: self-host em VPS + ambiente local para dev/staging.
- Sim, e viavel evoluir para PWA; comece por instalavel e cache de shell, deixando offline avancado para fase posterior.

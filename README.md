## Compras em Dois

Aplicativo móvel em React Native (Expo) para gerenciar **listas de compras compartilhadas em tempo real** entre duas (ou mais) pessoas, usando autenticação e sincronização via **Supabase**.

### Funcionalidades

- **Autenticação com Supabase**: cadastro, login e logout seguros.
- **Grupos de compra**:
  - Criação de grupo com código de convite.
  - Entrada em grupo existente via código (`group.tsx`).
  - Código de convite copiável no perfil.
- **Lista ao vivo da semana**:
  - Adição rápida de itens ou via modal detalhado com categoria e quantidade.
  - Marcação de itens como comprados / não comprados em tempo real.
  - Sugestões de itens frequentes.
  - Finalização da compra que arquiva a lista atual e cria uma nova lista ativa.
- **Histórico de compras**:
  - Visualização das listas finalizadas do grupo, com data e itens.
- **Perfil**:
  - Exibição do nome do usuário.
  - Dados do grupo atual (nome e código).

### Stack

- **Expo 54** + **React Native 0.81**
- **React 19** + **expo-router**
- **Supabase** (`@supabase/supabase-js`) com sessão persistida em `expo-secure-store`
- **Zustand** para gerenciamento de estado global (auth e grupo)
- **NativeWind/Tailwind CSS** para estilização

### Pré-requisitos

- Node.js LTS instalado
- Expo CLI (opcional, mas recomendado): `npm install -g expo`
- Projeto Supabase configurado com as tabelas esperadas (`groups`, `group_members`, `shopping_lists`, `items`, etc.)

### Configuração do ambiente

As credenciais do Supabase são lidas das variáveis de ambiente Expo:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Crie um arquivo `app.config.js` ou use `app.json` com `expo` e configure essas variáveis seguindo a documentação do Expo (por exemplo via `app.config.js` ou `.env` + `expo-env`).

Exemplo simples usando `app.config.js`:

```js
export default {
  expo: {
    name: "compras-em-dois",
    slug: "compras-em-dois",
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

Consulte a documentação atual do Expo para a forma exata de passar variáveis de ambiente na versão que você está usando.

### Instalação

```bash
npm install
```

### Execução

- **Iniciar em modo desenvolvimento**:

```bash
npm run start
```

Depois, escolha rodar em:

- App Expo Go (Android ou iOS) lendo o QR Code.
- Emulador Android.
- Simulador iOS (em macOS).

Scripts úteis (definidos em `package.json`):

- `npm run android` – inicia o app diretamente em um dispositivo/emulador Android.
- `npm run ios` – inicia o app em um simulador iOS.
- `npm run web` – abre a versão web (limitada) no navegador.

### Estrutura básica de pastas

- `app/`
  - `app/_layout.tsx` – roteamento raiz, controle de sessão e redirecionamentos.
  - `app/(auth)/login.tsx` e `register.tsx` – telas de autenticação.
  - `app/(app)/_layout.tsx` – abas principais (`list`, `history`, `profile`).
  - `app/(app)/list.tsx` – lista de compras ao vivo.
  - `app/(app)/history.tsx` – histórico de listas finalizadas.
  - `app/(app)/profile.tsx` – dados do usuário e do grupo.
  - `app/(app)/group.tsx` – criação/entrada em grupos.
- `components/addItemModal.tsx` – modal para adicionar item com mais detalhes.
- `lib/supabase.ts` – inicialização do cliente Supabase.
- `stores/useAuthStore.ts` – estado global de autenticação.
- `stores/useGroupStore.ts` – estado global de grupo e lista ativa.

### Notas sobre backend (Supabase)

O app assume um schema aproximado com:

- `groups` – grupos de compra (inclui `codigo_convite`).
- `group_members` – relação entre usuários e grupos.
- `shopping_lists` – listas de compras (campos `ativa`, `finalizada_em`, etc.).
- `items` – itens de cada lista (campos `nome`, `quantidade`, `categoria`, `comprado`, `criado_por`, `list_id`).

Verifique se as políticas de RLS e permissões da sua instância Supabase permitem:

- Usuário autenticado criar/ler/atualizar/deletar apenas dados do seu grupo.
- Eventos de `postgres_changes` na tabela `items` para a atualização em tempo real.

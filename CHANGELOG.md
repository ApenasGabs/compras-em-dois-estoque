# 📝 Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.4.0](https://github.com/ApenasGabs/compras-em-dois-estoque/compare/v0.3.0...v0.4.0) (2026-04-14)

### ✨ Features

* :sparkles: add CI workflows for tests, linting, and building the application ([d51c84d](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/d51c84d17c24deca2764d8b831a2236b3f1ed944))
* :sparkles: implement theme management with meta theme color support ([0365b63](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/0365b6382936895a0ed76ec2e6effa6b8aacae33))

### 🐛 Bug Fixes

* address review feedback on theme.ts and release workflow ([15f7fdf](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/15f7fdf34079385032f38958b68f2e89b86ca98d))

## [0.3.0](https://github.com/ApenasGabs/compras-em-dois-estoque/compare/v0.2.1...v0.3.0) (2026-04-14)

### ✨ Features

* :wrench: add password confirmation field and validation to registration form ([ecb598c](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/ecb598cd129fca7093b62de12b7e45833227ffa5))

## [0.2.1](https://github.com/ApenasGabs/compras-em-dois-estoque/compare/v0.2.0...v0.2.1) (2026-04-13)

### 🐛 Bug Fixes

* :bug: fixes the RLS error ([e167aa8](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/e167aa8d1c41bca29c690d336c5ab9611d32662a))

### ♻️ Refactoring

* apply review feedback on history deletion, stock aggregation, and RPC type safety ([ccb4817](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/ccb481777ee12b75f16a04b039c63072d3326935))

## [0.2.0](https://github.com/ApenasGabs/compras-em-dois-estoque/compare/v0.1.1...v0.2.0) (2026-04-12)

### ✨ Features

* :sparkles: added stock management features including import functionality and stock item details page ([f52ddbe](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/f52ddbeb34f164317f94d3b19c4524f9f3371de4)), closes [#11](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/11) [#12](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/12) [#13](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/13) [#14](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/14) [#15](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/15) [#16](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/16) [#17](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/17) [#18](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/18) [#19](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/19) [#20](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/20)

### 🐛 Bug Fixes

* apply review feedback - ajuste type, ILIKE escaping, parallel imports, wakeLock, footer emoji, SQL schema ([d307cc8](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/d307cc83f8995cd153a7a38224119ebb6e4ede6c))
* escape backslashes in ILIKE sanitization to prevent PostgreSQL wildcard injection ([2d0367a](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/2d0367a0a7d27b5d549e8091f5f6ed2acae97b74))

### 🔧 Chores

* :broom: Remove unused pages and stores; delete Login, NotFound, Profile, Register pages, and auth/group/session stores; clean up Supabase configuration and TypeScript settings. ([9ce6bef](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/9ce6bef44175f0aaa3ffe1d925510f4e6f54f3c8))

## [0.1.1](https://github.com/ApenasGabs/compras-em-dois-estoque/compare/v0.1.0...v0.1.1) (2026-04-12)

### 🐛 Bug Fixes

* [#5](https://github.com/ApenasGabs/compras-em-dois-estoque/issues/5)  🐛 prevent data loss after reload by implementing session restoration and improving group context handling ([5fdd4e1](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/5fdd4e1f0a501c44d5949305b482744166d86a8c))
* 🐛 enhance session management by implementing user-specific group state restoration and improving logout handling ([8c7bea7](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/8c7bea7e45a0f26635c41d1bc550f9234758481a))

### 🧪 Tests

* :test_tube: added e2e tests ([69bd586](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/69bd5866f43b6fa8822eddead774822ce95d75b3))

## [0.1.0](https://github.com/ApenasGabs/compras-em-dois-estoque/compare/v0.0.1...v0.1.0) (2026-04-12)

### ✨ Features

* add History, List, Login, NotFound, Profile, and Register pages with state management ([227348a](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/227348af7ab820c48b7fb74efeb9c29bcf12209f))

### 🐛 Bug Fixes

* 🐛 resolve conflito de peer dependencies e corrige acentuação ([dcf02e4](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/dcf02e4cac029685804a99787562ed621792b862))

### ♻️ Refactoring

* remove unused template references and streamline configuration files ([fbd5552](https://github.com/ApenasGabs/compras-em-dois-estoque/commit/fbd55524f96dce34502b103143a0cb964d4835d5))

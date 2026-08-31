# CrossClues — Entrega Final · Feature de Validação de Dicas

> **Responsável:** MasterMind (DevOps Engineer) · **Etapa:** 6 / Entrega Final
> **Pré-requisitos atendidos:** QA (ZicaZica) ✓ · Code Review (Debug) ✓
> **Data:** 31/08/2026

---

## 1. Visão Geral da Entrega

Feature de **validação de dicas** (US-01 / US-02 / US-03) com dupla camada de
segurança (client-side + server-side) e sanitização XSS.

### Bugfixes incluídos

| Ref | Descrição | Onde |
|-----|-----------|------|
| B1 | Regex de sigla agora respeita o case original (`.trim()` + checagem em `clue`, não em `trimmed` em uppercase) | `lib/validation.ts` |
| M3 | Sanitização XSS (`/[\<\>\"\'&]/`) no servidor | `server.js` |
| m1 | `tooLong` adicionado ao tipo `ClueValidationErrorCode` | `lib/validation.ts` |
| m2 | Whitespace padronizado com `/\s/` | `lib/validation.ts` |
| m4 | `aria-invalid` + `aria-describedby` no campo de dica | `GameBoard.tsx` |

---

## 2. O que foi alterado

### Arquivos modificados
- **`server.js`** — novo `validateClue()`, mapa bilingue `CLUE_VALIDATION_ERRORS`,
  helper `getClueError()`, sanitização XSS no handler `submit-clue`, trim no
  persistência.
- **`components/GameBoard.tsx`** — integração de `validateClueLocal`, estado de
  erro `clueValidationError`, UI de erro com `role="alert"`, acessibilidade.

### Arquivos novos
- **`lib/validation.ts`** — validação client-side + mensagens EN/PT.
- **`components/ClueRestrictions.tsx`** — regras de dica (bilingue).
- **`.env.example`** — template de variáveis de ambiente (não contém secrets).

### Correção extra de infra (não faz parte da feature, mas necessária para build)
- **`app/api/import-words/route.ts`** — cliente Supabase agora é inicializado de
  forma **lazy** (`getSupabase()`). Antes, o `createClient()` no topo do módulo
  quebrava o `next build` quando não havia credenciais no ambiente de build.

### Sem alteração de infra externa
- Não há `Dockerfile`, `docker-compose`, `.github/workflows` ou pipeline de
  deploy no repositório — **nenhum foi criado** (evita overengineering).

---

## 3. Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Supabase (URL + Key) — opcional para build; necessário para jogar

```bash
# 1. Clonar / entrar no repositório
cd "C:\PythonsCodes\Local host\CrossLines\CrossClues"

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
# Edite .env com SUPABASE_URL e SUPABASE_KEY reais

# 4. Verificar tipagem e build
npx tsc --noEmit
npx next build

# 5. Rodar o servidor (dev)
npm start
# → http://localhost:3000
```

---

## 4. Como testar a feature de validação de dicas

Ao dar uma dica (sua vez + carta comprada + célula selecionada), valide:

| Cenário | Entrada | Resultado esperado |
|---------|---------|--------------------|
| Dica válida | `cachorro` | Aceita, persiste no grid |
| Vazia | (vazio / `   `) | Erro "Digite uma palavra primeiro" |
| Múltiplas palavras | `casa grande` | Erro "deve ser uma única palavra" |
| Número | `123` | Erro "não pode ser um número" |
| Sigla | `ONG` / `USA` | Erro "não pode ser uma sigla" |
| Composta | `guarda-chuva` | Erro "não pode ser palavra composta" |
| Muito longa | 16+ caracteres | Erro "máximo 15 caracteres" |
| XSS (envio forjado) | `<script>` / `a"b` | Erro "caracteres inválidos" (server) |

### Testes de acessibilidade
- Com erro visível, o input tem `aria-invalid="true"` e o texto de erro tem
  `role="alert"` (lido por leitores de tela).

---

## 5. CI/CD e Deploy

### Estado atual
- **Não há CI/CD configurado** no repositório (sem GitHub Actions / Vercel /
  pipeline). O deploy é **manual** via `npm start` / processo Node gerenciado
  (PM2 / systemd) servindo `next build`.

### Como rodar em produção (manual, mínimo)

```bash
# Build otimizado
npm ci
npx next build

# Rodar o servidor de produção (usa a pasta .next compilada)
NODE_ENV=production PORT=3000 node server.js
```

### Health check sugerido
- HTTP Status do processo: `GET /api/words` → responde JSON `{ wordCacheKeys: [] }`.
- Teste Supabase: `GET /api/supabase/test` → `{ connected: true }`.

---

## 6. Rollback

Como a feature é **toda codificada** (sem migração de banco e sem mudança de
schema), o rollback é simples:

### Rollback da feature de validação
1. `git checkout main` e `git revert <SHA-do-commit-da-feature>` (ou restaure os
   arquivos `server.js`, `components/GameBoard.tsx`, delete `lib/validation.ts`).
2. Re-sincronize dependências: `npm ci`.
3. Rebuild: `npx next build`.
4. Reinicie o servidor: `NODE_ENV=production node server.js`.
5. Valide o health check em `GET /api/words`.

> Não há migration a reverter — o schema de `words` permanece inalterado.

### Rollback da correção do build (import-words)
O `getSupabase()` lazy é retrocompatível — não quebra o comportamento anterior
quando envs estão presentes. Nenhuma ação necessária.

---

## 7. Checklist Final de Entrega

| Item | Status |
|------|--------|
| **Typecheck** (`npx tsc --noEmit`) | ✅ Passou sem erros |
| **Build de produção** (`npx next build`) | ✅ Compilado + SSG ok (0 erros) |
| **Servidor inicia** (`server.js`) | ✅ Sobe em `http://localhost:3000` |
| **Ambiente de variáveis** | ✅ Documentado em `.env.example`; `.env` gitignored |
| **Nenhum secret exposto** | ✅ Nenhum `.env` / chave versionada |
| **Sanitização XSS** | ✅ Implementada e validada (M3) |
| **QA aprovado** | ✅ |
| **Code Review aprovado** | ✅ |
| **Rollback documentado** | ✅ Seção 6 |

---

## 8. Observabilidade mínima

- Logs do Socket.IO já registram conexões, `[VALIDATION]` e `[SECURITY]` events
  no `server.js` → redirecione stdout/stderr para arquivo/PMM com PM2 ou systemd.
- Sugestão futura (não bloqueante): adicionar métricas de dicas rejeitadas por
  tipo (ex.: contador de `maliciousInput` vs `tooLong`) para monitorar abuso.

---

## 9. Declaração de Entrega Final

**A feature de validação de dicas está pronta e entregue.**

Build ✅ · TypeCheck ✅ · Servidor ✅ · Validação client+server ✅ · XSS sanitizado ✅ ·
Acessibilidade ✅ · Documentação de operação ✅ · Rollback ✅

**Próximos passos / monitoramento sugerido:**
1. Executar o `npx next build` no ambiente de deploy com as credenciais reais do
   Supabase e validar `GET /api/supabase/test`.
2. Rodar os testes de regressão da Seção 4 após o deploy.
3. Se for mover para produção multi-ambiente, configurar CI (GitHub Actions) com
   build + testes + badge — recomendo apenas quando houver um host de deploy
   definido.
4. Considerar adicionar a callback de `submit-clue` para capturar métricas de
   rejeição.

---

*Preparado por MasterMind (DevOps Engineer) — CrossClues / Entre Linhas Online.*

# CrossClues (Entre Linhas)

Jogo online multiplayer de deducao de palavras. Um jogador escolhe uma celula do grid e da uma dica que relaciona duas palavras (linha e coluna). Os demais jogadores tentam adivinhar qual celula a dica se refere.

## Funcionalidades

- Multiplayer em tempo real com Socket.IO
- Salas com codigo de 4 digitos
- 3 difficulty levels (Easy / Medium / Hard) -- level 1=easy, 2=medium, 3=hard
- Grid de palavras gerado aleatoriamente
- Pontuacao cooperativa por equipe
- Reconexao com grace period de 30s
- Palavras fallback locais (sem Supabase)
- Admin page para importar palavras
- Integracao com Supabase

## Stack

| Tecnologia | Uso |
|------------|-----|
| Next.js 16 | Framework React (App Router) |
| Express | Servidor HTTP + API |
| Socket.IO | Comunicacao em tempo real |
| Supabase | Banco de dados (PostgreSQL) |
| Tailwind CSS | Estilos |
| TypeScript | Tipagem |

## Estrutura do Projeto

```
├── app/
│   ├── page.tsx              # Pagina principal do jogo
│   ├── layout.tsx            # Layout global
│   ├── globals.css           # Estilos globais
│   ├── admin/
│   │   └── page.tsx          # Admin - importar palavras
│   └── api/
│       └── import-words/
│           └── route.ts      # API para importar palavras
├── components/
│   ├── GameMenu.tsx          # Menu inicial
│   ├── GameConfig.tsx        # Configuracao da sala
│   ├── GameLobby.tsx         # Sala de espera
│   ├── GameBoard.tsx         # Tabuleiro do jogo (com validacao de dicas)
│   ├── ClueRestrictions.tsx  # Regras de restricao de dicas
│   ├── GameOver.tsx          # Tela de fim de jogo
│   ├── ResultModal.tsx       # Modal de resultado
│   ├── RulesPage.tsx         # Pagina de regras
│   └── ScoringTable.tsx      # Tabela de pontuacao
├── lib/
│   ├── socket.ts             # Cliente Socket.IO
│   ├── validation.ts         # Validacao client-side de dicas (EN/PT)
│   └── rules.ts              # Regras do jogo
├── scripts/
│   └── import-words.js       # Script CLI para importar palavras
├── supabase/
│   └── migrations/
│       └── 20250718_create_words_table.sql
├── server.js                 # Servidor Express + Socket.IO
├── public/
│   └── words.json            # Palavras fallback (EN/PT)
├── Dockerfile                # Container de producao
├── .dockerignore
├── .env.example              # Template de variaveis de ambiente
└── .env                      # Variaveis de ambiente (nao versionado)
```

## Pre-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) (opcional — words.json funciona como fallback)

## Instalacao

```bash
# Clonar o repositorio
git clone https://github.com/Tcncunha/CrossLines.git
cd CrossLines

# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do Supabase
```

### Variaveis de Ambiente (.env)

```
SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_KEY=sua-chave-aqui
PORT=3000
ADMIN_SECRET=seu-admin-secret
```

## Deploy com Docker

```bash
# Build da imagem
docker build -t crossclues .

# Rodar o container
docker run -d \
  --name crossclues \
  -p 3000:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_KEY=your-key \
  -e ADMIN_SECRET=your-admin-secret \
  -e NODE_ENV=production \
  crossclues

# Verificar logs
docker logs -f crossclues
```

## Deploy sem Docker

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Editar .env

# Build de producao
npx next build

# Iniciar
NODE_ENV=production node server.js
```

## Configuracao do Supabase

1. Acesse o painel do Supabase
2. Va em **SQL Editor**
3. Execute o conteudo do arquivo `supabase/migrations/20250718_create_words_table.sql`
4. Isso cria a tabela `words` com palavras em ingles

> **Nota:** O jogo funciona sem Supabase usando `public/words.json` como fallback.

## Execucao

```bash
# Iniciar o servidor (desenvolvimento)
npm start

# Ou com NODE_ENV=production
NODE_ENV=production npm start

# Acessar o jogo
# http://localhost:3000

# Acessar o admin
# http://localhost:3000/admin
```

## Build e Verificacao

```bash
# Type check (tipagem)
npx tsc --noEmit

# Build de producao (Next.js)
npx next build
```

## Regras de Jogo

### Regras Oficiais
- **Minimo 2 jogadores** para iniciar
- **Pontuacao cooperativa**: pontuacao da equipe = numero de celulas reveladas
- **1 palpite por dica**: o grupo pode fazer apenas um palpite por dica do dador
- **Dador NAO pode palpitar**: quem deu a dica nao pode adivinhar
- **Avanco de turno**: apos acerto ou erro, sempre avanca para o proximo jogador
- **Fim de jogo**: todas as celulas reveladas OU baralho e descarte vazios

### Validacao de Dicas (US-01 / US-02 / US-03)

As dicas passam por duas camadas de validacao:

### Client-side (`lib/validation.ts`)
`validateClueLocal()` impede envios invalidos antes de irem ao servidor, com mensagens EN/PT:
1. Nao pode ser vazia ou so espacos
2. Deve ser uma unica palavra (sem espacos)
3. Nao pode conter hifen (palavra composta)
4. Nao pode ser apenas numeros
5. Nao pode ser uma sigla de 2-3 letras maiusculas (ex.: "USA")
6. Maximo 15 caracteres

### Server-side (`server.js` -> `validateClue`)
*Validacao de autoridade no servidor* antes de persistir a dica:
- Mesmas regras da validacao client-side (nao confiar so no cliente)
- Controle de turno (`notYourTurn`)
- **Sanitizacao XSS** (`/[\<\>\"\'&]/`) -- rejeita `<`, `>`, `"`, `'`, `&`
- Persistencia da dica sempre com `.trim()`

### Acessibilidade
O campo de dica usa `aria-invalid` e `aria-describedby` apontando para o
elemento de erro com `role="alert"` e `aria-live="assertive"`.

## Reconexao (US-009)

O jogo suporta reconexao automatica:
- O cliente tenta reconectar apos desconexao (reconnection: true)
- O servidor mantem o estado da sala por 30 segundos apos disconnect
- Para reconectar, emita `rejoin-room` com `roomCode` e `playerId` (playerToken)

### Configuracao do Socket.IO (cliente)
```javascript
const socket = io({
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 30,
});
```

### Evento rejoin-room
```javascript
// Request
socket.emit('rejoin-room', { roomCode, playerId, playerName }, (response) => {
  if (response.success) {
    console.log('Reconectado!', response.room);
  }
});
```

## Importar Palavras

### Via Admin Page

Acesse `http://localhost:3000/admin` e clique em "Importar".

### Via CLI

```bash
# Importar 100 palavras (padrao)
node scripts/import-words.js

# Importar quantidade especifica
node scripts/import-words.js 200
```

### Via API

```bash
# Verificar stats
curl http://localhost:3000/api/import-words

# Importar 50 palavras
curl -X POST http://localhost:3000/api/import-words \
  -H "Content-Type: application/json" \
  -d '{"count": 50}'
```

## Schema do Banco

```sql
CREATE TABLE public.words (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    word      VARCHAR(20) NOT NULL,
    language  CHAR(2) NOT NULL CHECK (language IN ('EN','PT','ES','PL','ZH')),
    level     SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (word, language)
);

CREATE INDEX idx_word_lookup ON public.words (language, level, is_active) WHERE is_active = true;

ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow read for anon" ON public.words FOR SELECT TO anon USING (is_active = true);
-- service_role bypasses RLS
```

## Como Jogar

1. **Criar sala** - Um jogador cria a sala e recebe um codigo de 4 digitos
2. **Compartilhar codigo** - Enviar o codigo para outros jogadores entrarem
3. **Iniciar jogo** - O host inicia quando todos entrarem (minimo 2 jogadores)
4. **Dar dicas** - Na sua vez, selecione uma celula do grid e escreva uma dica que relacione as duas palavras
5. **Adivinhar** - Os outros jogadores clicam na celula que acham que corresponde a dica
6. **Pontuacao** - Pontuacao cooperativa: cada acerto revela uma celula e soma ao total da equipe

## Licenca

MIT

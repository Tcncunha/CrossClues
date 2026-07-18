# CrossLines (Entre Linhas)

Jogo online multiplayer de deducao de palavras. Um jogador escolhe uma celula do grid e da uma dica que relaciona duas palavras (linha e coluna). Os demais jogadores tentam adivinhar qual celula a dica se refere.

## Funcionalidades

- Multiplayer em tempo real com Socket.IO
- Salas com codigo de 4 digitos
- 3 niveis de dificuldade (Facil, Medio, Dificil)
- Grid de palavras gerado aleatoriamente
- Sistema de pontuacao
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
│   ├── GameBoard.tsx         # Tabuleiro do jogo
│   ├── GameOver.tsx          # Tela de fim de jogo
│   └── ResultModal.tsx       # Modal de resultado
├── lib/
│   └── socket.ts             # Cliente Socket.IO
├── scripts/
│   └── import-words.js       # Script CLI para importar palavras
├── supabase/
│   └── migrations/
│       └── 20250718_create_words_table.sql
├── server.js                 # Servidor Express + Socket.IO
├── words.json                # Palavras fallback (local)
└── .env                      # Variaveis de ambiente
```

## Pre-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

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
```

## Configuracao do Supabase

1. Acesse o painel do Supabase
2. Va em **SQL Editor**
3. Execute o conteudo do arquivo `supabase/migrations/20250718_create_words_table.sql`
4. Isso cria a tabela `words` com 100 palavras em ingles

## Execucao

```bash
# Iniciar o servidor
npm start

# Acessar o jogo
# http://localhost:3000

# Acessar o admin
# http://localhost:3000/admin
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
CREATE TABLE words (
    id        INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    word      VARCHAR(20) NOT NULL,
    length    TINYINT NOT NULL,
    language  CHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_word_lookup ON words (language, length, is_active);
```

## Como Jogar

1. **Criar sala** - Um jogador cria a sala e recebe um codigo de 4 digitos
2. **Compartilhar codigo** - Enviar o codigo para outros jogadores entrarem
3. **Iniciar jogo** - O host inicia quando todos entrarem (minimo 2 jogadores)
4. **Dar dicas** - Na sua vez, selecione uma celula do grid e escreva uma dica que relacione as duas palavras
5. **Adivinhar** - Os outros jogadores clicam na celula que acham que corresponde a dica
6. **Pontuacao** - Acerto = 1 ponto. Errar = perde a dica e vez

## Licenca

MIT

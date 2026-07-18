-- =============================================
-- Tabela: words
-- Descrição: Armazena palavras para o jogo Entre Linhas
-- =============================================

CREATE TABLE IF NOT EXISTS "CrossLinesGameDB"."words"  (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    word VARCHAR(20) NOT NULL,
     language CHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

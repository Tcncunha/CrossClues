-- =============================================
-- Tabela: words
-- Descrição: Armazena palavras para o jogo Entre Linhas
-- =============================================

CREATE TABLE IF NOT EXISTS "CrossLinesGameDB"."words"  (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    word VARCHAR(20) NOT NULL,
    length INT NOT NULL,
    language CHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para consultas por idioma, tamanho e status
CREATE INDEX idx_word_lookup ON words (language, length, is_active);

-- =============================================
-- Insert de 100 palavras em inglês
-- =============================================

INSERT INTO words (word, length, language, is_active) VALUES
-- 1-20: Animais
('CAT', 3, 'EN', TRUE),
('DOG', 3, 'EN', TRUE),
('BIRD', 4, 'EN', TRUE),
('FISH', 4, 'EN', TRUE),
('BEAR', 4, 'EN', TRUE),
('LION', 4, 'EN', TRUE),
('TIGER', 5, 'EN', TRUE),
('HORSE', 5, 'EN', TRUE),
('WHALE', 5, 'EN', TRUE),
('EAGLE', 5, 'EN', TRUE),
('SNAKE', 5, 'EN', TRUE),
('RABBIT', 6, 'EN', TRUE),
('MONKEY', 6, 'EN', TRUE),
('PANDA', 5, 'EN', TRUE),
('DOLPHIN', 7, 'EN', TRUE),
('ELEPHANT', 8, 'EN', TRUE),
('GIRAFFE', 7, 'EN', TRUE),
('PENGUIN', 7, 'EN', TRUE),
('LEOPARD', 7, 'EN', TRUE),
('BUFFALO', 7, 'EN', TRUE),

-- 21-40: Comidas
('CAKE', 4, 'EN', TRUE),
('BREAD', 5, 'EN', TRUE),
('PIZZA', 5, 'EN', TRUE),
('RICE', 4, 'EN', TRUE),
('APPLE', 5, 'EN', TRUE),
('GRAPE', 5, 'EN', TRUE),
('MELON', 5, 'EN', TRUE),
('LEMON', 5, 'EN', TRUE),
('PEACH', 5, 'EN', TRUE),
('MANGO', 5, 'EN', TRUE),
('BUTTER', 6, 'EN', TRUE),
('CHEESE', 6, 'EN', TRUE),
('CHICKEN', 7, 'EN', TRUE),
('NOODLES', 7, 'EN', TRUE),
('SALAD', 5, 'EN', TRUE),
('SOUP', 4, 'EN', TRUE),
('STEAK', 5, 'EN', TRUE),
('COOKIE', 6, 'EN', TRUE),
('PASTA', 5, 'EN', TRUE),
('BANANA', 6, 'EN', TRUE),

-- 41-60: Profissões
('NURSE', 5, 'EN', TRUE),
('PILOT', 5, 'EN', TRUE),
('TEACHER', 7, 'EN', TRUE),
('DOCTOR', 6, 'EN', TRUE),
('FARMER', 6, 'EN', TRUE),
('DRIVER', 6, 'EN', TRUE),
('BAKER', 5, 'EN', TRUE),
('SINGER', 6, 'EN', TRUE),
('PAINTER', 7, 'EN', TRUE),
('WRITER', 6, 'EN', TRUE),
('DANCER', 6, 'EN', TRUE),
('CHEF', 4, 'EN', TRUE),
('LAWYER', 6, 'EN', TRUE),
('OFFICER', 7, 'EN', TRUE),
('SOLDIER', 7, 'EN', TRUE),
('SCIENTIST', 9, 'EN', TRUE),
('ARTIST', 6, 'EN', TRUE),
('ACTOR', 5, 'EN', TRUE),
('DENTIST', 7, 'EN', TRUE),
('REPORTER', 8, 'EN', TRUE),

-- 61-80: Objetos
('CHAIR', 5, 'EN', TRUE),
('TABLE', 5, 'EN', TRUE),
('LAMP', 4, 'EN', TRUE),
('PHONE', 5, 'EN', TRUE),
('CLOCK', 5, 'EN', TRUE),
('MIRROR', 6, 'EN', TRUE),
('BOTTLE', 6, 'EN', TRUE),
('BRUSH', 5, 'EN', TRUE),
('PLATES', 6, 'EN', TRUE),
('SHELF', 5, 'EN', TRUE),
('KEYS', 4, 'EN', TRUE),
('DOOR', 4, 'EN', TRUE),
('WINDOW', 6, 'EN', TRUE),
('SOFA', 4, 'EN', TRUE),
('PILLOW', 6, 'EN', TRUE),
('BLANKET', 7, 'EN', TRUE),
('BUCKET', 6, 'EN', TRUE),
('HAMMER', 6, 'EN', TRUE),
('SCISSORS', 8, 'EN', TRUE),
('PENCIL', 6, 'EN', TRUE),

-- 81-100: Natureza e Lugares
('RIVER', 5, 'EN', TRUE),
('OCEAN', 5, 'EN', TRUE),
('ISLAND', 6, 'EN', TRUE),
('MOUNTAIN', 8, 'EN', TRUE),
('DESERT', 6, 'EN', TRUE),
('FOREST', 6, 'EN', TRUE),
('CANYON', 6, 'EN', TRUE),
('VALLEY', 6, 'EN', TRUE),
('BRIDGE', 6, 'EN', TRUE),
('CASTLE', 6, 'EN', TRUE),
('MUSEUM', 6, 'EN', TRUE),
('LIBRARY', 7, 'EN', TRUE),
('HOSPITAL', 8, 'EN', TRUE),
('KITCHEN', 7, 'EN', TRUE),
('THEATER', 7, 'EN', TRUE),
('CINEMA', 6, 'EN', TRUE),
('HARBOR', 6, 'EN', TRUE),
('BREEZE', 6, 'EN', TRUE),
('CLOUD', 5, 'EN', TRUE),
('STAR', 4, 'EN', TRUE);

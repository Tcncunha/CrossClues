-- =============================================
-- Migration: public.words - Fix B7/B8/M11
-- Description: Creates public.words correctly with level, unique, RLS
-- =============================================

-- 1. Cleanup legacy table/schema (B7)
DROP TABLE IF EXISTS "CrossLinesGameDB"."words";

-- 2. Create correct table in public schema
CREATE TABLE IF NOT EXISTS public.words (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word varchar(20) NOT NULL,
  language char(2) NOT NULL CHECK (language IN ('EN','PT','ES','PL','ZH')),
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 3),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (word, language)
);

-- 3. Compatibility: rename legacy column "Level" -> level if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='words' AND column_name='Level') THEN
    ALTER TABLE public.words RENAME COLUMN "Level" TO level;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='words' AND column_name='level') THEN
    ALTER TABLE public.words ADD COLUMN level smallint CHECK (level BETWEEN 1 AND 3);
  END IF;
END $$;

-- 3b. Fix type if level exists as TEXT/varchar (BUG-005) - ensures smallint even when table pre-existed via IF NOT EXISTS
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='words' AND column_name='level'
      AND data_type IN ('text', 'character varying')
  ) THEN
    -- Convert TEXT level to smallint; fails if non-numeric data present (clean expected: 1,2,3)
    ALTER TABLE public.words ALTER COLUMN level TYPE smallint USING level::smallint;
  END IF;
  -- Ensure CHECK constraint exists after type fix (if missing)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%level%_check' AND check_clause LIKE '%BETWEEN 1 AND 3%'
  ) THEN
    -- Add check if not already present (ignore if already constrained by column definition)
    BEGIN
      ALTER TABLE public.words ADD CONSTRAINT words_level_check CHECK (level BETWEEN 1 AND 3);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 4. Index for lookup (language, level, is_active) partial where active
CREATE INDEX IF NOT EXISTS idx_word_lookup ON public.words (language, level, is_active) WHERE is_active = true;

-- 5. RLS
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow read for anon" ON public.words;
CREATE POLICY "allow read for anon" ON public.words FOR SELECT TO anon USING (is_active = true);
-- service_role bypasses RLS, so writes only via server with service_role key

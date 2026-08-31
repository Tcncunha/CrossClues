import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }
  return _supabase;
}

const BATCH_SIZE = 50;

interface WordEntry {
  word: string;
  language: string;
  is_active: boolean;
}

async function fetchRandomWords(count: number): Promise<string[]> {
  const words: string[] = [];
  const seen = new Set<string>();

  while (words.length < count) {
    const needed = count - words.length;
    const batchSize = Math.min(BATCH_SIZE, needed);

    const res = await fetch(
      `https://random-word-api.vercel.app/api/v1?wordlength=5&count=${batchSize}`
    );

    if (!res.ok) {
      throw new Error(`Random Word API error: ${res.status}`);
    }

    const data: string[] = await res.json();

    for (const w of data) {
      const upper = w.toUpperCase();
      if (!seen.has(upper) && upper.length <= 20 && /^[A-Z]+$/.test(upper)) {
        seen.add(upper);
        words.push(upper);
      }
    }
  }

  return words;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetCount = Math.min(body.count || 100, 500);

    console.log(`Buscando ${targetCount} palavras aleatorias...`);
    const rawWords = await fetchRandomWords(targetCount);
    console.log(`${rawWords.length} palavras obtidas da API`);

    const entries: WordEntry[] = rawWords.map(word => ({
      word,
      language: 'EN',
      is_active: true,
    }));

    const inserted: WordEntry[] = [];
    const skipped: string[] = [];

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      const { data, error } = await getSupabase()
        .from('words')
        .upsert(batch, { onConflict: 'word,language', ignoreDuplicates: true })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      if (data) inserted.push(...data);
    }

    return NextResponse.json({
      success: true,
      imported: inserted.length,
      total: rawWords.length,
      sample: inserted.slice(0, 5).map(w => w.word),
    });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error, count } = await getSupabase()
      .from('words')
      .select('*', { count: 'exact' })
      .eq('language', 'EN')
      .eq('is_active', true);

    if (error) throw error;

    return NextResponse.json({
      total: count,
      sample: data?.slice(0, 10).map(w => w.word) || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY)!
    );
  }
  return _supabase;
}

const BATCH_SIZE = 50;

interface WordEntry {
  word: string;
  language: string;
  level: number;
  is_active: boolean;
}

// Simple in-memory rate limit for admin import (20 req/min per IP)
const rateMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  if (entry.count > 20) return true;
  return false;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    return true;
  }
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token === secret;
}

function unauthorizedResponse(): NextResponse {
  const secret = process.env.ADMIN_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function getLevelForWord(word: string): number {
  const len = word.length;
  if (len <= 3) return 1;
  if (len <= 5) return 2;
  return 3;
}

async function fetchRandomWords(count: number): Promise<string[]> {
  const words: string[] = [];
  const seen = new Set<string>();

  while (words.length < count) {
    const needed = count - words.length;
    const batchSize = Math.min(BATCH_SIZE, needed);

    try {
      const res = await fetch(`https://random-word-api.vercel.app/api?words=${batchSize}`);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Random Word API ${res.status} ${body.slice(0,120)}`);
      }

      const data: string[] = await res.json();
      for (const w of data) {
        const upper = w.toUpperCase();
        if (!seen.has(upper) && upper.length <= 20 && /^[A-Z]+$/.test(upper)) {
          seen.add(upper);
          words.push(upper);
        }
      }
      continue; // sucesso, proxima iteracao
    } catch (err) {
      console.warn('[import-words] API falhou, usando fallback public/words.json:', (err as Error).message);
      // Fallback: lê public/words.json local
      try {
        const filePath = path.join(process.cwd(), 'public', 'words.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(raw);
        const pool: string[] = [];
        for (const lang of Object.keys(json)) {
          const entry = json[lang];
          if (entry.easy) pool.push(...entry.easy);
          if (entry.medium) pool.push(...entry.medium);
          if (entry.hard) pool.push(...entry.hard);
        }
        // embaralha pool
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        for (const w of pool) {
          if (words.length >= count) break;
          const upper = w.toUpperCase();
          if (!seen.has(upper) && /^[A-Z]+$/.test(upper)) {
            seen.add(upper);
            words.push(upper);
          }
        }
        // se ainda faltar, completa com palavras sintéticas
        let n = 1;
        while (words.length < count) {
          const synth = `WORD${n++}`;
          if (!seen.has(synth)) { seen.add(synth); words.push(synth); }
        }
        break; // fallback resolveu, sai do while
      } catch (fallbackErr) {
        throw new Error(`API falhou (${(err as Error).message}) e fallback public/words.json também falhou: ${(fallbackErr as Error).message}`);
      }
    }
  }

  return words.slice(0, count);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetCount = Math.min(body.count || 100, 500);
    const requestedLevel = body.level && [1, 2, 3].includes(Number(body.level)) ? Number(body.level) : null;
    const requestedLanguage = body.language && ['EN', 'PT', 'ES', 'PL', 'ZH'].includes(body.language) ? body.language : 'EN';

    console.log(`Fetching ${targetCount} random words...`);
    const rawWords = await fetchRandomWords(targetCount);
    console.log(`${rawWords.length} words fetched from API`);

    const entries: WordEntry[] = rawWords.map(word => ({
      word,
      language: requestedLanguage,
      level: requestedLevel ?? getLevelForWord(word),
      is_active: true,
    }));

    const inserted: WordEntry[] = [];

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      const { data, error } = await getSupabase()
        .from('words')
        .upsert(batch, { onConflict: 'word,language', ignoreDuplicates: true })
        .select();

      if (error) {
        console.error('Supabase insert error (public):', error);
        return NextResponse.json(
          { success: false, error: `Supabase public.words: ${error.message} (code ${error.code})` },
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

export async function GET(request: Request) {
  // Protect GET as well if ADMIN_SECRET is configured (read-only stats)
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const { data, error, count } = await getSupabase()
      .from('words')
      .select('*', { count: 'exact' })
      .eq('language', 'EN')
      .eq('is_active', true);

    if (error) throw error;

    const byLevel: Record<number, number> = {};
    data?.forEach((row: any) => {
      const lvl = row.level ?? row.Level;
      if (lvl) byLevel[lvl] = (byLevel[lvl] || 0) + 1;
    });

    return NextResponse.json({
      total: count,
      byLevel,
      sample: data?.slice(0, 10).map((w: any) => w.word) || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

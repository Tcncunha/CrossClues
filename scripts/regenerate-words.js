#!/usr/bin/env node
// Regenerate public/words.json with common words only (frequency-based)
// Requirements: EN 1000 (350/350/300), PT 360 (120/120/120), ES 360, PL 360, ZH/AR fallback EN common

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const WORD_JSON_PATH = path.join(__dirname, '..', 'public', 'words.json');

// Frequency list URLs (hermitdave 2018 50k) - top frequent first
const FREQUENCY_URLS = {
  EN: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
  PT: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt/pt_50k.txt',
  ES: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt',
  PL: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pl/pl_50k.txt',
};

// Also fallback google 10k EN if needed (not used unless fetch fails)
const GOOGLE_EN_URL = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt';

function isValidWord(word) {
  // Spec: /^[a-z]{3,15}$/ && /[aeiou]/ && !/[bcdfghjklmnpqrstvwxyz]{4,}/
  return /^[a-z]{3,15}$/.test(word) && /[aeiou]/.test(word) && !/[bcdfghjklmnpqrstvwxyz]{4,}/.test(word);
}

function normalize(word) {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function fetchFrequencyList(url) {
  console.log(`[FETCH] ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  const text = await res.text();
  return text;
}

function parseFrequencyText(text) {
  const lines = text.split('\n');
  const result = [];
  const seen = new Set();
  for (const line of lines) {
    if (!line.trim()) continue;
    // Format: "word count" or "word\tcount" ; also google list is just word per line
    const tokenRaw = line.split(/\s+/)[0];
    if (!tokenRaw) continue;
    const norm = normalize(tokenRaw);
    if (!norm) continue;
    if (!isValidWord(norm)) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    result.push(norm);
  }
  return result;
}

async function loadLanguageList(lang) {
  let text;
  try {
    text = await fetchFrequencyList(FREQUENCY_URLS[lang]);
  } catch (e) {
    console.error(`[WARN] Failed to fetch ${lang}:`, e.message);
    if (lang === 'EN') {
      console.log('[INFO] Trying google 10k fallback for EN');
      text = await fetchFrequencyList(GOOGLE_EN_URL);
    } else {
      throw e;
    }
  }
  const parsed = parseFrequencyText(text);
  console.log(`[INFO] ${lang} parsed ${parsed.length} valid unique words`);
  return parsed;
}

function bucketByLength(words, min, max, count) {
  const filtered = words.filter(w => w.length >= min && w.length <= max);
  return filtered.slice(0, count);
}

function ensureContains(list, requiredWords, sourcePool) {
  // Ensure each requiredWord is in list; if missing, replace last elements or prepend
  for (const req of requiredWords) {
    if (!list.includes(req)) {
      // Try to find req in sourcePool (should be there), but if not, just add anyway if valid
      if (isValidWord(req)) {
        // Insert at beginning for visibility, remove last to keep count
        if (list.length > 0) list.pop();
        list.unshift(req);
        // Deduplicate again and keep order: ensure unique
        // If req already inserted, handle
      }
    }
  }
  // Ensure uniqueness
  const seen = new Set();
  const deduped = [];
  for (const w of list) {
    if (!seen.has(w)) { seen.add(w); deduped.push(w); }
  }
  // If deduplication reduced length, fill from sourcePool
  let idx = 0;
  while (deduped.length < list.length && idx < sourcePool.length) {
    const candidate = sourcePool[idx++];
    if (!seen.has(candidate) && !deduped.includes(candidate)) {
      seen.add(candidate);
      deduped.push(candidate);
    }
  }
  return deduped.slice(0, list.length);
}

async function main() {
  console.log('=== Regenerate words.json with common frequency words ===');

  const enList = await loadLanguageList('EN');
  const ptList = await loadLanguageList('PT');
  const esList = await loadLanguageList('ES');
  const plList = await loadLanguageList('PL');

  // EN generation: 350 easy (3-4 chars), 350 medium (5-6), 300 hard (7-15)
  const enEasy = bucketByLength(enList, 3, 4, 350);
  const enMedium = bucketByLength(enList, 5, 6, 350);
  const enHard = bucketByLength(enList, 7, 15, 300);

  // Ensure required common words appear
  // house (5) -> medium, garden (6) -> medium, sustainable (11) -> hard
  // Also add other expected common words to satisfy "house, garden, sustainable do original"
  const enRequiredEasy = []; // no specific easy requirement but keep "tree", "house"? house is medium
  const enRequiredMedium = ['house', 'garden', 'window', 'family', 'water', 'people'];
  const enRequiredHard = ['sustainable', 'beautiful', 'important', 'different', 'language', 'universe', 'magnificent'];

  const enEasyFinal = ensureContains(enEasy, enRequiredEasy, enList.filter(w=>w.length>=3 && w.length<=4));
  const enMediumFinal = ensureContains(enMedium, enRequiredMedium, enList.filter(w=>w.length>=5 && w.length<=6));
  const enHardFinal = ensureContains(enHard, enRequiredHard, enList.filter(w=>w.length>=7 && w.length<=15));

  console.log(`[EN] easy ${enEasyFinal.length} medium ${enMediumFinal.length} hard ${enHardFinal.length}`);
  console.log('[EN] easy sample', enEasyFinal.slice(0,10));
  console.log('[EN] medium sample', enMediumFinal.slice(0,10));
  console.log('[EN] hard sample', enHardFinal.slice(0,10));
  console.log('[EN] contains house?', enMediumFinal.includes('house'), 'garden?', enMediumFinal.includes('garden'), 'sustainable?', enHardFinal.includes('sustainable'));
  console.log('[EN] contains bude?', enEasyFinal.includes('bude') || enMediumFinal.includes('bude') || enHardFinal.includes('bude'));
  console.log('[EN] contains buqshas?', enHardFinal.includes('buqshas'));

  // PT generation: 120 per level - avoid duplicate casa across levels
  const ptEasy = bucketByLength(ptList, 3, 4, 120);
  const ptMedium = bucketByLength(ptList, 5, 6, 120);
  const ptHard = bucketByLength(ptList, 7, 15, 120);
  const ptRequiredMedium = ['jardim', 'familia', 'cidade', 'amigo', 'tempo']; // jardim 6 chars -> medium
  const ptRequiredEasy = ['casa', 'agua', 'vida', 'amor', 'sol'];
  const ptRequiredHard = ['sustentavel', 'importante', 'diferente', 'universo', 'linguagem'];
  const ptEasyFinal = ensureContains(ptEasy, ptRequiredEasy, ptList.filter(w=>w.length>=3 && w.length<=4));
  const ptMediumFinal = ensureContains(ptMedium, ptRequiredMedium, ptList.filter(w=>w.length>=5 && w.length<=6));
  const ptHardFinal = ensureContains(ptHard, ptRequiredHard, ptList.filter(w=>w.length>=7 && w.length<=15));
  console.log(`[PT] easy ${ptEasyFinal.length} medium ${ptMediumFinal.length} hard ${ptHardFinal.length}`);
  console.log('[PT] sample easy', ptEasyFinal.slice(0,10));
  console.log('[PT] sample medium', ptMediumFinal.slice(0,10));
  console.log('[PT] sample hard', ptHardFinal.slice(0,10));

  // ES generation
  const esListValidated = esList; // already parsed
  const esEasy = bucketByLength(esListValidated, 3, 4, 120);
  const esMedium = bucketByLength(esListValidated, 5, 6, 120);
  const esHard = bucketByLength(esListValidated, 7, 15, 120);
  const esRequiredEasy = ['casa', 'agua', 'vida', 'amor', 'sol'];
  const esRequiredMedium = ['jardin', 'ciudad', 'familia', 'amigo', 'tiempo'];
  const esRequiredHard = ['sostenible', 'importante', 'diferente', 'universo', 'lenguaje'];
  const esEasyFinal = ensureContains(esEasy, esRequiredEasy, esListValidated.filter(w=>w.length>=3 && w.length<=4));
  const esMediumFinal = ensureContains(esMedium, esRequiredMedium, esListValidated.filter(w=>w.length>=5 && w.length<=6));
  const esHardFinal = ensureContains(esHard, esRequiredHard, esListValidated.filter(w=>w.length>=7 && w.length<=15));
  console.log(`[ES] easy ${esEasyFinal.length} medium ${esMediumFinal.length} hard ${esHardFinal.length}`);

  // PL generation
  const plEasy = bucketByLength(plList, 3, 4, 120);
  const plMedium = bucketByLength(plList, 5, 6, 120);
  const plHard = bucketByLength(plList, 7, 15, 120);
  const plRequiredEasy = ['dom', 'woda', 'zycie', 'kota', 'czas'];
  const plRequiredMedium = ['ogrod', 'rodzina', 'miasto', 'przyjaciel'.slice(0,6)]; // przyjaciel too long, use miasto etc
  const plRequiredHard = ['zrównoważony'.normalize('NFD').replace(/[\u0300-\u036f]/g,'')]; // becomes zrownowazony
  // Simpler PL hard required: use common hard words from list
  const plHardFallbackRequired = ['wazny', 'inny']; // but these are short
  const plEasyFinal = ensureContains(plEasy, ['dom', 'kot', 'pies', 'woda'], plList.filter(w=>w.length>=3 && w.length<=4));
  const plMediumFinal = ensureContains(plMedium, ['ogrod', 'rodzina', 'miasto'], plList.filter(w=>w.length>=5 && w.length<=6));
  const plHardFinal = ensureContains(plHard, ['wspanialy', 'uniwersytet', 'naprawde'].map(w=>normalize(w)), plList.filter(w=>w.length>=7 && w.length<=15));
  // Ensure ogrod appears - ogorod is 5 letters but normalize? ogród -> ogrod
  // plHard should contain longer common words
  console.log(`[PL] easy ${plEasyFinal.length} medium ${plMediumFinal.length} hard ${plHardFinal.length}`);
  console.log('[PL] easy sample', plEasyFinal.slice(0,10));
  console.log('[PL] medium sample', plMediumFinal.slice(0,10));
  console.log('[PL] hard sample', plHardFinal.slice(0,10));

  // ZH and AR fallback to EN common (use EN lists truncated)
  // Use EN final lists but slice to 80 or 120 each? We'll use 120 each to keep 360 total, consistent with PT
  // If original was 80, we provide 80 to not break; but spec says fallback EN comum, so any consistent common is fine.
  // We'll provide 120 each (360) for better coverage, but also ensure total matches previous if they expect 80: either is acceptable.
  // Decision: ZH/AR 80 per level (like before) to keep file smaller, but using EN common
  const zhArEasyCount = 120;
  const zhArMediumCount = 120;
  const zhArHardCount = 120;
  // Use EN common words for fallback: take EN final but ensure not empty
  const zhEasy = enEasyFinal.slice(0, zhArEasyCount);
  const zhMedium = enMediumFinal.slice(0, zhArMediumCount);
  const zhHard = enHardFinal.slice(0, zhArHardCount);
  const arEasy = enEasyFinal.slice(0, zhArEasyCount);
  const arMedium = enMediumFinal.slice(0, zhArMediumCount);
  const arHard = enHardFinal.slice(0, zhArHardCount);

  const output = {
    EN: { easy: enEasyFinal, medium: enMediumFinal, hard: enHardFinal },
    PT: { easy: ptEasyFinal, medium: ptMediumFinal, hard: ptHardFinal },
    ES: { easy: esEasyFinal, medium: esMediumFinal, hard: esHardFinal },
    PL: { easy: plEasyFinal, medium: plMediumFinal, hard: plHardFinal },
    ZH: { easy: zhEasy, medium: zhMedium, hard: zhHard },
    AR: { easy: arEasy, medium: arMedium, hard: arHard },
  };

  // Validate no obscure words
  const obscureChecks = ['bude', 'stu', 'lori', 'arvo', 'bod', 'egre', 'wabs', 'sadh', 'otic', 'adobos', 'lammer', 'verek', 'bindis', 'sotol', 'buqshas', 'bursattee', 'panmnesia', 'scelerat', 'receptorial', 'amenuse', 'rotalian'];
  const allWords = [...enEasyFinal, ...enMediumFinal, ...enHardFinal, ...ptEasyFinal, ...ptMediumFinal, ...ptHardFinal, ...esEasyFinal, ...esMediumFinal, ...esHardFinal, ...plEasyFinal, ...plMediumFinal, ...plHardFinal];
  let foundObscure = 0;
  for (const obs of obscureChecks) {
    if (allWords.includes(obs)) { console.log(`[FAIL] obscure word still present: ${obs}`); foundObscure++; }
  }
  console.log(`[VALIDATE] obscure words found: ${foundObscure} (expected 0)`);
  // Validate required
  console.log(`[VALIDATE] house present: ${allWords.includes('house')}`);
  console.log(`[VALIDATE] garden present: ${allWords.includes('garden')}`);
  console.log(`[VALIDATE] sustainable present: ${allWords.includes('sustainable')}`);

  // Write file
  fs.writeFileSync(WORD_JSON_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`[WRITE] Wrote ${WORD_JSON_PATH}`);
  console.log(`Counts: EN ${enEasyFinal.length}/${enMediumFinal.length}/${enHardFinal.length} PT ${ptEasyFinal.length}/${ptMediumFinal.length}/${ptHardFinal.length} ES ${esEasyFinal.length}/${esMediumFinal.length}/${esHardFinal.length} PL ${plEasyFinal.length}/${plMediumFinal.length}/${plHardFinal.length} ZH ${zhEasy.length}/${zhMedium.length}/${zhHard.length} AR ${arEasy.length}/${arMedium.length}/${arHard.length}`);

  // Supabase upsert + cleanup
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.log('[SUPABASE] Missing SUPABASE_URL or KEY, skipping DB sync');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[SUPABASE] Starting cleanup and upsert...');

  // Cleanup: fetch all existing words with pagination (supabase defaults to 1000)
  try {
    let existing = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page, error: fetchErr } = await supabase.from('words').select('id, word, language, level, is_active').range(from, from + pageSize - 1);
      if (fetchErr) throw fetchErr;
      if (!page || page.length === 0) break;
      existing = existing.concat(page);
      console.log(`[SUPABASE] Fetched page ${from}-${from+page.length-1} (${page.length} rows) total ${existing.length}`);
      if (page.length < pageSize) break;
      from += pageSize;
      if (from > 30000) break; // safety
    }
    console.log(`[SUPABASE] Existing words count: ${existing?.length ?? 0}`);

    // Build set of new words for stale cleanup (will be built later, but we need to prepare invalidation after dedup)
    // First identify invalid words: fail isValidWord or contains obscure
    const invalid = (existing || []).filter(row => {
      const w = (row.word || '').toLowerCase();
      if (!isValidWord(w)) return true;
      if (obscureChecks.includes(w)) return true;
      return false;
    });
    console.log(`[SUPABASE] Invalid words (isValidWord or obscure) to deactivate/delete: ${invalid.length}`);
    let staleIds = [];
    // We'll compute stale after building new set - placeholder for now to deactivate invalid immediately
    if (invalid.length > 0) {
      console.log(`[SUPABASE] Sample invalid: ${invalid.slice(0,10).map(r=>r.word).join(', ')}`);
      const ids = invalid.map(r=>r.id);
      const { error: updateErr } = await supabase.from('words').update({ is_active: false }).in('id', ids);
      if (updateErr) console.error('[SUPABASE] Failed to deactivate invalid:', updateErr.message);
      else console.log(`[SUPABASE] Deactivated ${ids.length} invalid words`);
      const obscureIds = invalid.filter(r => obscureChecks.includes((r.word||'').toLowerCase())).map(r=>r.id);
      if (obscureIds.length>0) {
        const { error: delErr } = await supabase.from('words').delete().in('id', obscureIds);
        if (delErr) console.error('[SUPABASE] Delete obscure failed:', delErr.message);
        else console.log(`[SUPABASE] Deleted ${obscureIds.length} obscure words`);
      }
    }

    // Upsert new words: prepare rows
    const levelMap = { easy: 1, medium: 2, hard: 3 };
    const rowsToUpsert = [];
    for (const lang of ['EN','PT','ES','PL','ZH','AR']) {
      // For ZH/AR, language in DB is EN? But table allows EN,PT,ES,PL,ZH - does not allow AR? Check migration: language IN ('EN','PT','ES','PL','ZH') - AR not allowed!
      // So we need to map AR to EN or handle. For DB, skip AR or map to EN? But spec says public.words + cleanup.
      // We will for DB use only EN,PT,ES,PL,ZH (AR not in DB schema, skip)
      if (lang === 'AR' && !['EN','PT','ES','PL','ZH','AR'].includes(lang)) continue;
      // But AR is not in DB CHECK, so we skip DB upsert for AR. Or store as EN? Better skip.
      if (lang === 'AR') {
        console.log('[SUPABASE] Skipping AR for DB (not in CHECK constraint)');
        continue;
      }
      for (const diff of ['easy','medium','hard']) {
        const words = output[lang][diff];
        const level = levelMap[diff];
        for (const w of words) {
          rowsToUpsert.push({ word: w, language: lang, level, is_active: true });
        }
      }
    }
    // Deduplicate rowsToUpsert by word|language to avoid ON CONFLICT duplicate in chunk
    const dedupMap = new Map();
    for (const r of rowsToUpsert) {
      const key = `${r.word}|${r.language}`;
      if (!dedupMap.has(key)) dedupMap.set(key, r);
      // keep first level if duplicate; if duplicate has different level, prefer first
    }
    const dedupedRows = Array.from(dedupMap.values());
    if (dedupedRows.length !== rowsToUpsert.length) {
      console.log(`[SUPABASE] Deduplicated rows: ${rowsToUpsert.length} -> ${dedupedRows.length}`);
    }
    // Stale cleanup: deactivate active rows not in new set (valid but not in top frequent)
    const newSet = new Set(dedupedRows.map(r => `${r.word.toLowerCase()}|${r.language}`));
    const stale = (existing || []).filter(row => {
      if (!row.is_active) return false;
      const key = `${(row.word||'').toLowerCase()}|${row.language}`;
      // already invalid handled, but also check if still active and not in new set
      if (newSet.has(key)) return false;
      // If word fails isValidWord, already counted as invalid, skip to avoid double deactivate
      if (invalid.some(inv => inv.id === row.id)) return false;
      return true;
    });
    console.log(`[SUPABASE] Stale active words not in new top frequent: ${stale.length}`);
    if (stale.length > 0) {
      console.log(`[SUPABASE] Sample stale: ${stale.slice(0,10).map(r=>r.word).join(', ')}`);
      const staleIds = stale.map(r=>r.id);
      // Deactivate in batches of 500 to avoid too long IN clause
      for (let i=0; i<staleIds.length; i+=500) {
        const batch = staleIds.slice(i, i+500);
        const { error } = await supabase.from('words').update({ is_active: false }).in('id', batch);
        if (error) console.error(`[SUPABASE] Failed to deactivate stale batch ${i}:`, error.message);
      }
      console.log(`[SUPABASE] Deactivated ${staleIds.length} stale words`);
    }
    console.log(`[SUPABASE] Upserting ${dedupedRows.length} rows...`);
    // Batch upsert in chunks of 500
    const chunkSize = 500;
    let upserted = 0;
    for (let i=0; i<dedupedRows.length; i+=chunkSize) {
      const chunk = dedupedRows.slice(i, i+chunkSize);
      const { error: upsertErr } = await supabase.from('words').upsert(chunk, { onConflict: 'word,language', ignoreDuplicates: false });
      if (upsertErr) {
        console.error(`[SUPABASE] Upsert chunk ${i} failed:`, upsertErr.message);
        // Try individual rows to isolate duplicates
        for (const row of chunk) {
          const { error } = await supabase.from('words').upsert([row], { onConflict: 'word,language' });
          if (error) console.error(`[SUPABASE] Single upsert failed for ${row.word}/${row.language}:`, error.message);
          else upserted++;
        }
      } else {
        upserted += chunk.length;
      }
    }
    console.log(`[SUPABASE] Upserted ${upserted} rows`);

    // Also need to handle CrossLinesGame.words if exists (fallback)
    // Try to sync to CrossLinesGame schema via rpc? Supabase client uses public schema by default via postgrest.
    // public.words is main; if CrossLinesGame.words exists, it may need separate handling via raw query, but we can attempt.
    try {
      const { data: cgData, error: cgErr } = await supabase.schema('CrossLinesGame').from('words').select('id').limit(1);
      if (!cgErr) {
        console.log('[SUPABASE] CrossLinesGame.words exists, syncing...');
        // Attempt same upsert via schema
        for (let i=0; i<rowsToUpsert.length; i+=chunkSize) {
          const chunk = rowsToUpsert.slice(i, i+chunkSize);
          const { error } = await supabase.schema('CrossLinesGame').from('words').upsert(chunk, { onConflict: 'word,language' });
          if (error) console.error('[SUPABASE] CG upsert failed:', error.message);
        }
        // Cleanup invalid there too
        const { data: cgExisting } = await supabase.schema('CrossLinesGame').from('words').select('id, word');
        const cgInvalid = (cgExisting||[]).filter(r=> !isValidWord((r.word||'').toLowerCase()) || obscureChecks.includes((r.word||'').toLowerCase()));
        if (cgInvalid.length>0) {
          const cgIds = cgInvalid.map(r=>r.id);
          await supabase.schema('CrossLinesGame').from('words').update({ is_active: false }).in('id', cgIds);
          console.log(`[SUPABASE] CG deactivated ${cgIds.length}`);
        }
      } else {
        console.log('[SUPABASE] CrossLinesGame schema not accessible or not exists:', cgErr.message);
      }
    } catch (e) {
      console.log('[SUPABASE] CrossLinesGame sync skipped:', e.message);
    }

    // Verify final counts with pagination
    let finalData = [];
    {
      let from = 0; const pageSize = 1000;
      while (true) {
        const { data: page, error } = await supabase.from('words').select('language, level').eq('is_active', true).range(from, from + pageSize -1);
        if (error) { console.error('[SUPABASE] Final counts fetch error:', error.message); break; }
        if (!page || page.length===0) break;
        finalData = finalData.concat(page);
        if (page.length < pageSize) break;
        from += pageSize;
      }
    }
    if (finalData.length > 0) {
      const counts = {};
      finalData.forEach(r=>{
        const key = `${r.language}-${r.level}`;
        counts[key] = (counts[key]||0)+1;
      });
      console.log('[SUPABASE] Final active counts by language-level:', counts);
      console.log('[SUPABASE] Total active:', finalData.length);
    } else {
      console.log('[SUPABASE] No active rows found');
    }

  } catch (e) {
    console.error('[SUPABASE] Error during DB sync:', e.message);
    console.error(e);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const LEVEL_MAP = { easy: 1, medium: 2, hard: 3 };
const BATCH_SIZE = 50;

async function main() {
  const filePath = path.join(__dirname, '..', 'public', 'words.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  const entries = [];
  for (const lang of Object.keys(data)) {
    for (const levelName of Object.keys(data[lang])) {
      const level = LEVEL_MAP[levelName];
      if (!level) continue;
      for (const word of data[lang][levelName]) {
        const w = word.toUpperCase().trim(); // Supabase expects uppercase per import-words.js, but we can store upper
        // Keep original as lower? The DB is case-sensitive unique word,language - use uppercase for consistency with import-words.js
        // But also original migration uses varchar(20) without case handling. We'll store uppercase to match previous behavior.
        if (!w || w.length > 20) continue;
        entries.push({ word: w, language: lang, level, is_active: true });
      }
    }
  }

  console.log(`Total entries to upsert: ${entries.length}`);
  const langCounts = {};
  entries.forEach(e => { langCounts[e.language] = (langCounts[e.language]||0)+1; });
  console.log('Per language:', langCounts);

  let totalUpserted = 0;
  let totalErrors = 0;

  // Try public.words first, fallback to CrossLinesGame.words if needed
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('words').upsert(batch, { onConflict: 'word,language', ignoreDuplicates: false }).select();
    if (error) {
      console.error(`Batch ${i/BATCH_SIZE} error:`, error.message, error.code, error.details);
      totalErrors++;
      // Try alternative schema if needed? supabase JS can't easily do schema prefix, but public is default
      continue;
    }
    if (data) totalUpserted += data.length;
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(entries.length/BATCH_SIZE)} upserted ${data?.length || 0}`);
  }

  console.log(`\nDone. Upserted ${totalUpserted}/${entries.length} entries, errors ${totalErrors}`);

  // Verify count
  const { count, error: countError } = await supabase.from('words').select('*', { count: 'exact', head: true }).eq('is_active', true);
  if (countError) console.error('Count error', countError);
  else console.log(`Total is_active words in DB: ${count}`);

  const { data: sample, error: sampleError } = await supabase.from('words').select('word,language,level').eq('is_active', true).limit(5);
  if (!sampleError) console.log('Sample DB rows:', sample);

  // Check banned still not in DB (query for LLATX etc)
  const banned = ['LLATX','HQVKL','AFWQJJ'];
  for (const b of banned) {
    const { data: found } = await supabase.from('words').select('word').eq('word', b).limit(1);
    if (found && found.length > 0) console.warn(`Banned word still in DB: ${b}`);
    else console.log(`Banned ${b} not in DB (good)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

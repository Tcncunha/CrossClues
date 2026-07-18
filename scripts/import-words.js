require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const BATCH_SIZE = 50;

async function fetchRandomWords(count) {
  const words = [];
  const seen = new Set();

  while (words.length < count) {
    const needed = count - words.length;
    const batchSize = Math.min(BATCH_SIZE, needed);

    const res = await fetch(
      `https://random-word-api.vercel.app/api/v1?wordlength=5&count=${batchSize}`
    );

    if (!res.ok) {
      throw new Error(`Random Word API error: ${res.status}`);
    }

    const data = await res.json();

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

async function main() {
  const targetCount = parseInt(process.argv[2]) || 100;
  console.log(`\n=== Importando ${targetCount} palavras EN para Supabase ===\n`);

  const words = await fetchRandomWords(targetCount);
  console.log(`${words.length} palavras obtidas da API`);

  const entries = words.map(word => ({
    word,
    length: word.length,
    language: 'EN',
    is_active: true,
  }));

  let imported = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('words')
      .upsert(batch, { onConflict: 'word,language', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('Erro ao inserir batch:', error.message);
      continue;
    }

    if (data) imported += data.length;
    process.stdout.write(`\rInseridos: ${imported}/${words.length}`);
  }

  console.log('\n\n✅ Concluido!');

  const { count } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'EN')
    .eq('is_active', true);

  console.log(`Total de palavras EN no banco: ${count}`);
}

main().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});

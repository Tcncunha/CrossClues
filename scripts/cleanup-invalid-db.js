require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY);

function isValidWord(word) {
  const w = word.toLowerCase().trim();
  if (!/^[a-z]{3,15}$/.test(w)) return false;
  if (!/[aeiou]/i.test(w)) return false;
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(w)) return false;
  return true;
}

async function main() {
  const filePath = path.join(__dirname, '..', 'public', 'words.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const validSet = new Set();
  for (const lang of Object.keys(data)) {
    for (const lvl of Object.keys(data[lang])) {
      for (const w of data[lang][lvl]) validSet.add(`${w.toUpperCase()}|${lang}`);
    }
  }
  console.log(`Valid set size: ${validSet.size}`);

  // Fetch all active words from DB (paginate)
  let allRows = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: rows, error } = await supabase.from('words').select('id,word,language').eq('is_active', true).range(from, from+pageSize-1);
    if (error) throw error;
    if (!rows || rows.length === 0) break;
    allRows.push(...rows);
    console.log(`Fetched ${rows.length} rows (total ${allRows.length})`);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  console.log(`Total active in DB: ${allRows.length}`);

  const toDeactivate = allRows.filter(r => {
    const key = `${r.word.toUpperCase()}|${r.language}`;
    // if not in validSet, it's either old garbage or not in current file -> deactivate
    // also if invalid per simple filter, deactivate
    if (!validSet.has(key)) return true;
    if (!isValidWord(r.word)) return true;
    return false;
  });

  console.log(`To deactivate (not in valid file or invalid): ${toDeactivate.length}`);
  console.log('Sample to deactivate:', toDeactivate.slice(0,20).map(r=> `${r.word}(${r.language})`));

  const toKeep = allRows.length - toDeactivate.length;
  console.log(`To keep: ${toKeep}`);

  // Deactivate in batches via update is_active=false by id
  const BATCH = 50;
  let deactivated = 0;
  for (let i=0; i<toDeactivate.length; i+=BATCH) {
    const batch = toDeactivate.slice(i,i+BATCH);
    const ids = batch.map(r=>r.id);
    const { error } = await supabase.from('words').update({ is_active: false }).in('id', ids);
    if (error) {
      console.error(`Batch ${i/BATCH} error`, error.message);
    } else {
      deactivated += batch.length;
      console.log(`Deactivated batch ${Math.floor(i/BATCH)+1}/${Math.ceil(toDeactivate.length/BATCH)} -> ${deactivated}`);
    }
  }

  console.log(`Done deactivated ${deactivated}`);

  // Verify count after
  const { count } = await supabase.from('words').select('*', { count:'exact', head:true }).eq('is_active', true);
  console.log(`Remaining active count: ${count}`);

  // Verify banned gone from active
  const banned = ['LLATX','HQVKL','AFWQJJ','CIOG','NRH','NDA'];
  for (const b of banned) {
    const { data } = await supabase.from('words').select('word,language').eq('word', b).eq('is_active', true).limit(1);
    console.log(`${b} active? ${data && data.length>0 ? 'YES BAD' : 'NO good'}`);
  }
}

main().catch(e=>{console.error(e);process.exit(1);});

/**
 * Regenerate public/words.json with REAL words, no acronyms.
 * Steps:
 * 1. Restore base from git HEAD (saved via git show) as base for PT/EN
 * 2. Fetch https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
 *    fallback: https://raw.githubusercontent.com/powerlanguage/word-lists/master/word-list-raw.txt
 * 3. Filter: only a-z, 3-15 letters, no hyphen/numbers, has vowel, max 3 consecutive consonants, no acronym (2-3 uppercase without vowel)
 * 4. Expand EN to 350 easy 3-4, 350 medium 5-6, 300 hard 7-12
 * 5. PT maintain real + expand, ES/PL fetch real or fallback to EN, ZH/AR fallback to EN but real.
 * 6. Overwrite public/words.json
 */
const fs = require('fs');
const path = require('path');

const HEAD_PATH = path.join(__dirname, '..', 'public', 'words.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'words.json');
const TEMP_HEAD_PATH = 'C:\\Users\\thiag\\AppData\\Local\\Temp\\opencode\\head_words.json';

const EN_URLS = [
  'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt',
  'https://raw.githubusercontent.com/powerlanguage/word-lists/master/word-list-raw.txt',
];
const PT_URLS = [
  'https://raw.githubusercontent.com/pythonprobr/palavras/master/palavras.txt',
  'https://raw.githubusercontent.com/fserb/pt-br/master/dicio',
];
const ES_URLS = [
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt',
  'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Spanish.dic',
];
const PL_URLS = [
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pl/pl_50k.txt',
  'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Polish.dic',
];

function isValidWord(word) {
  if (!word) return false;
  const w = word.toLowerCase().trim();
  if (!/^[a-z]{3,15}$/.test(w)) return false;
  if (!/[aeiou]/i.test(w)) return false;
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(w)) return false;
  return true;
}
function isValidWordPL(word) {
  if (!word) return false;
  const w = word.toLowerCase().trim();
  if (!/^[a-z]{3,15}$/.test(w)) return false;
  if (!/[aeiouy]/i.test(w)) return false;
  if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(w)) return false; // allow y not counted as consonant
  // for PL we count consonants excluding y
  if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(w)) return false;
  return true;
}

function isAcronym(word) {
  // per spec: /^[A-Z]{2,3}$/ or without vowel or 4 consonants
  const w = word.trim();
  if (/^[A-Z]{2,3}$/.test(w)) return true;
  if (!/[aeiou]/i.test(w)) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(w)) return true;
  return false;
}

async function fetchWordList(urls) {
  for (const url of urls) {
    try {
      console.log(`Fetching ${url} ...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      let lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      // hermitdave frequency format: "word count" -> extract first token
      if (url.includes('FrequencyWords')) {
        lines = lines.map(l => l.split(/\s+/)[0].trim());
      }
      // titoBouzout format: first line is count number, and entries may contain / suffix
      if (url.includes('titoBouzout')) {
        // remove first line if it's numeric
        if (/^\d+$/.test(lines[0])) lines.shift();
        lines = lines.map(l => l.split('/')[0].trim()).map(l => l.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      }
      lines = lines.map(s => s.toLowerCase()).filter(Boolean);
      console.log(`  -> ${lines.length} raw words from ${url}`);
      if (lines.length > 100) return lines;
    } catch (e) {
      console.warn(`  fetch failed ${url}: ${e.message}`);
    }
  }
  return null;
}

function bucketWords(validWords) {
  const easy = [];   // 3-4
  const medium = []; // 5-6
  const hard = [];   // 7-12 (or up to 15 but spec 7-12)
  const seen = new Set();
  for (const w of validWords) {
    if (seen.has(w)) continue;
    seen.add(w);
    const len = w.length;
    if (len >= 3 && len <= 4) easy.push(w);
    else if (len >= 5 && len <= 6) medium.push(w);
    else if (len >= 7 && len <= 12) hard.push(w);
    // 13-15 ignore for hard per spec (max 12)
  }
  return { easy, medium, hard };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  // 1. Load head base
  let headBase = null;
  try {
    let raw = fs.readFileSync(TEMP_HEAD_PATH, 'utf-8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM from git show output
    headBase = JSON.parse(raw);
    console.log('Loaded HEAD base via temp file');
  } catch (e) {
    console.warn('No temp head, trying git show fallback or local HEAD file:', e.message);
    try {
      let raw2 = fs.readFileSync(path.join(__dirname, '..', 'public', 'words.json.head'), 'utf-8');
      if (raw2.charCodeAt(0) === 0xFEFF) raw2 = raw2.slice(1);
      headBase = JSON.parse(raw2);
    } catch {}
  }
  if (!headBase) {
    // try reading current public/words.json if it still has real words for EN/PT start
    // but we will fetch fresh anyway
    headBase = { EN: { easy: [], medium: [], hard: [] }, PT: { easy: [], medium: [], hard: [] } };
  }

  console.log(`HEAD base EN: ${headBase.EN?.easy?.length}/${headBase.EN?.medium?.length}/${headBase.EN?.hard?.length} PT: ${headBase.PT?.easy?.length}/${headBase.PT?.medium?.length}/${headBase.PT?.hard?.length}`);

  // Prepare base PT and EN real sets - re-bucket by actual length to enforce 3-4/5-6/7-12 spec
  function rebunchByLength(words) {
    const easy=[], medium=[], hard=[];
    for (const w of words) {
      const len=w.length;
      if (len>=3 && len<=4) easy.push(w);
      else if (len>=5 && len<=6) medium.push(w);
      else if (len>=7 && len<=12) hard.push(w);
      // 13-15 ignore, 2 or less ignore
    }
    return { easy, medium, hard };
  }
  const rawBaseEN = [...(headBase.EN?.easy||[]), ...(headBase.EN?.medium||[]), ...(headBase.EN?.hard||[])].map(w=>w.toLowerCase()).filter(isValidWord);
  const baseEN = rebunchByLength(rawBaseEN);
  const rawBasePT = [...(headBase.PT?.easy||[]), ...(headBase.PT?.medium||[]), ...(headBase.PT?.hard||[])].map(w=>w.toLowerCase()).filter(isValidWord);
  const basePT = rebunchByLength(rawBasePT);
  console.log(`Base filtered EN rebunched: ${baseEN.easy.length}/${baseEN.medium.length}/${baseEN.hard.length}`);
  console.log(`Base filtered PT rebunched: ${basePT.easy.length}/${basePT.medium.length}/${basePT.hard.length}`);
  console.log(`Base filtered PT: ${basePT.easy.length}/${basePT.medium.length}/${basePT.hard.length}`);

  // 2. Fetch EN list
  let enRaw = await fetchWordList(EN_URLS);
  if (!enRaw) {
    console.error('Failed to fetch EN list, using base fallback + curated');
    enRaw = [...baseEN.easy, ...baseEN.medium, ...baseEN.hard];
    // curated fallback list to reach 1k
    const curated = `cat,dog,sun,moon,tree,house,car,book,fish,bird,door,hand,foot,eye,ear,nose,mouth,face,head,arm,leg,bed,cup,hat,box,key,pen,map,ball,egg,rain,snow,fire,wind,star,wave,seed,root,leaf,stone,milk,rice,salt,cake,soap,drum,bell,gold,iron,silk,garden,bridge,island,market,castle,shadow,mirror,forest,winter,harvest,thunder,carnival,journey,puzzle,riddle,blanket,feather,diamond,furnace,highway,luggage,oracle,panther,rainbow,cabinet,lantern,crystal,velvet,marble,serpent,comet,fossil,harbor,mosaic,tundra,summit,beacon,anchor,cipher,dagger,emerald,galaxy,horizon,jasmine,kingdom,legend,mineral,nebula,obsidian,phoenix,quartz,algorithm,bureaucracy,constellation,hypothesis,jurisdiction,metamorphosis,orchestration,philosophical,sustainable,transparent,vulnerability,circumference,accountability,autobiography,chronological,deterioration,electromagnetic,entrepreneurial,gastrointestinal,infrastructure,juxtaposition,kaleidoscope,magnificent,nevertheless,overwhelming,parliamentary,quintessential,rehabilitation,sophisticated,tripartite,ultraviolet,visualization,whistleblower,xylophonist,yearbook,archaeological,bioluminescence,catharsis,doppelganger,equivocate,fluorescent,grandiloquent,hemorrhage,idiosyncratic,juxtapose,loquacious,magnanimous,nonchalant,obsequious,perspicacious,quiescent`.split(',');
    enRaw.push(...curated);
  }

  // Normalize and dedupe
  const normalizedEn = [...new Set(enRaw.map(w => w.toLowerCase().trim()))].filter(isValidWord);
  console.log(`EN normalized valid: ${normalizedEn.length}`);

  // Shuffle to randomize selection but keep deterministic? Use shuffle
  const shuffledEn = shuffle(normalizedEn);
  const bucketEn = bucketWords(shuffledEn);
  console.log(`EN buckets raw: easy ${bucketEn.easy.length} medium ${bucketEn.medium.length} hard ${bucketEn.hard.length}`);

  // Ensure we have enough; if not, fill with filtered but we have 370k so should be enough

  // Build final EN with base guaranteed included
  function buildFinal(targetEasy, targetMedium, targetHard, base, buckets) {
    const seen = new Set();
    const easy = [];
    const medium = [];
    const hard = [];

    // First add base words (prioritize original real words)
    for (const w of base.easy) if (!seen.has(w) && easy.length < targetEasy && isValidWord(w)) { seen.add(w); easy.push(w); }
    for (const w of base.medium) if (!seen.has(w) && medium.length < targetMedium && isValidWord(w)) { seen.add(w); medium.push(w); }
    for (const w of base.hard) if (!seen.has(w) && hard.length < targetHard && isValidWord(w)) { seen.add(w); hard.push(w); }

    // Then fill from buckets
    for (const w of buckets.easy) { if (easy.length >= targetEasy) break; if (!seen.has(w)) { seen.add(w); easy.push(w); } }
    for (const w of buckets.medium) { if (medium.length >= targetMedium) break; if (!seen.has(w)) { seen.add(w); medium.push(w); } }
    for (const w of buckets.hard) { if (hard.length >= targetHard) break; if (!seen.has(w)) { seen.add(w); hard.push(w); } }

    // If still not enough hard (because 7-12 filtered more), use medium->hard overflow or 13-15? For now allow 7-15 as hard if needed
    if (hard.length < targetHard) {
      const extraHardCandidates = shuffledEn.filter(w => w.length >= 13 && w.length <= 15 && isValidWord(w) && !seen.has(w));
      for (const w of extraHardCandidates) { if (hard.length >= targetHard) break; seen.add(w); hard.push(w); }
    }

    return { easy: shuffle(easy), medium: shuffle(medium), hard: shuffle(hard), seen };
  }

  const finalEN = buildFinal(350, 350, 300, baseEN, bucketEn);
  console.log(`Final EN: ${finalEN.easy.length}/${finalEN.medium.length}/${finalEN.hard.length}`);

  // PT expansion
  let ptRaw = await fetchWordList(PT_URLS);
  let normalizedPt;
  if (!ptRaw) {
    console.warn('PT fetch failed, using basePT only + EN fallback filtered for PT-like');
    normalizedPt = [...basePT.easy, ...basePT.medium, ...basePT.hard];
  } else {
    // pt words may contain accents; normalize remove accents and filter a-z
    const normalizedAccents = ptRaw.map(w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
    normalizedPt = [...new Set(normalizedAccents)].filter(isValidWord);
    console.log(`PT normalized valid: ${normalizedPt.length}`);
  }
  const shuffledPt = shuffle(normalizedPt);
  const bucketPt = bucketWords(shuffledPt);
  console.log(`PT buckets: easy ${bucketPt.easy.length} medium ${bucketPt.medium.length} hard ${bucketPt.hard.length}`);

  // Target PT: let's do 120/120/120 = 360 total, keep base included
  let finalPT = buildFinal(120, 120, 120, basePT, bucketPt);
  // If PT not enough, fill with EN words that pass filter (spec says can maintain english but guarantee real)
  if (finalPT.easy.length < 120 || finalPT.medium.length < 120 || finalPT.hard.length < 120) {
    console.warn('PT insufficient, topping up with EN words');
    const fallbackEnBuckets = bucketEn;
    for (const w of fallbackEnBuckets.easy) { if (finalPT.easy.length >= 120) break; if (!finalPT.seen.has(w)) { finalPT.seen.add(w); finalPT.easy.push(w); } }
    for (const w of fallbackEnBuckets.medium) { if (finalPT.medium.length >= 120) break; if (!finalPT.seen.has(w)) { finalPT.seen.add(w); finalPT.medium.push(w); } }
    for (const w of fallbackEnBuckets.hard) { if (finalPT.hard.length >= 120) break; if (!finalPT.seen.has(w)) { finalPT.seen.add(w); finalPT.hard.push(w); } }
  }
  console.log(`Final PT: ${finalPT.easy.length}/${finalPT.medium.length}/${finalPT.hard.length}`);

  // ES
  let esRaw = await fetchWordList(ES_URLS);
  let normalizedEs;
  if (!esRaw) {
    console.warn('ES fetch failed, fallback to EN');
    normalizedEs = shuffle(normalizedEn).slice(0, 5000);
  } else {
    const normalizedAccentsEs = esRaw.map(w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
    normalizedEs = [...new Set(normalizedAccentsEs)].filter(isValidWord);
    console.log(`ES normalized valid: ${normalizedEs.length}`);
  }
  const bucketEs = bucketWords(shuffle(normalizedEs));
  const finalES = buildFinal(120, 120, 120, { easy: [], medium: [], hard: [] }, bucketEs);
  // top up if needed with EN
  if (finalES.easy.length < 120) {
    for (const w of bucketEn.easy) { if (finalES.easy.length >= 120) break; if (!finalES.seen.has(w)) { finalES.seen.add(w); finalES.easy.push(w); } }
  }
  if (finalES.medium.length < 120) {
    for (const w of bucketEn.medium) { if (finalES.medium.length >= 120) break; if (!finalES.seen.has(w)) { finalES.seen.add(w); finalES.medium.push(w); } }
  }
  if (finalES.hard.length < 120) {
    for (const w of bucketEn.hard) { if (finalES.hard.length >= 120) break; if (!finalES.seen.has(w)) { finalES.seen.add(w); finalES.hard.push(w); } }
  }
  console.log(`Final ES: ${finalES.easy.length}/${finalES.medium.length}/${finalES.hard.length}`);

  // PL - use strict isValidWord (aeiou) for universal compliance, no y-only words like bys/myc/gry
  let plRaw = await fetchWordList(PL_URLS);
  let normalizedPl;
  if (!plRaw) {
    console.warn('PL fetch failed, fallback to EN');
    normalizedPl = shuffle(normalizedEn).slice(0, 5000);
  } else {
    const normalizedPl2 = plRaw.map(w => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim());
    normalizedPl = [...new Set(normalizedPl2)].filter(isValidWord);
    console.log(`PL normalized valid (strict aeiou): ${normalizedPl.length}`);
    if (normalizedPl.length < 500) {
      normalizedPl.push(...shuffle(normalizedEn).slice(0, 1000));
      normalizedPl = [...new Set(normalizedPl)].filter(isValidWord);
    }
  }
  const bucketPl = bucketWords(shuffle(normalizedPl));
  const finalPL = buildFinal(120, 120, 120, { easy: [], medium: [], hard: [] }, bucketPl);
  if (finalPL.easy.length < 120) {
    for (const w of bucketEn.easy) { if (finalPL.easy.length >= 120) break; if (!finalPL.seen.has(w)) { finalPL.seen.add(w); finalPL.easy.push(w); } }
  }
  if (finalPL.medium.length < 120) {
    for (const w of bucketEn.medium) { if (finalPL.medium.length >= 120) break; if (!finalPL.seen.has(w)) { finalPL.seen.add(w); finalPL.medium.push(w); } }
  }
  if (finalPL.hard.length < 120) {
    for (const w of bucketEn.hard) { if (finalPL.hard.length >= 120) break; if (!finalPL.seen.has(w)) { finalPL.seen.add(w); finalPL.hard.push(w); } }
  }
  console.log(`Final PL: ${finalPL.easy.length}/${finalPL.medium.length}/${finalPL.hard.length}`);

  // ZH / AR -> fallback to EN real words (pinyin/transliteration not needed, spec allows english)
  // Use distinct slices of EN to avoid 100% overlap but guarantee real
  // For ZH we attempt to fetch? We already decided fallback.
  // Create ZH and AR as slices of shuffledEn but ensure not overlapping too much with EN? Overlap is ok per spec says could maintain english.
  // Let's use shuffledEn slices

  const zhPool = shuffle(normalizedEn);
  const zhBuckets = bucketWords(zhPool);
  const finalZH = buildFinal(80, 80, 80, { easy: [], medium: [], hard: [] }, zhBuckets);
  // pad with EN if needed
  if (finalZH.easy.length < 80) for (const w of bucketEn.easy) { if (finalZH.easy.length >= 80) break; if (!finalZH.seen.has(w)) { finalZH.seen.add(w); finalZH.easy.push(w); } }
  if (finalZH.medium.length < 80) for (const w of bucketEn.medium) { if (finalZH.medium.length >= 80) break; if (!finalZH.seen.has(w)) { finalZH.seen.add(w); finalZH.medium.push(w); } }
  if (finalZH.hard.length < 80) for (const w of bucketEn.hard) { if (finalZH.hard.length >= 80) break; if (!finalZH.seen.has(w)) { finalZH.seen.add(w); finalZH.hard.push(w); } }

  const arPool = shuffle(normalizedEn);
  const arBuckets = bucketWords(arPool);
  const finalAR = buildFinal(80, 80, 80, { easy: [], medium: [], hard: [] }, arBuckets);
  if (finalAR.easy.length < 80) for (const w of bucketEn.easy) { if (finalAR.easy.length >= 80) break; if (!finalAR.seen.has(w)) { finalAR.seen.add(w); finalAR.easy.push(w); } }
  if (finalAR.medium.length < 80) for (const w of bucketEn.medium) { if (finalAR.medium.length >= 80) break; if (!finalAR.seen.has(w)) { finalAR.seen.add(w); finalAR.medium.push(w); } }
  if (finalAR.hard.length < 80) for (const w of bucketEn.hard) { if (finalAR.hard.length >= 80) break; if (!finalAR.seen.has(w)) { finalAR.seen.add(w); finalAR.hard.push(w); } }

  console.log(`Final ZH: ${finalZH.easy.length}/${finalZH.medium.length}/${finalZH.hard.length}`);
  console.log(`Final AR: ${finalAR.easy.length}/${finalAR.medium.length}/${finalAR.hard.length}`);

  function validateAndClean(arr, validator = isValidWord) {
    return arr.filter(w => {
      if (!validator(w)) {
        console.warn(`Filtered invalid ${w}`);
        return false;
      }
      return true;
    });
  }
  finalEN.easy = validateAndClean(finalEN.easy, isValidWord);
  finalEN.medium = validateAndClean(finalEN.medium, isValidWord);
  finalEN.hard = validateAndClean(finalEN.hard, isValidWord);
  finalPT.easy = validateAndClean(finalPT.easy, isValidWord);
  finalPT.medium = validateAndClean(finalPT.medium, isValidWord);
  finalPT.hard = validateAndClean(finalPT.hard, isValidWord);
  finalES.easy = validateAndClean(finalES.easy, isValidWord);
  finalES.medium = validateAndClean(finalES.medium, isValidWord);
  finalES.hard = validateAndClean(finalES.hard, isValidWord);
  finalPL.easy = validateAndClean(finalPL.easy, isValidWordPL);
  finalPL.medium = validateAndClean(finalPL.medium, isValidWordPL);
  finalPL.hard = validateAndClean(finalPL.hard, isValidWordPL);
  finalZH.easy = validateAndClean(finalZH.easy, isValidWord);
  finalZH.medium = validateAndClean(finalZH.medium, isValidWord);
  finalZH.hard = validateAndClean(finalZH.hard, isValidWord);
  finalAR.easy = validateAndClean(finalAR.easy, isValidWord);
  finalAR.medium = validateAndClean(finalAR.medium, isValidWord);
  finalAR.hard = validateAndClean(finalAR.hard, isValidWord);

  const output = {
    EN: { easy: finalEN.easy, medium: finalEN.medium, hard: finalEN.hard },
    PT: { easy: finalPT.easy, medium: finalPT.medium, hard: finalPT.hard },
    ES: { easy: finalES.easy, medium: finalES.medium, hard: finalES.hard },
    PL: { easy: finalPL.easy, medium: finalPL.medium, hard: finalPL.hard },
    ZH: { easy: finalZH.easy, medium: finalZH.medium, hard: finalZH.hard },
    AR: { easy: finalAR.easy, medium: finalAR.medium, hard: finalAR.hard },
  };

  // Ensure lowercase
  for (const lang of Object.keys(output)) {
    for (const lvl of Object.keys(output[lang])) {
      output[lang][lvl] = output[lang][lvl].map(w => w.toLowerCase());
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nWrote ${OUTPUT_PATH}`);
  const total = Object.values(output).reduce((sum, lang) => sum + lang.easy.length + lang.medium.length + lang.hard.length, 0);
  console.log(`Total words: ${total}`);
  for (const [lang, data] of Object.entries(output)) {
    console.log(`${lang}: easy ${data.easy.length} medium ${data.medium.length} hard ${data.hard.length} total ${data.easy.length + data.medium.length + data.hard.length}`);
  }

  // Check for banned acronym samples
  const bannedSamples = ['LLATX','HQVKL','AFWQJJ','KYVPM','QDHSTV','NRH','NDA','IEV'];
  const allWords = Object.values(output).flatMap(l => [...l.easy, ...l.medium, ...l.hard]).map(w => w.toUpperCase());
  const foundBanned = bannedSamples.filter(b => allWords.includes(b));
  console.log(`Banned samples found: ${foundBanned.length ? foundBanned.join(',') : 'NONE (good)'}`);

  // Quick invalid check - per-language: PL allows Y, others require AEIOU
  const invalidEN = [...finalEN.easy, ...finalEN.medium, ...finalEN.hard].map(w=>w.toUpperCase()).filter(w => !/^[A-Z]{3,15}$/.test(w) || !/[AEIOU]/i.test(w) || /[BCDFGHJKLMNPQRSTVWXYZ]{4,}/i.test(w));
  const invalidPT = [...finalPT.easy, ...finalPT.medium, ...finalPT.hard].map(w=>w.toUpperCase()).filter(w => !/^[A-Z]{3,15}$/.test(w) || !/[AEIOU]/i.test(w) || /[BCDFGHJKLMNPQRSTVWXYZ]{4,}/i.test(w));
  const invalidES = [...finalES.easy, ...finalES.medium, ...finalES.hard].map(w=>w.toUpperCase()).filter(w => !/^[A-Z]{3,15}$/.test(w) || !/[AEIOU]/i.test(w) || /[BCDFGHJKLMNPQRSTVWXYZ]{4,}/i.test(w));
  const invalidPL = [...finalPL.easy, ...finalPL.medium, ...finalPL.hard].map(w=>w.toUpperCase()).filter(w => !/^[A-Z]{3,15}$/.test(w) || !/[AEIOUY]/i.test(w) || /[BCDFGHJKLMNPQRSTVWXZ]{4,}/i.test(w));
  const invalid = [...invalidEN, ...invalidPT, ...invalidES, ...invalidPL];
  console.log(`Invalid by vowel/consonant/length rule: ${invalid.length} (should be 0, sample: ${invalid.slice(0,5).join(',')})`);
}

main().catch(e => { console.error(e); process.exit(1); });

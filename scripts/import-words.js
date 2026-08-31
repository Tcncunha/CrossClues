require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const WORDS = {
  1: [
    'CAT','DOG','SUN','RUN','BIG','RED','HAT','CUP','BUS','PEN',
    'BED','BOX','JAM','PIG','FOX','SKY','TEN','WET','HOT','OLD',
    'NEW','TOP','FUN','MAP','JOB','ARM','EGG','ICE','BEE','COB',
    'BAG','DIG','FLY','HEN','JAR','KEY','LOG','MUD','NUT','OWL',
    'POT','RUG','SIT','TAP','VAN','WIN','YAM','ZOO','AIR','ANT',
    'AXE','BAT','COW','DAM','EAR','FAN','GUM','HIP','INK','LID',
    'NET','OAR','PIT','RAY','SIP','TIN','USE','VET','WAX','YAK',
    'BAD','CAR','DIP','ELF','GAP','HID','ICY','JAB','KID','LAP',
    'MIX','NAP','OIL','PEG','RIB','SAP','TUB','URB','VOW','WIG',
    'ACE','BIT','COP','DUG','FED','GOT','HIT','ILL','JOT','KIT',
    'LID','MAP','NAP','OAT','PIE','RIB','SAP','TAR','URN','WIG',
    'ADD','BAN','CUT','DIM','END','FIG','GEL','HOP','IMP','JAG',
    'KEG','LUG','MOP','NAG','OPT','PUN','RIM','SOD','TUG','VET',
    'BOW','DYE','FLU','GIN','HEM','IRE','JIG','KEG','LOP','MOB',
    'NIT','OPE','PIG','RAG','SAG','TIP','UPO','VIA','WED','YAP',
    'ARC','BUY','COD','DAB','ELF','FIT','GNU','HUE','ICE','JAB',
    'KIN','LEO','MAT','NIB','OAK','POD','RUT','SUE','TRY','WOK',
    'AWE','BET','CAD','DAM','ERA','FUR','GUT','HOG','IMP','JAW',
    'KEP','LIT','MIX','NIL','ORB','PIT','RIG','SKY','TWO','VIE',
    'WOE','YAM','ZAP','BOW','DYE','FLU','GIN','HEM','IRE','JIG',
  ],
  2: [
    'TABLE','CHAIR','HOUSE','PLANT','BREAD','WATER','LIGHT','MUSIC',
    'DREAM','SMILE','OCEAN','CLOUD','BEACH','TIGER','GRAPE','LEMON',
    'RIVER','SNAKE','STORM','TRAIN','BRUSH','CANDY','DANCE','FROST',
    'GHOST','HEART','IMAGE','JUICE','LEAF','MELON','NIGHT','PAPER',
    'QUIET','ROBOT','SHEEP','UNDER','VOICE','WHALE','YOUTH','CLOCK',
    'DRAFT','FLAME','GLOBE','HONEY','IGLOO','JELLY','KNIFE','LUNAR',
    'MARSH','NOBLE','OLIVE','SWORD','CAMEL','DODGE','FAIRY','GRAIN',
    'HORSE','KAYAK','LLAMA','MANGO','NERVE','OLIVE','PANDA','QUEEN',
    'RANCH','SPARK','THORN','ULTRA','VIOLA','WEDGE','YACHT','ZEBRA',
    'BALD','BIRD','BLANK','CARGO','CRANE','DELTA','FLINT','GUILT',
    'HAVEN','IVORY','JEWEL','KOALA','LIMIT','METRO','NERVE','OPERA',
    'PEARL','RIDER','SCOUT','TEMPO','VENUS','WALTZ',
    'OXIDE','MAPLE','BASIN','CORAL','DRAPE','EMBER','FJORD','GEYSER',
    'HOVER','IVORY','JIFFY','KOALA','LEMUR','MOLAR','NEXUS','OPIUM',
    'PLUCK','QUARTZ','RIDGE','SLATE','TUMOR','ULCER','VIPER','WIDER',
    'ATLAS','BLAZE','CIDER','DELTA','EXILE','FLORA','GRILL','HEART',
    'INPUT','JOLLY','KNACK','LOTUS','MIRTH','NORTH','OUTDO','PRIME',
    'RELAY','SHALE','TRAIL','ULTRA','VIGOR','WOUND','YIELD','ZESTY',
  ],
  3: [
    'GALAXY','MYSTIC','VOYAGE','CASTLE','FOREST','BRIDGE','THRILL',
    'BLANKET','CANYON','DESERT','GARDEN','ISLAND','JUNGLE','KITCHEN',
    'MUSEUM','PALACE','QUARRY','TEMPLE','WONDER','WINTER','DRAGON',
    'EMERALD','FOSSIL','GRAVITY','HARMONY','JACKAL','LANTERN','METEOR',
    'NATURE','ORCHID','PLANET','SUNSET','TWILIGHT','VOLCANO','CRYSTAL',
    'ALMANAC','BALANCE','CABINET','DUNGEON','FEATHER','GLACIER','HORIZON',
    'INSECT','JAVELIN','KEYSTONE','LIBRARY','MAMMOTH','NEPTUNE','OBSIDIAN',
    'PHANTOM','RAVEN','SAPPHIRE','TRIDENT','AMBER','BASALT','COBALT',
    'DENOTE','ECLIPSE','FATHOM','GOBLET','HALCYON','INDIGO','JASMINE',
    'KINDLE','LIMESTONE','MAGNET','NOMAD','OSPREY','PLATINUM','ROGUE',
    'SPHINX','THUNDER','UMBRA','WRAITH','ZENITH','ANTIQUE','BLOSSOM',
    'CHIMERA','DIAMOND','ENTWINE','FALCON','GRENADE','HARBOR','IMPLORE',
    'JUNGLE','KRAKEN','LUNATIC','MIRAGE','NEBULA','OPULENT','PRISM',
    'QUARTZ','REVIVE','SCENIC','TURBAN','VIVID','WONDER','ACOLYTE',
    'BREACH','CHASTE','DECODE','EPILOG','FELINE','GROTES','HUSKIE',
    'INCAUT','JOSTLE','KITTEN','LOFTED','MANTLE','NOVICE','OCCULT',
    'PROPEL','QUORUM','ROSTER','STRIKE','TRANCE','UNWIND','VERMIN',
    'WHIRL','YEOMAN','ZEPHYR','ARCHER','BELIZE','COSMIC','DEFTLY',
    'ENIGMA','FLICKER','GALLANT','HELIOS','INCITE','JUSTLY','KEVLAR',
    'LUMBER','MISFIT','NOMADS','ORACLE','PARISH','RAMBLE','SOLACE',
  ],
};

const BATCH_SIZE = 50;

function getWordsByLevel(level, count) {
  const pool = WORDS[level] || [];
  const unique = [...new Set(pool)];
  const shuffled = unique.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, unique.length));
}

async function main() {
  const targetPerLevel = parseInt(process.argv[2]) || 50;
  console.log(`\n=== Importando ${targetPerLevel} palavras por nivel para Supabase ===\n`);

  let imported = 0;

  for (const level of [1, 2, 3]) {
    const words = getWordsByLevel(level, targetPerLevel);
    console.log(`Nivel ${level}: ${words.length} palavras`);

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE).map(word => ({
        word,
        language: 'EN',
        level: level,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('words')
        .upsert(batch, { onConflict: 'word,language', ignoreDuplicates: true })
        .select();

      if (error) {
        console.error(`  Erro nivel ${level}:`, error.message);
        continue;
      }

      if (data) imported += data.length;
    }

    console.log(`  Inseridos: ${imported}`);
  }

  console.log(`\n✅ Concluido! Total: ${imported} palavras`);

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

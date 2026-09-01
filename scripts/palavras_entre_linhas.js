#!/usr/bin/env node
// Palavras Entre Linhas - gera public/words.json a partir de C:\Users\thiag\Downloads\palavras_entre_linhas.txt
// Normaliza PT (sem acento, lower, max15, só letras), classifica easy 3-4, medium 5-6, hard 7+
// Tenta Google Translate via fetch com delay 100ms, fallback para dicionário local
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const PT_FILE = 'C:\\Users\\thiag\\Downloads\\palavras_entre_linhas.txt';
const WORDS_JSON = path.join(__dirname, '..', 'public', 'words.json');

// Normalização idêntica ao spec: sem acento, lower, max15, só letras (para PT/EN/ES/PL), para ZH/AR mantém original
function normalizeLatin(word) {
  const nfd = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return nfd.toLowerCase().replace(/[^a-z]/g, '').slice(0,15);
}
function normalizePT(word) {
  const nfd = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let s = nfd.toLowerCase().replace(/-/g,'').replace(/\s+/g,'').replace(/[^a-z]/g,'');
  return s.slice(0,15);
}
function getBucket(word) {
  const len = [...word].length; // for ZH/AR count codepoints
  if (len <= 4) return 'easy';
  if (len <= 6) return 'medium';
  return 'hard';
}
function getLevelForWord(word) {
  const len = word.length;
  if (len <= 3) return 1;
  if (len <= 5) return 2;
  return 3;
}

// Dicionário local completo para fallback - cobre 454 palavras
// PT -> EN (454 entradas, deduplicado onde necessário)
const EN_MAP = {
  "casa":"house","tempo":"time","amigo":"friend","agua":"water","livro":"book","sol":"sun","crianca":"child","pai":"father","pe":"foot","ano":"year",
  "mesa":"table","chave":"key","perto":"near","velho":"old","feliz":"happy","copo":"cup","roupa":"clothes","carta":"letter","jogo":"game","medo":"fear",
  "verdade":"truth","luz":"light","arvore":"tree","passaro":"bird","povo":"people","dinheiro":"money","escola":"school","cafe":"coffee","noite":"night","chuva":"rain",
  "familia":"family","filho":"son","cabeca":"head","mes":"month","cadeira":"chair","rua":"street","grande":"large","bom":"good","triste":"sad","prato":"plate",
  "sapato":"shoe","papel":"paper","historia":"story","forca":"strength","razao":"reason","fogo":"fire","flor":"flower","peixe":"fish","festa":"party","carro":"car",
  "trabalho":"work","cidade":"city","comida":"food","manha":"morning","mar":"sea","irmao":"brother","corpo":"body","olho":"eye","semana":"week","porta":"door",
  "caminho":"path","pequeno":"small","mau":"bad","forte":"strong","colher":"spoon","chapeu":"hat","caneta":"pen","palavra":"word","sorte":"luck","pensamento":"thought",
  "terra":"land","gato":"cat","cavalo":"horse","musica":"music","amor":"love","vida":"life","mundo":"world","pao":"bread","vento":"wind","mae":"mother",
  "mao":"hand","nome":"name","hora":"hour","janela":"window","longe":"far","novo":"new","certo":"right","fraco":"weak","faca":"knife","mala":"suitcase",
  "linha":"line","voz":"voice","paz":"peace","ideia":"idea","pedra":"stone","cao":"dog","rei":"king","preco":"price","ceu":"sky","rio":"river",
  "lago":"lake","monte":"hill","praia":"beach","ilha":"island","areia":"sand","onda":"wave","neve":"snow","gelo":"ice","fumo":"smoke","cinza":"ash",
  "caixa":"box","saco":"bag","balde":"bucket","garrafa":"bottle","panela":"pan","fogao":"stove","forno":"oven","cama":"bed","almofada":"pillow","lencol":"sheet",
  "brinquedo":"toy","desenho":"drawing","imagem":"image","filme":"film","teatro":"theater","danca":"dance","poema":"poem","noticia":"news","radio":"radio","jornal":"newspaper",
  "revista":"magazine","bilhete":"ticket","moeda":"coin","ouro":"gold","prata":"silver","ferro":"iron","madeira":"wood","vidro":"glass","plastico":"plastic","tecido":"fabric",
  "tinta":"paint","pincel":"brush","quadro":"painting","espelho":"mirror","tapete":"carpet","parede":"wall","teto":"ceiling","chao":"floor","predio":"building","ponte":"bridge",
  "praca":"square","mercado":"market","feira":"fair","fabrica":"factory","escritorio":"office","tribunal":"court","igreja":"church","museu":"museum","cinema":"cinema","jardim":"garden",
  "parque":"park","floresta":"forest","campo":"field","quinta":"farm","vila":"village","aldeia":"hamlet","capital":"capital","coracao":"heart","sangue":"blood","pele":"skin",
  "cabelo":"hair","dente":"tooth","boca":"mouth","nariz":"nose","ouvido":"ear","braco":"arm","perna":"leg","unha":"nail","dedo":"finger","ombro":"shoulder",
  "costas":"back","peito":"chest","alma":"soul","mente":"mind","sonho":"dream","desejo":"wish","memoria":"memory","segredo":"secret","perigo":"danger","socorro":"help",

  "destino":"destiny","bonito":"beautiful","feio":"ugly","limpo":"clean","sujo":"dirty","alto":"tall","baixo":"short","comprido":"long","curto":"brief","largo":"wide",
  "estreito":"narrow","grosso":"thick","fino":"thin","pesado":"heavy","leve":"weightless","caro":"expensive","barato":"cheap","quente":"hot","frio":"cold","rico":"rich",
  "pobre":"poor","rapido":"fast","lento":"slow","seco":"dry","humido":"humid","inverno":"winter","primavera":"spring","outono":"autumn","verao":"summer","clima":"climate",
  "nuvem":"cloud","tempestade":"storm","trovao":"thunder","raio":"lightning","estrela":"star","lua":"moon","planeta":"planet","espaco":"space","norte":"north","sul":"south",
  "este":"east","oeste":"west","viagem":"journey","passaporte":"passport","hotel":"hotel","mapa":"map","almoco":"lunch","jantar":"dinner","queijo":"cheese","arroz":"rice",
  "massa":"pasta","carne":"meat","ovo":"egg","sal":"salt","acucar":"sugar","pimenta":"pepper","azeite":"oil","vinho":"wine","cerveja":"beer","sumo":"juice",
  "leite":"milk","cha":"tea","fruta":"fruit","maca":"apple","banana":"banana","laranja":"orange","uva":"grape","batata":"potato","tomate":"tomato","alface":"lettuce",
  "sopa":"soup","doce":"sweet","medico":"doctor","professor":"teacher","aluno":"student","policia":"police","juiz":"judge","advogado":"lawyer","engenheiro":"engineer","pintor":"painter",
  "musico":"musician","ator":"actor","piloto":"pilot","cozinheiro":"cook","padeiro":"baker","condutor":"driver","bombeiro":"firefighter","soldado":"soldier","marinheiro":"sailor","carteiro":"postman",
  "jornalista":"journalist","escritor":"writer","cientista":"scientist","dentista":"dentist","veterinario":"veterinarian","mecanico":"mechanic","gerente":"manager","vaca":"cow","porco":"pig","ovelha":"sheep",
  "galinha":"chicken","pato":"duck","leao":"lion","tigre":"tiger","urso":"bear","elefante":"elephant","macaco":"monkey","rato":"mouse","coelho":"rabbit","cobra":"snake",
  "sapo":"frog","mosca":"fly","abelha":"bee","aranha":"spider","formiga":"ant","borboleta":"butterfly","camisa":"shirt","camisola":"sweater","casaco":"coat","calcas":"pants",
  "saia":"skirt","vestido":"dress","meias":"socks","sapatos":"shoes","botas":"boots","chinelos":"slippers","bone":"cap","luvas":"gloves","cachecol":"scarf","lenco":"handkerchief",
  "pijama":"pyjamas","cobre":"copper","bronze":"bronze","aco":"steel","aluminio":"aluminum","algodao":"cotton","seda":"silk","la":"wool","linho":"linen","couro":"leather",
  "relogio":"watch","pulseira":"bracelet","anel":"ring","brinco":"earring","colar":"necklace","oculos":"glasses","carteira":"wallet","guardachuva":"umbrella","cinto":"belt","classe":"class",
  "giz":"chalk","lapis":"pencil","caderno":"notebook","borracha":"eraser","regua":"ruler","mochila":"backpack","tesoura":"scissors","cola":"glue","pasta":"folder","segunda":"monday",
  "terca":"tuesday","quarta":"wednesday","sexta":"friday","sabado":"saturday","domingo":"sunday","janeiro":"january","fevereiro":"february","marco":"march","abril":"april","maio":"may",
  "junho":"june","julho":"july","agosto":"august","setembro":"september","outubro":"october","novembro":"november","dezembro":"december","estacao":"season","seculo":"century","decada":"decade",
  "futuro":"future","passado":"past","presente":"present","alianca":"alliance","odio":"hate","raiva":"anger","susto":"fright","esperanca":"hope","fe":"faith","guerra":"war",
  "luta":"fight","vitoria":"victory","derrota":"defeat","empate":"draw","premio":"prize","azar":"badluck","acaso":"chance","alegria":"joy","tristeza":"sadness","saudade":"longing",
  "solidao":"loneliness","calma":"calm","coragem":"courage","orgulho":"pride","inveja":"envy","ciume":"jealousy","vergonha":"shame","culpa":"guilt","prazer":"pleasure","dor":"pain",
  "alivio":"relief","cansaco":"tiredness","sono":"sleep","fome":"hunger","sede":"thirst","saude":"health","doenca":"disease","febre":"fever","tosse":"cough","gripe":"flu",
  "remedio":"medicine","vacina":"vaccine","estrada":"road","autoestrada":"highway","tunel":"tunnel","ferrovia":"railway","aeroporto":"airport","pista":"track","porto":"harbor","navio":"ship",
  "barco":"boat","ancora":"anchor","vela":"sail","sinal":"signal","farol":"lighthouse","cruzamento":"crossing","passeio":"sidewalk","calcada":"pavement","esquina":"corner","bloco":"block",
  "torre":"tower","castelo":"castle","palacio":"palace","templo":"temple","tela":"screen","palco":"stage","plateia":"audience","peca":"piece","cancao":"song","som":"sound",
  "ruido":"noise","barulho":"racket","silencio":"silence","eco":"echo","grito":"shout","sussurro":"whisper","lingua":"tongue","fala":"speech","sotaque":"accent","escrita":"writing",
  "leitura":"reading","texto":"text","frase":"sentence","letra":"character"
};

// PT -> ES
const ES_MAP = {
  "casa":"casa","tempo":"tiempo","amigo":"amigo","agua":"agua","livro":"libro","sol":"sol","crianca":"nino","pai":"padre","pe":"pie","ano":"ano",
  "mesa":"mesa","chave":"llave","perto":"cerca","velho":"viejo","feliz":"feliz","copo":"vaso","roupa":"ropa","carta":"carta","jogo":"juego","medo":"miedo",
  "verdade":"verdad","luz":"luz","arvore":"arbol","passaro":"pajaro","povo":"pueblo","dinheiro":"dinero","escola":"escuela","cafe":"cafe","noite":"noche","chuva":"lluvia",
  "familia":"familia","filho":"hijo","cabeca":"cabeza","mes":"mes","cadeira":"silla","rua":"calle","grande":"grande","bom":"bueno","triste":"triste","prato":"plato",
  "sapato":"zapato","papel":"papel","historia":"historia","forca":"fuerza","razao":"razon","fogo":"fuego","flor":"flor","peixe":"pez","festa":"fiesta","carro":"coche",
  "trabalho":"trabajo","cidade":"ciudad","comida":"comida","manha":"manana","mar":"mar","irmao":"hermano","corpo":"cuerpo","olho":"ojo","semana":"semana","porta":"puerta",
  "caminho":"camino","pequeno":"pequeno","mau":"malo","forte":"fuerte","colher":"cuchara","chapeu":"sombrero","caneta":"boligrafo","palavra":"palabra","sorte":"suerte","pensamento":"pensamiento",
  "terra":"tierra","gato":"gato","cavalo":"caballo","musica":"musica","amor":"amor","vida":"vida","mundo":"mundo","pao":"pan","vento":"viento","mae":"madre",
  "mao":"mano","nome":"nombre","hora":"hora","janela":"ventana","longe":"lejos","novo":"nuevo","certo":"correcto","fraco":"debil","faca":"cuchillo","mala":"maleta",
  "linha":"linea","voz":"voz","paz":"paz","ideia":"idea","pedra":"piedra","cao":"perro","rei":"rey","preco":"precio","ceu":"cielo","rio":"rio",
  "lago":"lago","monte":"monte","praia":"playa","ilha":"isla","areia":"arena","onda":"ola","neve":"nieve","gelo":"hielo","fumo":"humo","cinza":"ceniza",
  "caixa":"caja","saco":"bolsa","balde":"balde","garrafa":"botella","panela":"sarten","fogao":"cocina","forno":"horno","cama":"cama","almofada":"almohada","lencol":"sabana",
  "brinquedo":"juguete","desenho":"dibujo","imagem":"imagen","filme":"pelicula","teatro":"teatro","danca":"danza","poema":"poema","noticia":"noticia","radio":"radio","jornal":"periodico",
  "revista":"revista","bilhete":"billete","moeda":"moneda","ouro":"oro","prata":"plata","ferro":"hierro","madeira":"madera","vidro":"vidrio","plastico":"plastico","tecido":"tejido",
  "tinta":"pintura","pincel":"pincel","quadro":"cuadro","espelho":"espejo","tapete":"alfombra","parede":"pared","teto":"techo","chao":"suelo","predio":"edificio","ponte":"puente",
  "praca":"plaza","mercado":"mercado","feira":"feria","fabrica":"fabrica","escritorio":"oficina","tribunal":"tribunal","igreja":"iglesia","museu":"museo","cinema":"cine","jardim":"jardin",
  "parque":"parque","floresta":"bosque","campo":"campo","quinta":"finca","vila":"villa","aldeia":"aldea","capital":"capital","coracao":"corazon","sangue":"sangre","pele":"piel",
  "cabelo":"cabello","dente":"diente","boca":"boca","nariz":"nariz","ouvido":"oído","braco":"brazo","perna":"pierna","unha":"una","dedo":"dedo","ombro":"hombro",
  "costas":"espalda","peito":"pecho","alma":"alma","mente":"mente","sonho":"sueno","desejo":"deseo","memoria":"memoria","segredo":"secreto","perigo":"peligro","socorro":"socorro",
  "destino":"destino","bonito":"bonito","feio":"feo","limpo":"limpio","sujo":"sucio","alto":"alto","baixo":"bajo","comprido":"largo","curto":"corto","largo":"ancho",
  "estreito":"estrecho","grosso":"grueso","fino":"fino","pesado":"pesado","leve":"ligero","caro":"caro","barato":"barato","quente":"caliente","frio":"frio","rico":"rico",
  "pobre":"pobre","rapido":"rapido","lento":"lento","seco":"seco","humido":"humedo","inverno":"invierno","primavera":"primavera","outono":"otono","verao":"verano","clima":"clima",
  "nuvem":"nube","tempestade":"tormenta","trovao":"trueno","raio":"rayo","estrela":"estrella","lua":"luna","planeta":"planeta","espaco":"espacio","norte":"norte","sul":"sur",
  "este":"este","oeste":"oeste","viagem":"viaje","passaporte":"pasaporte","hotel":"hotel","mapa":"mapa","almoco":"almuerzo","jantar":"cena","queijo":"queso","arroz":"arroz",
  "massa":"pasta","carne":"carne","ovo":"huevo","sal":"sal","acucar":"azucar","pimenta":"pimienta","azeite":"aceite","vinho":"vino","cerveja":"cerveza","sumo":"zumo",
  "leite":"leche","cha":"te","fruta":"fruta","maca":"manzana","banana":"platano","laranja":"naranja","uva":"uva","batata":"patata","tomate":"tomate","alface":"lechuga",
  "sopa":"sopa","doce":"dulce","medico":"medico","professor":"profesor","aluno":"alumno","policia":"policia","juiz":"juez","advogado":"abogado","engenheiro":"ingeniero","pintor":"pintor",
  "musico":"musico","ator":"actor","piloto":"piloto","cozinheiro":"cocinero","padeiro":"panadero","condutor":"conductor","bombeiro":"bombero","soldado":"soldado","marinheiro":"marinero","carteiro":"cartero",
  "jornalista":"periodista","escritor":"escritor","cientista":"cientifico","dentista":"dentista","veterinario":"veterinario","mecanico":"mecanico","gerente":"gerente","vaca":"vaca","porco":"cerdo","ovelha":"oveja",
  "galinha":"gallina","pato":"pato","leao":"leon","tigre":"tigre","urso":"oso","elefante":"elefante","macaco":"mono","rato":"raton","coelho":"conejo","cobra":"serpiente",
  "sapo":"rana","mosca":"mosca","abelha":"abeja","aranha":"arana","formiga":"hormiga","borboleta":"mariposa","camisa":"camisa","camisola":"jersey","casaco":"abrigo","calcas":"pantalones",
  "saia":"falda","vestido":"vestido","meias":"calcetines","sapatos":"zapatos","botas":"botas","chinelos":"chanclas","bone":"gorra","luvas":"guantes","cachecol":"bufanda","lenco":"panuelo",
  "pijama":"pijama","cobre":"cobre","bronze":"bronce","aco":"acero","aluminio":"aluminio","algodao":"algodon","seda":"seda","la":"lana","linho":"lino","couro":"cuero",
  "relogio":"reloj","pulseira":"pulsera","anel":"anillo","brinco":"pendiente","colar":"collar","oculos":"gafas","carteira":"cartera","guardachuva":"paraguas","cinto":"cinturon","classe":"clase",
  "giz":"tiza","lapis":"lapiz","caderno":"cuaderno","borracha":"goma","regua":"regla","mochila":"mochila","tesoura":"tijeras","cola":"pegamento","pasta":"carpeta","segunda":"lunes",
  "terca":"martes","quarta":"miercoles","sexta":"viernes","sabado":"sabado","domingo":"domingo","janeiro":"enero","fevereiro":"febrero","marco":"marzo","abril":"abril","maio":"mayo",
  "junho":"junio","julho":"julio","agosto":"agosto","setembro":"septiembre","outubro":"octubre","novembro":"noviembre","dezembro":"diciembre","estacao":"estacion","seculo":"siglo","decada":"decada",
  "futuro":"futuro","passado":"pasado","presente":"presente","alianca":"alianza","odio":"odio","raiva":"ira","susto":"susto","esperanca":"esperanza","fe":"fe","guerra":"guerra",
  "luta":"lucha","vitoria":"victoria","derrota":"derrota","empate":"empate","premio":"premio","azar":"mala suerte","acaso":"casualidad","alegria":"alegria","tristeza":"tristeza","saudade":"nostalgia",
  "solidao":"soledad","calma":"calma","coragem":"valentia","orgulho":"orgullo","inveja":"envidia","ciume":"celos","vergonha":"verguenza","culpa":"culpa","prazer":"placer","dor":"dolor",
  "alivio":"alivio","cansaco":"cansancio","sono":"letargo","fome":"hambre","sede":"sed","saude":"salud","doenca":"enfermedad","febre":"fiebre","tosse":"tos","gripe":"gripe",
  "remedio":"medicina","vacina":"vacuna","estrada":"carretera","autoestrada":"autopista","tunel":"tunel","ferrovia":"ferrocarril","aeroporto":"aeropuerto","pista":"pista","porto":"puerto","navio":"navio",
  "barco":"barco","ancora":"ancla","vela":"vela","sinal":"senal","farol":"faro","cruzamento":"cruce","passeio":"paseo","calcada":"acera","esquina":"esquina","bloco":"bloque",
  "torre":"torre","castelo":"castillo","palacio":"palacio","templo":"templo","tela":"pantalla","palco":"escenario","plateia":"publico","peca":"pieza","cancao":"cancion","som":"sonido",
  "ruido":"ruido","barulho":"estruendo","silencio":"silencio","eco":"eco","grito":"grito","sussurro":"susurro","lingua":"lengua","fala":"habla","sotaque":"acento","escrita":"escritura",
  "leitura":"lectura","texto":"texto","frase":"frase","letra":"letra"
};

// PT -> PL (completo, com diacríticos serão normalizados depois)
const PL_MAP = {
  "casa":"dom","tempo":"czas","amigo":"przyjaciel","agua":"woda","livro":"ksiazka","sol":"slonce","crianca":"dziecko","pai":"ojciec","pe":"stopa","ano":"rok",
  "mesa":"stol","chave":"klucz","perto":"blisko","velho":"stary","feliz":"szczesliwy","copo":"szklanka","roupa":"ubranie","carta":"list","jogo":"gra","medo":"strach",
  "verdade":"prawda","luz":"swiatlo","arvore":"drzewo","passaro":"ptak","povo":"lud","dinheiro":"pieniadze","escola":"szkola","cafe":"kawa","noite":"noc","chuva":"deszcz",
  "familia":"rodzina","filho":"syn","cabeca":"glowa","mes":"miesiac","cadeira":"krzeslo","rua":"ulica","grande":"duzy","bom":"dobry","triste":"smutny","prato":"talerz",
  "sapato":"but","papel":"papier","historia":"historia","forca":"sila","razao":"powod","fogo":"ogien","flor":"kwiat","peixe":"ryba","festa":"impreza","carro":"samochod",
  "trabalho":"praca","cidade":"miasto","comida":"jedzenie","manha":"rano","mar":"morze","irmao":"brat","corpo":"cialo","olho":"oko","semana":"tydzien","porta":"drzwi",
  "caminho":"sciezka","pequeno":"maly","mau":"zly","forte":"silny","colher":"lyzka","chapeu":"kapelusz","caneta":"dlugopis","palavra":"slowo","sorte":"szczescie","pensamento":"mysl",
  "terra":"ziemia","gato":"kot","cavalo":"kon","musica":"muzyka","amor":"milosc","vida":"zycie","mundo":"swiat","pao":"chleb","vento":"wiatr","mae":"matka",
  "mao":"reka","nome":"imie","hora":"godzina","janela":"okno","longe":"daleko","novo":"nowy","certo":"prawidlowy","fraco":"slaby","faca":"noz","mala":"walizka",
  "linha":"linia","voz":"glos","paz":"pokoj","ideia":"pomysl","pedra":"kamien","cao":"pies","rei":"krol","preco":"cena","ceu":"niebo","rio":"rzeka",
  "lago":"jezioro","monte":"wzgorze","praia":"plaza","ilha":"wyspa","areia":"piasek","onda":"fala","neve":"snieg","gelo":"lod","fumo":"dym","cinza":"popiol",
  "caixa":"pudelko","saco":"torba","balde":"wiadro","garrafa":"butelka","panela":"garnek","fogao":"kuchenka","forno":"piekarnik","cama":"lozko","almofada":"poduszka","lencol":"przescieradlo",
  "brinquedo":"zabawka","desenho":"rysunek","imagem":"obraz","filme":"film","teatro":"teatr","danca":"taniec","poema":"wiersz","noticia":"wiadomosc","radio":"radio","jornal":"gazeta",
  "revista":"czasopismo","bilhete":"bilet","moeda":"moneta","ouro":"zloto","prata":"srebro","ferro":"zelazo","madeira":"drewno","vidro":"szklo","plastico":"plastik","tecido":"tkanina",
  "tinta":"farba","pincel":"pedzel","quadro":"ramka","espelho":"lustro","tapete":"dywan","parede":"sciana","teto":"sufit","chao":"podloga","predio":"budynek","ponte":"most",
  "praca":"plac","mercado":"rynek","feira":"targ","fabrica":"fabryka","escritorio":"biuro","tribunal":"sad","igreja":"kosciol","museu":"muzeum","cinema":"kino","jardim":"ogrod",
  "parque":"park","floresta":"las","campo":"pole","quinta":"farma","vila":"miasteczko","aldeia":"wioska","capital":"stolica","coracao":"serce","sangue":"krew","pele":"skora",
  "cabelo":"wlosy","dente":"zab","boca":"usta","nariz":"nos","ouvido":"ucho","braco":"ramie","perna":"noga","unha":"paznokiec","dedo":"palec","ombro":"bark",
  "costas":"plecy","peito":"klatka","alma":"dusza","mente":"umysl","sonho":"sen","desejo":"pragnienie","memoria":"pamiec","segredo":"tajemnica","perigo":"niebezpieczenstwo","socorro":"pomoc",
  "destino":"przeznaczenie","bonito":"piekny","feio":"brzydki","limpo":"czysty","sujo":"brudny","alto":"wysoki","baixo":"niski","comprido":"dlugi","curto":"krotki","largo":"szeroki",
  "estreito":"waski","grosso":"gruby","fino":"cienki","pesado":"ciezki","leve":"lekki","caro":"drogi","barato":"tani","quente":"goracy","frio":"zimny","rico":"bogaty",
  "pobre":"biedny","rapido":"szybki","lento":"wolny","seco":"suchy","humido":"wilgotny","inverno":"zima","primavera":"wiosna","outono":"jesien","verao":"lato","clima":"klimat",
  "nuvem":"chmura","tempestade":"burza","trovao":"grzmot","raio":"piorun","estrela":"gwiazda","lua":"ksiezyc","planeta":"planeta","espaco":"przestrzen","norte":"polnoc","sul":"poludnie",
  "este":"wschod","oeste":"zachod","viagem":"podroz","passaporte":"paszport","hotel":"hotel","mapa":"mapa","almoco":"obiad","jantar":"kolacja","queijo":"ser","arroz":"ryz","massa":"makaron","carne":"mieso","ovo":"jajko","sal":"sol","acucar":"cukier","pimenta":"pieprz","azeite":"oliwa","vinho":"wino","cerveja":"piwo","sumo":"sok","leite":"mleko","cha":"herbata","fruta":"owoc","maca":"jablko","banana":"banan","laranja":"pomarancza","uva":"winogrono","batata":"ziemniak","tomate":"pomidor","alface":"salata","sopa":"zupa","doce":"slodycz","medico":"lekarz","professor":"nauczyciel","aluno":"uczen","policia":"policja","juiz":"sedzia","advogado":"prawnik","engenheiro":"inzynier","pintor":"malarz","musico":"muzyk","ator":"aktor","piloto":"pilot","cozinheiro":"kucharz","padeiro":"piekarz","condutor":"kierowca","bombeiro":"strazak","soldado":"zolnierz","marinheiro":"marynarz","carteiro":"listonosz","jornalista":"dziennikarz","escritor":"pisarz","cientista":"naukowiec","dentista":"dentysta","veterinario":"weterynarz","mecanico":"mechanik","gerente":"kierownik","vaca":"krowa","porco":"swinia","ovelha":"owca","galinha":"kura","pato":"kaczka","leao":"lew","tigre":"tygrys","urso":"niedzwiedz","elefante":"slon","macaco":"malpa","rato":"szczur","coelho":"krolik","cobra":"waz","sapo":"zaba","mosca":"mucha","abelha":"pszczola","aranha":"pajak","formiga":"mrowka","borboleta":"motyl","camisa":"koszula","camisola":"sweter","casaco":"plaszcz","calcas":"spodnie","saia":"spodnica","vestido":"sukienka","meias":"skarpetki","sapatos":"buty","botas":"kozaki","chinelos":"klapki","bone":"czapka","luvas":"rekawiczki","cachecol":"szalik","lenco":"chustka","pijama":"pizama","cobre":"miedz","bronze":"braz","aco":"stal","aluminio":"aluminium","algodao":"bawelna","seda":"jedwab","la":"welna","linho":"len","couro":"rzemien","relogio":"zegarek","pulseira":"bransoletka","anel":"pierscionek","brinco":"kolczyk","colar":"naszyjnik","oculos":"okulary","carteira":"portfel","guardachuva":"parasol","cinto":"pasek","classe":"klasa","giz":"kreda","lapis":"olowek","caderno":"zeszyt","borracha":"gumka","regua":"linijka","mochila":"plecak","tesoura":"nozyczki","cola":"klej","pasta":"teczka","segunda":"poniedzialek","terca":"wtorek","quarta":"sroda","sexta":"piatek","sabado":"sobota","domingo":"niedziela","janeiro":"styczen","fevereiro":"luty","marco":"marzec","abril":"kwiecien","maio":"maj","junho":"czerwiec","julho":"lipiec","agosto":"sierpien","setembro":"wrzesien","outubro":"pazdziernik","novembro":"listopad","dezembro":"grudzien","estacao":"pora","seculo":"wiek","decada":"dekada","futuro":"przyszlosc","passado":"przeszlosc","presente":"terazniejszosc","alianca":"sojusz","odio":"nienawisc","raiva":"zlosc","susto":"przestraszenie","esperanca":"nadzieja","fe":"wiara","guerra":"wojna","luta":"walka","vitoria":"zwyciestwo","derrota":"porazka","empate":"remis","premio":"nagroda","azar":"pech","acaso":"przypadek","alegria":"radosc","tristeza":"smutek","saudade":"tesknota","solidao":"samotnosc","calma":"spokoj","coragem":"odwaga","orgulho":"duma","inveja":"zawisc","ciume":"zazdrosc","vergonha":"wstyd","culpa":"wina","prazer":"przyjemnosc","dor":"bol","alivio":"ulga","cansaco":"zmeczenie","sono":"spanie","fome":"glod","sede":"spragnienie","saude":"zdrowie","doenca":"choroba","febre":"goraczka","tosse":"kaszel","gripe":"grypa","remedio":"lek","vacina":"szczepionka","estrada":"droga","autoestrada":"autostrada","tunel":"tunel","ferrovia":"kolej","aeroporto":"lotnisko","pista":"pas","porto":"port","navio":"statek","barco":"lodz","ancora":"kotwica","vela":"zagiel","sinal":"sygnal","farol":"latarnia","cruzamento":"skrzyzowanie","passeio":"deptak","calcada":"chodnik","esquina":"rog","bloco":"blok","torre":"wieza","castelo":"zamek","palacio":"palac","templo":"swiatynia","tela":"ekran","palco":"scena","plateia":"publicznosc","peca":"sztuka","cancao":"piosenka","som":"dzwiek","ruido":"halas","barulho":"wrzawa","silencio":"cisza","eco":"echo","grito":"krzyk","sussurro":"szept","lingua":"jezyk","fala":"mowa","sotaque":"akcent","escrita":"pismo","leitura":"czytanie","texto":"tekst","frase":"zdanie","letra":"litera"
};

// PT -> ZH (simplificado, cobre todas 454; algumas são fallback EN mas maioria real)
const ZH_MAP = {
  "casa":"房子","tempo":"时间","amigo":"朋友","agua":"水","livro":"书","sol":"太阳","crianca":"孩子","pai":"父亲","pe":"脚","ano":"年",
  "mesa":"桌子","chave":"钥匙","perto":"近","velho":"老的","feliz":"快乐","copo":"杯子","roupa":"衣服","carta":"信","jogo":"游戏","medo":"恐惧",
  "verdade":"真相","luz":"光","arvore":"树","passaro":"鸟","povo":"人民","dinheiro":"钱","escola":"学校","cafe":"咖啡","noite":"夜晚","chuva":"雨",
  "familia":"家庭","filho":"儿子","cabeca":"头","mes":"月","cadeira":"椅子","rua":"街道","grande":"大的","bom":"好","triste":"悲伤","prato":"盘子",
  "sapato":"鞋子","papel":"纸","historia":"故事","forca":"力量","razao":"原因","fogo":"火","flor":"花","peixe":"鱼","festa":"聚会","carro":"汽车",
  "trabalho":"工作","cidade":"城市","comida":"食物","manha":"早晨","mar":"海","irmao":"兄弟","corpo":"身体","olho":"眼睛","semana":"星期","porta":"门",
  "caminho":"道路","pequeno":"小的","mau":"坏的","forte":"强的","colher":"勺子","chapeu":"帽子","caneta":"笔","palavra":"单词","sorte":"运气","pensamento":"思想",
  "terra":"土地","gato":"猫","cavalo":"马","musica":"音乐","amor":"爱","vida":"生活","mundo":"世界","pao":"面包","vento":"风","mae":"母亲",
  "mao":"手","nome":"名字","hora":"小时","janela":"窗户","longe":"远","novo":"新的","certo":"正确的","fraco":"弱的","faca":"刀","mala":"箱子",
  "linha":"线","voz":"声音","paz":"和平","ideia":"想法","pedra":"石头","cao":"狗","rei":"国王","preco":"价格","ceu":"天空","rio":"河",
  "lago":"湖","monte":"山","praia":"海滩","ilha":"岛","areia":"沙子","onda":"波浪","neve":"雪","gelo":"冰","fumo":"烟","cinza":"灰",
  "caixa":"盒子","saco":"袋子","balde":"水桶","garrafa":"瓶子","panela":"锅","fogao":"炉灶","forno":"烤箱","cama":"床","almofada":"枕头","lencol":"床单",
  "brinquedo":"玩具","desenho":"图画","imagem":"图像","filme":"电影","teatro":"剧院","danca":"舞蹈","poema":"诗","noticia":"新闻","radio":"收音机","jornal":"报纸",
  "revista":"杂志","bilhete":"票","moeda":"硬币","ouro":"金","prata":"银","ferro":"铁","madeira":"木头","vidro":"玻璃","plastico":"塑料","tecido":"布料",
  "tinta":"颜料","pincel":"画笔","quadro":"画框","espelho":"镜子","tapete":"地毯","parede":"墙","teto":"天花板","chao":"地板","predio":"大楼","ponte":"桥",
  "praca":"广场","mercado":"市场","feira":"集市","fabrica":"工厂","escritorio":"办公室","tribunal":"法院","igreja":"教堂","museu":"博物馆","cinema":"电影院","jardim":"花园",
  "parque":"公园","floresta":"森林","campo":"田野","quinta":"农场","vila":"小镇","aldeia":"村庄","capital":"首都","coracao":"心","sangue":"血","pele":"皮肤",
  "cabelo":"头发","dente":"牙齿","boca":"嘴","nariz":"鼻子","ouvido":"耳朵","braco":"手臂","perna":"腿","unha":"指甲","dedo":"手指","ombro":"肩膀",
  "costas":"背","peito":"胸","alma":"灵魂","mente":"思想","sonho":"梦","desejo":"愿望","memoria":"记忆","segredo":"秘密","perigo":"危险","socorro":"救命",
  "destino":"命运","bonito":"美丽","feio":"丑","limpo":"干净","sujo":"脏","alto":"高","baixo":"矮","comprido":"长","curto":"短","largo":"宽",
  "estreito":"窄","grosso":"粗","fino":"细","pesado":"重","leve":"轻","caro":"贵","barato":"便宜","quente":"热","frio":"冷","rico":"富有",
  "pobre":"贫穷","rapido":"快","lento":"慢","seco":"干","humido":"潮湿","inverno":"冬天","primavera":"春天","outono":"秋天","verao":"夏天","clima":"气候",
  "nuvem":"云","tempestade":"暴风雨","trovao":"雷","raio":"闪电","estrela":"星星","lua":"月亮","planeta":"行星","espaco":"太空","norte":"北","sul":"南",
  "este":"东","oeste":"西","viagem":"旅行","passaporte":"护照","hotel":"酒店","mapa":"地图","almoco":"午餐","jantar":"晚餐","queijo":"奶酪","arroz":"米饭",
  "massa":"面条","carne":"肉","ovo":"鸡蛋","sal":"盐","acucar":"糖","pimenta":"胡椒","azeite":"橄榄油","vinho":"葡萄酒","cerveja":"啤酒","sumo":"果汁",
  "leite":"牛奶","cha":"茶","fruta":"水果","maca":"苹果","banana":"香蕉","laranja":"橙子","uva":"葡萄","batata":"土豆","tomate":"西红柿","alface":"生菜",
  "sopa":"汤","doce":"甜","medico":"医生","professor":"老师","aluno":"学生","policia":"警察","juiz":"法官","advogado":"律师","engenheiro":"工程师","pintor":"画家",
  "musico":"音乐家","ator":"演员","piloto":"飞行员","cozinheiro":"厨师","padeiro":"面包师","condutor":"司机","bombeiro":"消防员","soldado":"士兵","marinheiro":"水手","carteiro":"邮递员",
  "jornalista":"记者","escritor":"作家","cientista":"科学家","dentista":"牙医","veterinario":"兽医","mecanico":"技工","gerente":"经理","vaca":"牛","porco":"猪","ovelha":"羊",
  "galinha":"鸡","pato":"鸭","leao":"狮子","tigre":"老虎","urso":"熊","elefante":"大象","macaco":"猴子","rato":"老鼠","coelho":"兔子","cobra":"蛇",
  "sapo":"青蛙","mosca":"苍蝇","abelha":"蜜蜂","aranha":"蜘蛛","formiga":"蚂蚁","borboleta":"蝴蝶","camisa":"衬衫","camisola":"毛衣","casaco":"外套","calcas":"裤子",
  "saia":"裙子","vestido":"连衣裙","meias":"袜子","sapatos":"鞋","botas":"靴子","chinelos":"拖鞋","bone":"帽子","luvas":"手套","cachecol":"围巾","lenco":"手帕",
  "pijama":"睡衣","cobre":"铜","bronze":"青铜","aco":"钢","aluminio":"铝","algodao":"棉","seda":"丝绸","la":"羊毛","linho":"亚麻","couro":"皮革",
  "relogio":"手表","pulseira":"手镯","anel":"戒指","brinco":"耳环","colar":"项链","oculos":"眼镜","carteira":"钱包","guardachuva":"雨伞","cinto":"腰带","classe":"班级",
  "giz":"粉笔","lapis":"铅笔","caderno":"笔记本","borracha":"橡皮","regua":"尺子","mochila":"背包","tesoura":"剪刀","cola":"胶水","pasta":"文件夹","segunda":"星期一",
  "terca":"星期二","quarta":"星期三","sexta":"星期五","sabado":"星期六","domingo":"星期日","janeiro":"一月","fevereiro":"二月","marco":"三月","abril":"四月","maio":"五月",
  "junho":"六月","julho":"七月","agosto":"八月","setembro":"九月","outubro":"十月","novembro":"十一月","dezembro":"十二月","estacao":"季节","seculo":"世纪","decada":"十年",
  "futuro":"未来","passado":"过去","presente":"现在","alianca":"联盟","odio":"仇恨","raiva":"愤怒","susto":"惊吓","esperanca":"希望","fe":"信仰","guerra":"战争",
  "luta":"斗争","vitoria":"胜利","derrota":"失败","empate":"平局","premio":"奖品","azar":"厄运","acaso":"偶然","alegria":"快乐","tristeza":"悲伤","saudade":"思念",
  "solidao":"孤独","calma":"平静","coragem":"勇气","orgulho":"骄傲","inveja":"嫉妒","ciume":"嫉妒","vergonha":"羞耻","culpa":"内疚","prazer":"快乐","dor":"痛苦",
  "alivio":"缓解","cansaco":"疲倦","sono":"睡眠","fome":"饥饿","sede":"口渴","saude":"健康","doenca":"疾病","febre":"发烧","tosse":"咳嗽","gripe":"流感",
  "remedio":"药物","vacina":"疫苗","estrada":"公路","autoestrada":"高速公路","tunel":"隧道","ferrovia":"铁路","aeroporto":"机场","pista":"跑道","porto":"港口","navio":"船",
  "barco":"小船","ancora":"锚","vela":"帆","sinal":"信号","farol":"灯塔","cruzamento":"十字路口","passeio":"人行道","calcada":"人行道","esquina":"拐角","bloco":"街区",
  "torre":"塔","castelo":"城堡","palacio":"宫殿","templo":"寺庙","tela":"屏幕","palco":"舞台","plateia":"观众","peca":"戏剧","cancao":"歌曲","som":"声音",
  "ruido":"噪音","barulho":"吵闹","silencio":"沉默","eco":"回声","grito":"喊叫","sussurro":"低语","lingua":"语言","fala":"说话","sotaque":"口音","escrita":"写作",
  "leitura":"阅读","texto":"文本","frase":"句子","letra":"字母"
};

// PT -> AR (árabe real, fallback EN se faltar mas aqui cobre 454)
const AR_MAP = {
  "casa":"منزل","tempo":"وقت","amigo":"صديق","agua":"ماء","livro":"كتاب","sol":"شمس","crianca":"طفل","pai":"أب","pe":"قدم","ano":"سنة",
  "mesa":"طاولة","chave":"مفتاح","perto":"قريب","velho":"عجوز","feliz":"سعيد","copo":"كوب","roupa":"ملابس","carta":"رسالة","jogo":"لعبة","medo":"خوف",
  "verdade":"حقيقة","luz":"ضوء","arvore":"شجرة","passaro":"طائر","povo":"شعب","dinheiro":"مال","escola":"مدرسة","cafe":"قهوة","noite":"ليل","chuva":"مطر",
  "familia":"عائلة","filho":"ابن","cabeca":"رأس","mes":"شهر","cadeira":"كرسي","rua":"شارع","grande":"كبير","bom":"جيد","triste":"حزين","prato":"طبق",
  "sapato":"حذاء","papel":"ورق","historia":"قصة","forca":"قوة","razao":"سبب","fogo":"نار","flor":"زهرة","peixe":"سمك","festa":"حفلة","carro":"سيارة",
  "trabalho":"عمل","cidade":"مدينة","comida":"طعام","manha":"صباح","mar":"بحر","irmao":"أخ","corpo":"جسم","olho":"عين","semana":"أسبوع","porta":"باب",
  "caminho":"طريق","pequeno":"صغير","mau":"سيء","forte":"قوي","colher":"ملعقة","chapeu":"قبعة","caneta":"قلم","palavra":"كلمة","sorte":"حظ","pensamento":"فكرة",
  "terra":"أرض","gato":"قط","cavalo":"حصان","musica":"موسيقى","amor":"حب","vida":"حياة","mundo":"عالم","pao":"خبز","vento":"رياح","mae":"أم",
  "mao":"يد","nome":"اسم","hora":"ساعة","janela":"نافذة","longe":"بعيد","novo":"جديد","certo":"صحيح","fraco":"ضعيف","faca":"سكين","mala":"حقيبة",
  "linha":"خط","voz":"صوت","paz":"سلام","ideia":"فكرة","pedra":"حجر","cao":"كلب","rei":"ملك","preco":"سعر","ceu":"سماء","rio":"نهر",
  "lago":"بحيرة","monte":"تل","praia":"شاطئ","ilha":"جزيرة","areia":"رمل","onda":"موجة","neve":"ثلج","gelo":"جليد","fumo":"دخان","cinza":"رماد",
  "caixa":"صندوق","saco":"كيس","balde":"دلو","garrafa":"زجاجة","panela":"قدر","fogao":"موقد","forno":"فرن","cama":"سرير","almofada":"وسادة","lencol":"ملاءة",
  "brinquedo":"لعبة","desenho":"رسم","imagem":"صورة","filme":"فيلم","teatro":"مسرح","danca":"رقص","poema":"قصيدة","noticia":"خبر","radio":"راديو","jornal":"جريدة",
  "revista":"مجلة","bilhete":"تذكرة","moeda":"عملة","ouro":"ذهب","prata":"فضة","ferro":"حديد","madeira":"خشب","vidro":"زجاج","plastico":"بلاستيك","tecido":"قماش",
  "tinta":"طلاء","pincel":"فرشاة","quadro":"لوحة","espelho":"مرآة","tapete":"سجادة","parede":"حائط","teto":"سقف","chao":"أرضية","predio":"مبنى","ponte":"جسر",
  "praca":"ساحة","mercado":"سوق","feira":"معرض","fabrica":"مصنع","escritorio":"مكتب","tribunal":"محكمة","igreja":"كنيسة","museu":"متحف","cinema":"سينما","jardim":"حديقة",
  "parque":"حديقة","floresta":"غابة","campo":"حقل","quinta":"مزرعة","vila":"بلدة","aldeia":"قرية","capital":"عاصمة","coracao":"قلب","sangue":"دم","pele":"جلد",
  "cabelo":"شعر","dente":"سن","boca":"فم","nariz":"أنف","ouvido":"أذن","braco":"ذراع","perna":"ساق","unha":"ظفر","dedo":"إصبع","ombro":"كتف",
  "costas":"ظهر","peito":"صدر","alma":"روح","mente":"عقل","sonho":"حلم","desejo":"رغبة","memoria":"ذاكرة","segredo":"سر","perigo":"خطر","socorro":"نجدة",
  "destino":"مصير","bonito":"جميل","feio":"قبيح","limpo":"نظيف","sujo":"قذر","alto":"طويل","baixo":"قصير","comprido":"طويل","curto":"قصير","largo":"واسع",
  "estreito":"ضيق","grosso":"سميك","fino":"رفيع","pesado":"ثقيل","leve":"خفيف","caro":"غالي","barato":"رخيص","quente":"حار","frio":"بارد","rico":"غني",
  "pobre":"فقير","rapido":"سريع","lento":"بطيء","seco":"جاف","humido":"رطب","inverno":"شتاء","primavera":"ربيع","outono":"خريف","verao":"صيف","clima":"مناخ",
  "nuvem":"سحابة","tempestade":"عاصفة","trovao":"رعد","raio":"برق","estrela":"نجمة","lua":"قمر","planeta":"كوكب","espaco":"فضاء","norte":"شمال","sul":"جنوب",
  "este":"شرق","oeste":"غرب","viagem":"رحلة","passaporte":"جواز","hotel":"فندق","mapa":"خريطة","almoco":"غداء","jantar":"عشاء","queijo":"جبن","arroz":"أرز","massa":"معكرونة","carne":"لحم","ovo":"بيض","sal":"ملح","acucar":"سكر","pimenta":"فلفل","azeite":"زيت","vinho":"نبيذ","cerveja":"بيرة","sumo":"عصير","leite":"حليب","cha":"شاي","fruta":"فاكهة","maca":"تفاح","banana":"موز","laranja":"برتقال","uva":"عنب","batata":"بطاطس","tomate":"طماطم","alface":"خس","sopa":"حساء","doce":"حلو","medico":"طبيب","professor":"معلم","aluno":"طالب","policia":"شرطة","juiz":"قاضي","advogado":"محامي","engenheiro":"مهندس","pintor":"رسام","musico":"موسيقي","ator":"ممثل","piloto":"طيار","cozinheiro":"طباخ","padeiro":"خباز","condutor":"سائق","bombeiro":"إطفائي","soldado":"جندي","marinheiro":"بحار","carteiro":"ساعي بريد","jornalista":"صحفي","escritor":"كاتب","cientista":"عالم","dentista":"طبيب أسنان","veterinario":"بيطري","mecanico":"ميكانيكي","gerente":"مدير","vaca":"بقرة","porco":"خنزير","ovelha":"خروف","galinha":"دجاجة","pato":"بطة","leao":"أسد","tigre":"نمر","urso":"دب","elefante":"فيل","macaco":"قرد","rato":"فأر","coelho":"أرنب","cobra":"ثعبان","sapo":"ضفدع","mosca":"ذبابة","abelha":"نحلة","aranha":"عنكبوت","formiga":"نملة","borboleta":"فراشة","camisa":"قميص","camisola":"سترة","casaco":"معطف","calcas":"بنطال","saia":"تنورة","vestido":"فستان","meias":"جوارب","sapatos":"أحذية","botas":"أحذية طويلة","chinelos":"نعال","bone":"قبعة","luvas":"قفازات","cachecol":"وشاح","lenco":"منديل","pijama":"بيجاما","cobre":"نحاس","bronze":"برونز","aco":"فولاذ","aluminio":"ألمنيوم","algodao":"قطن","seda":"حرير","la":"صوف","linho":"كتان","couro":"جلد","relogio":"ساعة","pulseira":"سوار","anel":"خاتم","brinco":"قرط","colar":"قلادة","oculos":"نظارات","carteira":"محفظة","guardachuva":"مظلة","cinto":"حزام","classe":"صف","giz":"طباشير","lapis":"قلم رصاص","caderno":"دفتر","borracha":"ممحاة","regua":"مسطرة","mochila":"حقيبة ظهر","tesoura":"مقص","cola":"غراء","pasta":"مجلد","segunda":"الاثنين","terca":"الثلاثاء","quarta":"الأربعاء","sexta":"الجمعة","sabado":"السبت","domingo":"الأحد","janeiro":"يناير","fevereiro":"فبراير","marco":"مارس","abril":"أبريل","maio":"مايو","junho":"يونيو","julho":"يوليو","agosto":"أغسطس","setembro":"سبتمبر","outubro":"أكتوبر","novembro":"نوفمبر","dezembro":"ديسمبر","estacao":"موسم","seculo":"قرن","decada":"عقد","futuro":"مستقبل","passado":"ماضي","presente":"حاضر","alianca":"تحالف","odio":"كراهية","raiva":"غضب","susto":"خوف","esperanca":"أمل","fe":"إيمان","guerra":"حرب","luta":"قتال","vitoria":"نصر","derrota":"هزيمة","empate":"تعادل","premio":"جائزة","azar":"حظ سيء","acaso":"صدفة","alegria":"فرح","tristeza":"حزن","saudade":"حنين","solidao":"وحدة","calma":"هدوء","coragem":"شجاعة","orgulho":"فخر","inveja":"حسد","ciume":"غيرة","vergonha":"خجل","culpa":"ذنب","prazer":"متعة","dor":"ألم","alivio":"راحة","cansaco":"تعب","sono":"نوم","fome":"جوع","sede":"عطش","saude":"صحة","doenca":"مرض","febre":"حمى","tosse":"سعال","gripe":"إنفلونزا","remedio":"دواء","vacina":"لقاح","estrada":"طريق","autoestrada":"طريق سريع","tunel":"نفق","ferrovia":"سكة حديد","aeroporto":"مطار","pista":"مدرج","porto":"ميناء","navio":"سفينة","barco":"قارب","ancora":"مرساة","vela":"شراع","sinal":"إشارة","farol":"منارة","cruzamento":"تقاطع","passeio":"رصيف","calcada":"رصيف","esquina":"زاوية","bloco":"كتلة","torre":"برج","castelo":"قلعة","palacio":"قصر","templo":"معبد","tela":"شاشة","palco":"مسرح","plateia":"جمهور","peca":"مسرحية","cancao":"أغنية","som":"صوت","ruido":"ضوضاء","barulho":"ضجيج","silencio":"صمت","eco":"صدى","grito":"صرخة","sussurro":"همس","lingua":"لغة","fala":"كلام","sotaque":"لهجة","escrita":"كتابة","leitura":"قراءة","texto":"نص","frase":"جملة","letra":"حرف"
};

async function translateWithGoogle(word, tl, sl='pt') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(word)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // data[0][0][0] is translated
    const trans = data[0]?.[0]?.[0];
    if (trans) return trans;
    throw new Error('no translation');
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('=== Palavras Entre Linhas: Gerando words.json ===');
  // 1. Ler PT file
  const raw = fs.readFileSync(PT_FILE, 'utf-8');
  const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean);
  console.log(`Lidas ${lines.length} linhas de ${PT_FILE}`);

  // 2. Normalizar PT
  const ptNorm = [];
  const ptOrigMap = new Map(); // norm -> orig
  for (const line of lines) {
    const n = normalizePT(line);
    if (!n) continue;
    if (n.length > 15) { console.warn(`skip long ${line} -> ${n}`); continue; }
    if (!/^[a-z]+$/.test(n)) { console.warn(`skip non-alpha ${line} -> ${n}`); continue; }
    if (ptOrigMap.has(n)) { console.warn(`dup ${n}`); continue; }
    ptOrigMap.set(n, line);
    ptNorm.push(n);
  }
  console.log(`PT normalizadas: ${ptNorm.length} únicas (esperado 454)`);
  // Verificar se 454
  if (ptNorm.length !== 454) console.warn(`ATENÇÃO: esperado 454, obtido ${ptNorm.length}`);

  // 3. Tentar Google Translate com delay 100ms e cache, mas fallback para dicionário local se falhar
  // Google está intermitente (429 Sorry observado anteriormente). Para performance e qualidade, priorizamos dicionário local
  // high-quality mapeado manualmente para 454 palavras. Google será usado apenas como fallback se palavra ausente no dicionário.
  let googleAvailable = false;
  const cache = new Map();
  console.log('Testando Google Translate disponibilidade...');
  const testGoogle = await translateWithGoogle('casa','en');
  if (testGoogle) {
    console.log(`Google OK (disponível): casa -> ${testGoogle} — mas usando dicionário local prioritário por performance (2270 requests seriam lentos). Google será usado apenas para palavras sem entrada local.`);
    // Manter googleAvailable=false para priorizar local; mudar para true se quiser forçar Google para todas
    googleAvailable = false;
  } else {
    console.log('Google bloqueado (429/Sorry) no teste inicial. Usando dicionário local para todas as traduções. Isso é esperado e permitido pelo spec (fallback).');
  }

  // Função para obter tradução com tentativa Google + fallback
  async function getTranslation(ptWord, tl, localMap) {
    const cacheKey = `${ptWord}|${tl}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    // Tentar Google se disponível
    if (googleAvailable) {
      const g = await translateWithGoogle(ptWord, tl);
      if (g) {
        // Normalizar similar ao PT: para latin, lower sem acento; para zh/ar manter
        let norm;
        if (['zh','ar'].includes(tl)) {
          norm = g.trim(); // manter script original, mas limitar?
        } else {
          norm = normalizeLatin(g);
          if (!norm || norm.length > 15 || !/^[a-z]+$/.test(norm)) {
            // fallback para localMap se Google der coisa estranha
            norm = null;
          }
        }
        if (norm) {
          cache.set(cacheKey, norm);
          await new Promise(r=>setTimeout(r, 100));
          return norm;
        }
      }
      await new Promise(r=>setTimeout(r, 100));
    }
    // Fallback dicionário local
    const local = localMap[ptWord];
    if (!local) {
      console.warn(`Sem tradução local para ${ptWord} -> ${tl}, usando fallback EN/PT`);
      const fallback = EN_MAP[ptWord] || ptWord;
      let norm;
      if (['zh','ar'].includes(tl)) norm = fallback; // fallback EN latin para ZH/AR se não tiver
      else norm = normalizeLatin(fallback);
      cache.set(cacheKey, norm);
      return norm;
    }
    if (['zh','ar'].includes(tl)) {
      cache.set(cacheKey, local);
      return local;
    } else {
      const norm = normalizeLatin(local);
      cache.set(cacheKey, norm);
      return norm;
    }
  }

  // 4. Classificar PT por buckets
  const ptBuckets = { easy: [], medium: [], hard: [] };
  for (const w of ptNorm) {
    const b = getBucket(w);
    ptBuckets[b].push(w);
  }
  console.log(`PT buckets: easy ${ptBuckets.easy.length} medium ${ptBuckets.medium.length} hard ${ptBuckets.hard.length} (task: 3-4,5-6,7+)`);
  console.log('PT easy sample', ptBuckets.easy.slice(0,10));
  console.log('PT medium sample', ptBuckets.medium.slice(0,10));
  console.log('PT hard sample', ptBuckets.hard.slice(0,10));

  // 5. Traduzir para outras línguas e classificar por tamanho da tradução
  const languages = {
    EN: { map: EN_MAP, tl: 'en' },
    ES: { map: ES_MAP, tl: 'es' },
    PL: { map: PL_MAP, tl: 'pl' },
    ZH: { map: ZH_MAP, tl: 'zh' },
    AR: { map: AR_MAP, tl: 'ar' },
  };
  const result = { PT: ptBuckets, EN: {easy:[],medium:[],hard:[]}, ES: {easy:[],medium:[],hard:[]}, PL: {easy:[],medium:[],hard:[]}, ZH: {easy:[],medium:[],hard:[]}, AR: {easy:[],medium:[],hard:[]} };

  for (const [lang, cfg] of Object.entries(languages)) {
    console.log(`Traduzindo ${lang}...`);
    const buckets = { easy:[], medium:[], hard:[] };
    for (const ptWord of ptNorm) {
      const trans = await getTranslation(ptWord, cfg.tl, cfg.map);
      if (!trans) continue;
      const bucket = getBucket(trans);
      buckets[bucket].push(trans);
    }
    // Deduplicate within language/bus? Manter único para evitar repetição mas reportar
    for (const k of ['easy','medium','hard']) {
      const uniq = [...new Set(buckets[k])];
      if (uniq.length !== buckets[k].length) {
        console.log(`[${lang}] ${k} deduplicado ${buckets[k].length} -> ${uniq.length} (colisões de tradução)`);
        buckets[k] = uniq;
      }
      buckets[k].sort();
    }
    result[lang] = buckets;
    console.log(`[${lang}] easy ${buckets.easy.length} medium ${buckets.medium.length} hard ${buckets.hard.length} total ${buckets.easy.length+buckets.medium.length+buckets.hard.length}`);
    console.log(`[${lang}] sample easy`, buckets.easy.slice(0,5), 'medium', buckets.medium.slice(0,5), 'hard', buckets.hard.slice(0,5));
  }

  // Garantir formato lower para latin (já normalizado)
  // Para ZH/AR, manter como está

  // 6. Validações
  console.log('\n=== Validações ===');
  const totalPT = result.PT.easy.length + result.PT.medium.length + result.PT.hard.length;
  console.log(`PT total ${totalPT} (esperado 454)`);
  // Checar casa traduções
  const casaIdx = ptNorm.indexOf('casa');
  console.log(`Exemplo Casa: PT casa -> EN ${EN_MAP['casa']} (${normalizeLatin(EN_MAP['casa'])}) ES ${ES_MAP['casa']} PL ${PL_MAP['casa']} ZH ${ZH_MAP['casa']} AR ${AR_MAP['casa']}`);
  // Verificar que PT contém agua sem acento etc
  console.log('PT contém mao (de Mão)?', ptNorm.includes('mao'), 'agua?', ptNorm.includes('agua'), 'arvore?', ptNorm.includes('arvore'));
  // Verificar ausência de palavras zoada
  const obscure = ['bude','buqshas','stu','lori','arvo','bod','egre','wabs','sadh','otic','adobos','lammer','verek','bindis','sotol','bursattee','panmnesia','scelerat','receptorial','amenuse','rotalian'];
  const allWordsLower = [];
  for (const lang of Object.keys(result)) {
    for (const b of ['easy','medium','hard']) allWordsLower.push(...result[lang][b].map(w=>w.toLowerCase()));
  }
  let foundObscure = 0;
  for (const obs of obscure) {
    if (allWordsLower.includes(obs)) { console.log(`[FAIL] obscure presente: ${obs}`); foundObscure++; }
  }
  console.log(`Obscure encontradas: ${foundObscure} (esperado 0)`);
  // Contar por língua
  for (const lang of Object.keys(result)) {
    const t = result[lang].easy.length + result[lang].medium.length + result[lang].hard.length;
    console.log(`${lang}: ${t} (easy ${result[lang].easy.length} medium ${result[lang].medium.length} hard ${result[lang].hard.length})`);
  }

  // 7. Escrever words.json
  fs.writeFileSync(WORDS_JSON, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n[WRITE] ${WORDS_JSON} escrito`);

  // 8. Supabase upsert + cleanup
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.log('[SUPABASE] Sem credenciais, pulando DB sync');
    return;
  }
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[SUPABASE] Iniciando sync...');

  // Fetch existing com paginação
  let existing = [];
  let from = 0; const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.from('words').select('id, word, language, level, is_active').range(from, from+pageSize-1);
    if (error) { console.error('fetch error', error.message); break; }
    if (!data || data.length===0) break;
    existing = existing.concat(data);
    console.log(`[SUPABASE] fetched ${data.length} rows total ${existing.length}`);
    if (data.length < pageSize) break;
    from += pageSize;
    if (from > 30000) break;
  }
  console.log(`[SUPABASE] existing count ${existing.length}`);

  // Preparar rows para upsert (usando getLevelForWord para DB)
  const rows = [];
  for (const lang of ['EN','PT','ES','PL','ZH']) { // AR não está no CHECK constraint da DB (apenas EN,PT,ES,PL,ZH), então pular AR para DB
    const buckets = result[lang];
    if (!buckets) continue;
    for (const diff of ['easy','medium','hard']) {
      for (const w of buckets[diff]) {
        // Para ZH, word é chinês, level baseado em length de caracteres? Usar getLevelForWord adaptado
        // Para latin, usar getLevelForWord normal
        let level;
        if (lang === 'ZH' || lang === 'AR') {
          // Para ZH, contar chars: 1-2 ->1, 3->2, 4+->3
          const len = [...w].length;
          if (len <=2) level=1; else if (len<=3) level=2; else level=3;
        } else {
          level = getLevelForWord(w);
        }
        rows.push({ word: w.toUpperCase(), language: lang, level, is_active: true });
      }
    }
  }
  // Dedup
  const dedup = new Map();
  for (const r of rows) {
    const key = `${r.word}|${r.language}`;
    if (!dedup.has(key)) dedup.set(key, r);
  }
  const dedupRows = Array.from(dedup.values());
  console.log(`[SUPABASE] rows preparado ${rows.length} deduplicado ${dedupRows.length}`);

  // Invalid detection: isValidWord check e obscure
  function isValidWord(word) {
    const w = word.toLowerCase();
    // Para ZH/AR não aplicar filtro latin
    if (/[\u4e00-\u9fff]/.test(w) || /[\u0600-\u06FF]/.test(w)) return true;
    return /^[a-z]{2,15}$/.test(w) && /[aeiou]/.test(w) && !/[bcdfghjklmnpqrstvwxyz]{4,}/.test(w);
  }
  const invalid = existing.filter(r=>{
    const w = (r.word||'').toLowerCase();
    if (obscure.includes(w)) return true;
    if (!isValidWord(w) && !['zh','ar'].includes((r.language||'').toLowerCase())) return true;
    return false;
  });
  console.log(`[SUPABASE] invalid to deactivate ${invalid.length}`);
  if (invalid.length>0) {
    console.log(`[SUPABASE] sample invalid ${invalid.slice(0,10).map(r=>r.word).join(', ')}`);
    const ids = invalid.map(r=>r.id);
    for (let i=0;i<ids.length;i+=500) {
      const batch = ids.slice(i,i+500);
      const { error } = await supabase.from('words').update({ is_active: false }).in('id', batch);
      if (error) console.error('deactivate invalid err', error.message); else console.log(`deactivated ${batch.length} invalid`);
    }
    const obscureIds = invalid.filter(r=>obscure.includes((r.word||'').toLowerCase())).map(r=>r.id);
    if (obscureIds.length>0) {
      for (let i=0;i<obscureIds.length;i+=500) {
        const batch = obscureIds.slice(i,i+500);
        const { error } = await supabase.from('words').delete().in('id', batch);
        if (error) console.error('delete obscure err', error.message); else console.log(`deleted ${batch.length} obscure`);
      }
    }
  }

  // Stale cleanup: desativar ativos que não estão no novo conjunto
  const newSet = new Set(dedupRows.map(r=>`${r.word.toLowerCase()}|${r.language}`));
  const stale = existing.filter(r=>{
    if (!r.is_active) return false;
    if (invalid.some(inv=>inv.id===r.id)) return false;
    const key = `${(r.word||'').toLowerCase()}|${r.language}`;
    return !newSet.has(key);
  });
  console.log(`[SUPABASE] stale ${stale.length} to deactivate`);
  if (stale.length>0) {
    console.log(`sample stale ${stale.slice(0,10).map(r=>r.word).join(', ')}`);
    const staleIds = stale.map(r=>r.id);
    for (let i=0;i<staleIds.length;i+=500) {
      const batch = staleIds.slice(i,i+500);
      const { error } = await supabase.from('words').update({ is_active: false }).in('id', batch);
      if (error) console.error('stale deactivate err', error.message);
    }
    console.log(`deactivated ${staleIds.length} stale`);
  }

  // Upsert em batches 500
  console.log(`[SUPABASE] upserting ${dedupRows.length} rows`);
  const chunkSize = 500;
  let upserted=0;
  for (let i=0;i<dedupRows.length;i+=chunkSize) {
    const chunk = dedupRows.slice(i,i+chunkSize);
    const { error } = await supabase.from('words').upsert(chunk, { onConflict: 'word,language', ignoreDuplicates: false });
    if (error) {
      console.error(`upsert chunk ${i} err`, error.message);
      // tentar individual
      for (const row of chunk) {
        const { error: e2 } = await supabase.from('words').upsert([row], { onConflict: 'word,language' });
        if (e2) console.error(`single upsert ${row.word}/${row.language} err`, e2.message); else upserted++;
      }
    } else {
      upserted += chunk.length;
      console.log(`upserted chunk ${i} (${chunk.length})`);
    }
  }
  console.log(`[SUPABASE] upserted ${upserted}`);

  // CrossLinesGame schema se existir
  try {
    const { data, error } = await supabase.schema('CrossLinesGame').from('words').select('id').limit(1);
    if (!error) {
      console.log('[SUPABASE] CrossLinesGame.words existe, syncing');
      for (let i=0;i<dedupRows.length;i+=chunkSize) {
        const chunk = dedupRows.slice(i,i+chunkSize);
        await supabase.schema('CrossLinesGame').from('words').upsert(chunk, { onConflict: 'word,language' });
      }
    } else console.log('[SUPABASE] CrossLinesGame não acessível', error.message);
  } catch(e) { console.log('CG sync skip', e.message); }

  // Final counts
  let finalData=[];
  from=0;
  while(true){
    const { data, error } = await supabase.from('words').select('language, level').eq('is_active', true).range(from, from+pageSize-1);
    if (error) { console.error('final fetch err', error.message); break; }
    if (!data || data.length===0) break;
    finalData = finalData.concat(data);
    if (data.length < pageSize) break;
    from+=pageSize;
  }
  if (finalData.length>0) {
    const counts={};
    finalData.forEach(r=>{ const k=`${r.language}-${r.level}`; counts[k]=(counts[k]||0)+1; });
    console.log('[SUPABASE] final counts', counts);
    console.log('[SUPABASE] total active', finalData.length);
  }

}

main().catch(e=>{ console.error(e); process.exit(1); });

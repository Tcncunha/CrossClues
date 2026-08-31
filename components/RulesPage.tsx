'use client';

import type { Lang } from '@/app/page';
import ScoringTable from '@/components/ScoringTable';

interface Props {
  lang: Lang;
}

const ui = {
  en: {
    title: 'Game Rules',
    componentsTitle: 'Game Components',
    componentsIntro: 'The game is played with three types of cards:',
    preparationTitle: 'Game Setup',
    setupStepsTitle: '1. Choose the Grid Size',
    howToPlayTitle: 'How to Play (Turn Flow)',
    crucialRulesTitle: 'Crucial Rules for the Clue',
    progressionTitle: 'Resolution & End of Game',
    scoringTitle: 'Final Scoring',
    optionalTimerTitle: 'Optional: Timer',
    quickSummaryTitle: 'Quick Summary',
    components: [
      { emoji: '🅰️', title: 'Axis Cards', text: '10 total — 5 with letters A to E and 5 with numbers 1 to 5.' },
      { emoji: '🗝️', title: 'Keyword Cards', text: '50 double-sided cards with varied words.' },
      { emoji: '🎯', title: 'Coordinate Cards', text: '50 cards indicating an exact intersection, e.g. A-1, B-3.' },
    ],
    gridModes: [
      { name: 'Express', size: '3x3', letters: 'A-C', numbers: '1-3', cells: '9' },
      { name: 'Classic', size: '4x4', letters: 'A-D', numbers: '1-4', cells: '16' },
      { name: 'Expert', size: '5x5', letters: 'A-E', numbers: '1-5', cells: '25' },
    ],
    setupSteps: [
      { title: 'Build the Structure', text: 'Place the letter cards in a vertical line and the number cards in a horizontal line. This forms the margins of an invisible board (the grid).' },
      { title: 'Deal the Keywords', text: 'Draw and place one Keyword Card next to each letter (rows) and below each number (columns).' },
      { title: 'Prepare the Coordinate Deck', text: 'Shuffle only the coordinate cards that match the chosen grid size. Leave them face down.' },
    ],
    turnFlow: [
      { step: 'Draw a Coordinate', text: 'Any player draws a card from the coordinate deck and reads it in secret. The card points to the exact crossing of two words on the grid.' },
      { step: 'Give the Clue', text: 'That player thinks and says a single word aloud that hints at both the row word and the column word at that coordinate.' },
      { step: 'Group Discussion', text: 'The other players debate to guess which intersection the clue refers to. The clue giver stays neutral and cannot help.' },
      { step: 'The Guess', text: 'The group reaches a consensus and announces a coordinate aloud.' },
    ],
    forbiddenRules: [
      { rule: 'Same family or root as either keyword', example: 'If the words are "cat" and "tree", "feline" or "planting" is not allowed.' },
      { rule: 'A made-up word or a direct translation', example: 'No inventing words or translating literally into another language.' },
      { rule: 'Abbreviations', example: 'No acronyms such as "NGO" or "CPU".' },
      { rule: 'Numbers', example: 'No "two", "three", etc.' },
      { rule: 'Proper names', example: 'No "John", "Paris" (unless agreed beforehand).' },
      { rule: 'Compound words', example: 'No "umbrella", "fire-hose".' },
    ],
    resolution: [
      { emoji: '✅', title: 'Correct guess', text: 'Reveal the card and place it face up in the correct grid position. The group earns 1 point.' },
      { emoji: '❌', title: 'Wrong guess', text: 'Reveal the correct coordinate. The card is discarded and does not score.' },
      { emoji: '🏁', title: 'End of game', text: 'The game ends as soon as the coordinate deck runs out (or the optional timer expires).' },
    ],
    timerTable: [
      { name: 'Express (3x3)', time: '5 minutes' },
      { name: 'Classic (4x4)', time: '5 minutes' },
      { name: 'Expert (5x5)', time: '10 minutes' },
    ],
    quickSummary: [
      'Draw a coordinate card (e.g. B-3).',
      'Look at the two words crossing at that position.',
      'Give a single-word clue connecting both.',
      'The group debates and makes a guess.',
      'Correct? Reveal and score. Wrong? Reveal and discard.',
      'Repeat until the cards run out.',
      'Check the table for your final rating.',
    ],
    separator: 'Onward',
  },
  pt: {
    title: 'Regras do Jogo',
    componentsTitle: 'Componentes do Jogo',
    componentsIntro: 'O jogo e jogado com tres tipos de cartas:',
    preparationTitle: 'Preparacao do Jogo',
    setupStepsTitle: '1. Escolha o Tamanho da Grade',
    howToPlayTitle: 'Como Jogar (Fluxo do Turno)',
    crucialRulesTitle: 'Regras Cruciais para a Dica',
    progressionTitle: 'Resolucao e Fim de Jogo',
    scoringTitle: 'Tabela de Pontuacao',
    optionalTimerTitle: 'Opcional: Cronometro',
    quickSummaryTitle: 'Resumo Rapido',
    components: [
      { emoji: '🅰️', title: 'Cartas de Eixo', text: '10 no total — 5 com letras de A a E e 5 com numeros de 1 a 5.' },
      { emoji: '🗝️', title: 'Cartas de Palavra-Chave', text: '50 cartas de frente e verso, com palavras variadas.' },
      { emoji: '🎯', title: 'Cartas de Coordenada', text: '50 cartas indicando a intersecao exata, ex: A-1, B-3.' },
    ],
    gridModes: [
      { name: 'Expresso', size: '3x3', letters: 'A-C', numbers: '1-3', cells: '9' },
      { name: 'Classico', size: '4x4', letters: 'A-D', numbers: '1-4', cells: '16' },
      { name: 'Expert', size: '5x5', letters: 'A-E', numbers: '1-5', cells: '25' },
    ],
    setupSteps: [
      { title: 'Monte a Estrutura', text: 'Coloque as cartas de letras em uma linha vertical e as cartas de numeros em uma linha horizontal. Isso forma as margens de um tabuleiro invisivel (a grade).' },
      { title: 'Distribua as Palavras', text: 'Sorteie e coloque uma carta de Palavra-Chave ao lado de cada letra (linhas) e abaixo de cada numero (colunas).' },
      { title: 'Prepare o Baralho de Coordenadas', text: 'Embaralhe apenas as cartas de coordenada que correspondem ao tamanho da grade escolhida. Deixe-as viradas para baixo.' },
    ],
    turnFlow: [
      { step: 'Comprar uma Coordenada', text: 'Qualquer jogador compra uma carta do baralho de coordenadas e a le em segredo. A carta indica o cruzamento exato de duas palavras na grade.' },
      { step: 'Dar a Dica', text: 'Esse jogador pensa e diz em voz alta uma unica palavra que sirva de pista para conectar a palavra da linha e a palavra da coluna naquele ponto.' },
      { step: 'Discussao do Grupo', text: 'Os outros jogadores debatem para adivinhar a qual intersecao a dica se refere. O dador da pista mantem expressao neutra e nao pode ajudar.' },
      { step: 'O Palpite', text: 'O grupo entra em consenso e anuncia uma coordenada em voz alta.' },
    ],
    forbiddenRules: [
      { rule: 'Da mesma familia ou raiz de qualquer palavra-chave', example: 'Se as palavras sao "gato" e "arvore", nao vale "felino" ou "plantar".' },
      { rule: 'Uma palavra inventada ou traducao direta', example: 'Nao vale inventar palavras ou traduzir literalmente.' },
      { rule: 'Siglas', example: 'Nao vale usar siglas como "ONG" ou "CPU".' },
      { rule: 'Numeros', example: 'Nao vale "dois", "tres", etc.' },
      { rule: 'Nomes proprios', example: 'Nao vale "Joao", "Paris" (a menos que combinado antes).' },
      { rule: 'Palavra composta', example: 'Nao vale "guarda-chuva", "boca-de-fogo".' },
    ],
    resolution: [
      { emoji: '✅', title: 'Acertou', text: 'Revele a carta e coloque-a com a face para cima na posicao correta da grade. O grupo ganha 1 ponto.' },
      { emoji: '❌', title: 'Errou', text: 'Revele a coordenada correta. A carta e descartada e nao pontua.' },
      { emoji: '🏁', title: 'Fim de jogo', text: 'O jogo termina quando o baralho de coordenadas acabar (ou quando o cronometro opcional expirar).' },
    ],
    timerTable: [
      { name: 'Expresso (3x3)', time: '5 minutos' },
      { name: 'Classico (4x4)', time: '5 minutos' },
      { name: 'Expert (5x5)', time: '10 minutos' },
    ],
    quickSummary: [
      'Compre uma carta de coordenada (ex: B-3).',
      'Veja as duas palavras que se cruzam nessa posicao.',
      'De uma dica de uma unica palavra que conecte ambas.',
      'O grupo debate e faz um palpite.',
      'Acertou? Revele e pontue. Errou? Revele e descarte.',
      'Repita ate acabarem as cartas.',
      'Consulte a tabela para ver a classificacao final.',
    ],
    separator: 'Adiante',
  },
};

function GridModeTable({ modes, lang }: { modes: typeof ui.en.gridModes; lang: Lang }) {
  const labels =
    lang === 'en'
      ? { mode: 'Mode', size: 'Size', letters: 'Letters', numbers: 'Numbers', cells: 'Cells' }
      : { mode: 'Modo', size: 'Tamanho', letters: 'Letras', numbers: 'Numeros', cells: 'Celulas' };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {[labels.mode, labels.size, labels.letters, labels.numbers, labels.cells].map(h => (
              <th
                key={h}
                scope="col"
                className="px-3 py-2 bg-bg-primary border border-border text-left font-display font-bold text-text-primary text-xs uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modes.map(row => (
            <tr key={row.name} className="border border-border">
              <th scope="row" className="px-3 py-2.5 text-left font-semibold bg-bg-card text-accent-light border border-border">
                {row.name}
              </th>
              <td className="px-3 py-2.5 bg-bg-card text-text-secondary border border-border font-mono-label font-bold text-center">
                {row.size}
              </td>
              <td className="px-3 py-2.5 bg-bg-card text-text-secondary border border-border text-center font-mono-label">
                {row.letters}
              </td>
              <td className="px-3 py-2.5 bg-bg-card text-text-secondary border border-border text-center font-mono-label">
                {row.numbers}
              </td>
              <td className="px-3 py-2.5 bg-bg-card text-text-secondary border border-border text-center font-mono-label">
                {row.cells}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`rules-sec-${title}`} className="mb-6">
      <h2
        id={`rules-sec-${title}`}
        className="font-display text-lg font-bold text-text-primary mb-3 flex items-center gap-2"
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function RulesPage({ lang }: Props) {
  const t = ui[lang];

  return (
    <article className="animate-fade-in space-y-6">
      <header>
        <h2 className="font-display text-xl font-extrabold text-text-primary">{t.title}</h2>
        <p className="text-text-secondary text-sm mt-1">
          {lang === 'en'
            ? 'Everything you need to know to sit at the table.'
            : 'Tudo o que voce precisa saber para se sentar a mesa.'}
        </p>
      </header>

      <Section title={t.componentsTitle} icon="📦">
        <div className="grid gap-3 sm:grid-cols-3">
          {t.components.map(comp => (
            <div key={comp.title} className="p-3 bg-bg-primary border border-border rounded-cell">
              <div className="text-2xl mb-1" aria-hidden="true">{comp.emoji}</div>
              <h3 className="text-text-primary font-semibold text-sm mb-1">{comp.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{comp.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.preparationTitle} icon="🛠️">
        <h3 className="text-text-primary font-semibold text-sm mb-2">{t.setupStepsTitle}</h3>
        <GridModeTable modes={t.gridModes} lang={lang} />
        <div className="mt-4 space-y-3">
          {t.setupSteps.map((step, i) => (
            <div key={step.title} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-paper flex items-center justify-center shadow-sm">
                <span className="font-mono-label text-ink font-bold text-xs">{i + 2}</span>
              </div>
              <div>
                <h4 className="text-text-primary font-semibold text-sm">{step.title}</h4>
                <p className="text-text-secondary text-sm leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.howToPlayTitle} icon="🎲">
        <ol className="space-y-3">
          {t.turnFlow.map((item, i) => (
            <li key={item.step} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-paper flex items-center justify-center shadow-sm">
                <span className="font-mono-label text-ink font-bold text-sm">{i + 1}</span>
              </div>
              <div>
                <h4 className="text-text-primary font-semibold text-sm">{item.step}</h4>
                <p className="text-text-secondary text-sm leading-relaxed">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t.crucialRulesTitle} icon="🚫">
        <div className="p-4 bg-error/10 border border-error/30 rounded-cell">
          <p className="text-error font-medium text-sm mb-3">
            {lang === 'en'
              ? 'The single-word clue CANNOT be:'
              : 'A dica de uma unica palavra NAO pode ser:'}
          </p>
          <ul className="space-y-2.5">
            {t.forbiddenRules.map(item => (
              <li key={item.rule} className="flex gap-3 items-start">
                <span className="text-error font-bold" aria-hidden="true">✕</span>
                <div>
                  <span className="text-text-primary font-medium text-sm">{item.rule}</span>
                  <span className="text-text-muted text-xs italic block">— {item.example}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title={t.progressionTitle} icon="🎯">
        <div className="grid gap-3 sm:grid-cols-3">
          {t.resolution.map(item => (
            <div key={item.title} className="p-3 bg-bg-primary border border-border rounded-cell">
              <div className="text-2xl mb-1" aria-hidden="true">{item.emoji}</div>
              <h3 className="text-text-primary font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.scoringTitle} icon="🏆">
        <div className="overflow-x-auto">
          <ScoringTable lang={lang} />
        </div>
      </Section>

      <Section title={t.optionalTimerTitle} icon="⏱️">
        <p className="text-text-secondary text-sm mb-3">
          {lang === 'en'
            ? 'Want more difficulty? Add a timer to each turn:'
            : 'Quer mais dificuldade? Adicione um cronometro a cada rodada:'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th scope="col" className="px-3 py-2 bg-bg-primary border border-border text-left font-display font-bold text-text-primary text-xs uppercase tracking-wider">
                  {lang === 'en' ? 'Mode' : 'Modo'}
                </th>
                <th scope="col" className="px-3 py-2 bg-bg-primary border border-border text-left font-display font-bold text-text-primary text-xs uppercase tracking-wider">
                  {lang === 'en' ? 'Time Limit' : 'Tempo Limite'}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.timerTable.map(row => (
                <tr key={row.name} className="border border-border">
                  <td className="px-3 py-2.5 bg-bg-card text-text-primary border border-border font-medium">{row.name}</td>
                  <td className="px-3 py-2.5 bg-bg-card text-text-secondary border border-border font-mono-label">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t.quickSummaryTitle} icon="📋">
        <ol className="space-y-2">
          {t.quickSummary.map((line, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-light/20 flex items-center justify-center">
                <span className="font-mono-label text-accent-light font-bold text-xs">{i + 1}</span>
              </span>
              <p className="text-text-secondary text-sm leading-relaxed">{line}</p>
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}

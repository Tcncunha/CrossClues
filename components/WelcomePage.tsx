'use client';

import { useState } from 'react';
import { Lang } from '@/app/page';

interface Props {
  onPlay: () => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

type Tab = 'home' | 'howto' | 'tips';

const content = {
  en: {
    subtitle: 'A Word Deduction Game',
    play: 'Play Now',
    tabs: { home: 'Home', howto: 'How to Play', tips: 'Tips' },
    overview: 'CrossLines is a real-time multiplayer word game where players take turns giving clues to help others identify cells on a crossword-style grid.',
    objective: 'Objective',
    objectiveText: 'Reveal all cells on the grid by correctly guessing which intersection each clue refers to.',
    steps: [
      { title: 'The Clue Giver', text: 'One player is chosen as the Clue Giver each turn. They see two intersecting words at each empty cell and must provide a single-word clue that connects both words.' },
      { title: 'The Clue', text: 'The Clue Giver picks an empty cell and types one word that hints at both the row word and column word crossing at that cell.' },
      { title: 'The Guess', text: 'Other players see the clue and must figure out which cell on the grid it refers to. They click the cell they think matches.' },
      { title: 'Scoring', text: 'Correct guess: +1 point. Wrong guess: the clue is discarded and play moves to the next player.' },
    ],
    gameEnds: 'The game ends when all cells are revealed. The player with the most points wins!',
    tip: 'Choose words that create strong associations with both intersecting words. The best clues make others think "of course!"',
    tipLabel: 'Pro tip:',
    difficultyTitle: 'Difficulty Levels',
    difficultyDesc: 'Easy uses simple 3-letter words. Medium uses common 5-letter words. Hard uses advanced vocabulary.',
    gridSizeTitle: 'Grid Size',
    gridSizeDesc: 'Choose 3x3, 4x4, or 5x5. Larger grids mean more cells and longer games.',
    playersTitle: 'Players',
    playersDesc: '2 to 6 players. One gives clues while the others guess. Roles rotate each turn.',
    rolesTitle: 'Roles',
    rolesDesc: 'Clue Giver: provides one-word hints. Guessers: try to identify the correct cell. Roles rotate every turn.',
  },
  pt: {
    subtitle: 'Um Jogo de Deducao com Palavras',
    play: 'Jogar Agora',
    tabs: { home: 'Inicio', howto: 'Como Jogar', tips: 'Dicas' },
    overview: 'CrossLines (Entre Linhas) e um jogo de palavras multijogador em tempo real onde os jogadores revezam dando dicas para ajudar outros a identificar celulas em uma grade estilo cruzada.',
    objective: 'Objetivo',
    objectiveText: 'Revele todas as celulas da grade acertando a qual intersecao cada dica se refere.',
    steps: [
      { title: 'O Dador de Dicas', text: 'Um jogador e escolhido como Dador de Dicas a cada turno. Ele ve duas palavras cruzadas em cada celula vazia e deve fornecer uma dica de uma palavra que conecta ambas.' },
      { title: 'A Dica', text: 'O Dador de Dicas escolhe uma celula vazia e digita uma palavra que sugere tanto a palavra da linha quanto a palavra da coluna que se cruzam naquela celula.' },
      { title: 'O Palpite', text: 'Os outros jogadores veem a dica e devem descobrir a qual celula da grade ela se refere. Eles clicam na celula que acham que corresponde.' },
      { title: 'Pontuacao', text: 'Acertou: +1 ponto. Errou: a dica e descartada e o turno passa para o proximo jogador.' },
    ],
    gameEnds: 'O jogo termina quando todas as celulas estao reveladas. O jogador com mais pontos vence!',
    tip: 'Escolha palavras que criam fortes associacoes com ambas as palavras cruzadas. As melhores dicas fazem os outros pensarem "e claro!"',
    tipLabel: 'Dica:',
    difficultyTitle: 'Niveis de Dificuldade',
    difficultyDesc: 'Facil usa palavras simples de 3 letras. Medio usa palavras comuns de 5 letras. Dificil usa vocabulario avancado.',
    gridSizeTitle: 'Tamanho da Grade',
    gridSizeDesc: 'Escolha 3x3, 4x4 ou 5x5. Grades maiores significam mais celulas e jogos mais longos.',
    playersTitle: 'Jogadores',
    playersDesc: '2 a 6 jogadores. Um da dicas enquanto os outros tentam acertar. Os papeis revezam a cada turno.',
    rolesTitle: 'Papeis',
    rolesDesc: 'Dador de Dicas: fornece dicas de uma palavra. Adivinhadores: tentam identificar a celula correta. Os papeis revezam a cada turno.',
  },
};

export default function WelcomePage({ onPlay, lang, onLangChange }: Props) {
  const [tab, setTab] = useState<Tab>('home');
  const t = content[lang];

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-bg-card rounded-card border border-border shadow-lg overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1" />
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent">
                Entre Linhas
              </h1>
              <p className="text-text-secondary mt-1">{t.subtitle}</p>
            </div>
            <div className="flex-1 flex justify-end">
              <div className="flex bg-bg-primary rounded-cell border border-border overflow-hidden">
                <button
                  onClick={() => onLangChange('en')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => onLangChange('pt')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'pt' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  PT
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-bg-primary rounded-cell p-1">
            {(['home', 'howto', 'tips'] as Tab[]).map(key => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-cell transition-all ${
                  tab === key
                    ? 'bg-accent text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-cell'
                }`}
              >
                {t.tabs[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 min-h-[420px]">
          {tab === 'home' && (
            <div className="animate-fade-in space-y-6">
              <p className="text-text-secondary leading-relaxed">{t.overview}</p>
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">{t.objective}</h2>
                <p className="text-text-secondary leading-relaxed">{t.objectiveText}</p>
              </div>
              <div className="p-4 bg-success/10 border border-success/30 rounded-cell">
                <p className="text-success font-medium">{t.gameEnds}</p>
              </div>
            </div>
          )}

          {tab === 'howto' && (
            <div className="animate-fade-in space-y-5">
              {t.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent flex items-center justify-center">
                    <span className="text-accent-light font-bold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-text-primary font-medium mb-1">{step.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'tips' && (
            <div className="animate-fade-in space-y-5">
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-cell">
                <p className="text-text-secondary text-sm">
                  <span className="text-accent-light font-medium">{t.tipLabel} </span>
                  {t.tip}
                </p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-1">{t.difficultyTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.difficultyDesc}</p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-1">{t.gridSizeTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.gridSizeDesc}</p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-1">{t.playersTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.playersDesc}</p>
              </div>
              <div>
                <h3 className="text-text-primary font-medium mb-1">{t.rolesTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.rolesDesc}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onPlay}
            className="w-full py-4 bg-accent hover:bg-accent-hover text-white font-bold text-lg rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-accent/25"
          >
            {t.play}
          </button>
        </div>
      </div>
    </div>
  );
}

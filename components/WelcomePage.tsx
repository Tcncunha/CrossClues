'use client';

import { useState } from 'react';

interface Props {
  onPlay: () => void;
}

const content = {
  en: {
    subtitle: 'A Word Deduction Game',
    play: 'Play',
    howToPlay: 'How to Play',
    overview: 'CrossLines is a real-time multiplayer word game where players take turns giving clues to help others identify cells on a crossword-style grid.',
    objective: 'Objective',
    objectiveText: 'Reveal all cells on the grid by correctly guessing which intersection each clue refers to.',
    steps: [
      {
        title: '1. The Clue Giver',
        text: 'One player is chosen as the Clue Giver each turn. They see two intersecting words at each empty cell and must provide a single-word clue that connects both words.',
      },
      {
        title: '2. The Clue',
        text: 'The Clue Giver picks an empty cell and types one word that hints at both the row word and column word crossing at that cell.',
      },
      {
        title: '3. The Guess',
        text: 'Other players see the clue and must figure out which cell on the grid it refers to. They click the cell they think matches.',
      },
      {
        title: '4. Scoring',
        text: 'Correct guess: +1 point. Wrong guess: the clue is discarded and play moves to the next player.',
      },
    ],
    gameEnds: 'The game ends when all cells are revealed. The player with the most points wins!',
    tip: 'Choose words that create strong associations with both intersecting words. The best clues make others think "of course!"',
    tipLabel: 'Pro tip:',
  },
  pt: {
    subtitle: 'Um Jogo de Deducao com Palavras',
    play: 'Jogar',
    howToPlay: 'Como Jogar',
    overview: 'CrossLines (Entre Linhas) e um jogo de palavras multijogador em tempo real onde os jogadores revezam dando dicas para ajudar outros a identificar celulas em uma grade estilo cruzada.',
    objective: 'Objetivo',
    objectiveText: 'Revele todas as celulas da grade acertando a qual intersecao cada dica se refere.',
    steps: [
      {
        title: '1. O Dador de Dicas',
        text: 'Um jogador e escolhido como Dador de Dicas a cada turno. Ele ve duas palavras cruzadas em cada celula vazia e deve fornecer uma dica de uma palavra que conecta ambas.',
      },
      {
        title: '2. A Dica',
        text: 'O Dador de Dicas escolhe uma celula vazia e digita uma palavra que sugere tanto a palavra da linha quanto a palavra da coluna que se cruzam naquela celula.',
      },
      {
        title: '3. O Palpite',
        text: 'Os outros jogadores veem a dica e devem descobrir a qual celula da grade ela se refere. Eles clicam na celula que acham que corresponde.',
      },
      {
        title: '4. Pontuacao',
        text: 'Acertou: +1 ponto. Errou: a dica e descartada e o turno passa para o proximo jogador.',
      },
    ],
    gameEnds: 'O jogo termina quando todas as celulas estao reveladas. O jogador com mais pontos vence!',
    tip: 'Escolha palavras que criam fortes associacoes com ambas as palavras cruzadas. As melhores dicas fazem os outros pensarem "e claro!"',
    tipLabel: 'Dica:',
  },
};

export default function WelcomePage({ onPlay }: Props) {
  const [lang, setLang] = useState<'en' | 'pt'>('en');
  const t = content[lang];

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg">
        <div className="flex items-center justify-between mb-8">
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
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('pt')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'pt' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                PT
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-text-secondary leading-relaxed">{t.overview}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-3">{t.objective}</h2>
          <p className="text-text-secondary leading-relaxed">{t.objectiveText}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">{t.howToPlay}</h2>
          <div className="space-y-4">
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
        </div>

        <div className="mb-8 p-4 bg-success/10 border border-success/30 rounded-cell">
          <p className="text-success font-medium mb-1">{t.gameEnds}</p>
        </div>

        <div className="mb-8 p-4 bg-accent/10 border border-accent/30 rounded-cell">
          <p className="text-text-secondary text-sm">
            <span className="text-accent-light font-medium">{t.tipLabel} </span>
            {t.tip}
          </p>
        </div>

        <button
          onClick={onPlay}
          className="w-full py-4 bg-accent hover:bg-accent-hover text-white font-bold text-lg rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-accent/25"
        >
          {t.play}
        </button>
      </div>
    </div>
  );
}

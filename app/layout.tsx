import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrossLinescls | CrossLines - Word Deduction Game',
  description: 'A real-time multiplayer word deduction game | Jogo de deducao de palavras online',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

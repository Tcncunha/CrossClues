import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Entre Linhas - Jogo Online',
  description: 'Jogo de Deducao de Palavras Online',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

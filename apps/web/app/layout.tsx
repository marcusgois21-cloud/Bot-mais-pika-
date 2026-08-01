import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ObraIA · Painel',
  description: 'Gestão de obras alimentada por registros de campo via WhatsApp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

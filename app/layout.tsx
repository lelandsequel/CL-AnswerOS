import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { MainNav } from '@/components/MainNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'C&L Answer OS',
  description: 'Unified LLM-Powered SEO/AEO Audit Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}
      >
        <MainNav />
        <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}

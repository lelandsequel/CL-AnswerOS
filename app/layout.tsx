import './globals.css';
import type { Metadata } from 'next';
import { MainNav } from '@/components/MainNav';

export const metadata: Metadata = {
  title: 'C&L Answer OS',
  description: 'Audit a website, get a client-ready report',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="font-sans bg-slate-950 text-slate-50 antialiased"
      >
        <MainNav />
        <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const primaryLinks = [
  { label: 'Home', href: '/' },
  { label: 'Audit', href: '/audit' },
  { label: 'pSEO', href: '/pseo' },
  { label: 'Deck', href: '/deck-outline' },
  { label: 'Keywords', href: '/keywords' },
  { label: 'Content', href: '/content' },
  { label: 'Press', href: '/press-release' },
  { label: 'Leads', href: '/leads' },
];

const secondaryLinks = [
  { label: 'Clients', href: '/clients' },
  { label: 'Sales', href: '/sales' },
  { label: 'Saved', href: '/saved' },
  { label: 'Fix Engine', href: '/fix' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleRunDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch('/api/demo/create-audit-asset', { method: 'POST' });
      const data = await res.json();
      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch (error) {
      console.error('Failed to run demo:', error);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/40">
            <span className="text-xs font-semibold text-sky-300">C&L</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-50">
              C&L Answer OS
            </span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Audit · AEO · Client OS
            </span>
          </div>
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/60'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-slate-50',
                ].join(' ')}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Secondary / right side */}
        <div className="flex items-center gap-2">
          {/* Run Demo Button */}
          <button
            onClick={handleRunDemo}
            disabled={demoLoading}
            className="rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/50 hover:from-green-500/40 hover:to-emerald-500/40 transition-all disabled:opacity-50"
          >
            {demoLoading ? '⏳ Demo...' : '🚀 Run Demo'}
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {secondaryLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    'rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors',
                    active
                      ? 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile condensed nav */}
          <nav className="flex items-center gap-1 md:hidden">
            {primaryLinks.slice(0, 3).map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                    active
                      ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/60'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-slate-50',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}


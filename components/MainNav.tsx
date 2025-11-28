'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// MVP Navigation - focused on audit workflow
const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Audit', href: '/audit' },
  { label: 'Audit History', href: '/saved' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function MainNav() {
  const pathname = usePathname();

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
              Agency Audit Tool
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
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
      </div>
    </header>
  );
}


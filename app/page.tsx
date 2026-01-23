// app/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ClientAsset = {
  id: string;
  client_id: string | null;
  type: string | null;
  title: string | null;
  summary: string | null;
  tags: string[] | null;
  created_at: string | null;
};

type AssetsResponse =
  | { data: ClientAsset[] }
  | { error: string };

export default function DashboardPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [initComplete, setInitComplete] = useState(false);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence
  useEffect(() => {
    const timer = setTimeout(() => setInitComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoadingAssets(true);
        setAssetsError(null);
        const res = await fetch('/api/client-assets', { method: 'GET' });
        const json = (await res.json()) as AssetsResponse;
        if (!res.ok || 'error' in json) {
          throw new Error('error' in json ? json.error : 'Failed to load assets');
        }
        const data = json.data || [];
        const sorted = data
          .slice()
          .sort((a, b) => {
            const ta = a.created_at ? Date.parse(a.created_at) : 0;
            const tb = b.created_at ? Date.parse(b.created_at) : 0;
            return tb - ta;
          })
          .slice(0, 5);
        setAssets(sorted);
      } catch (err: unknown) {
        console.error('Dashboard assets error:', err);
        setAssetsError(err instanceof Error ? err.message : 'Unable to load assets.');
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchAssets();
  }, []);

  const totalAssets = assets.length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
      {/* Hero - Code block style */}
      <section className="mb-12">
        <div className="mb-6 text-xs text-slate-600">// system.init()</div>

        <div className={`transition-opacity duration-500 ${initComplete ? 'opacity-100' : 'opacity-0'}`}>
          <pre className="text-slate-500 text-sm mb-4">
{`const `}<span className="text-violet-400">answerOS</span>{` = {`}
          </pre>

          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-2 ml-4">
            C&L Answer OS
            <span className={`inline-block w-[4px] h-12 md:h-16 bg-violet-500 ml-2 align-middle ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
          </h1>

          <pre className="text-slate-500 text-sm mt-4">
{`  `}<span className="text-slate-400">status</span>: <span className="text-emerald-400">&apos;ready&apos;</span>,
{`  `}<span className="text-slate-400">modules</span>: <span className="text-amber-400">6</span>,
{`  `}<span className="text-slate-400">assets</span>: <span className="text-amber-400">{totalAssets}</span>
{`};`}
          </pre>
        </div>

        <p className="mt-8 text-slate-400 max-w-xl text-lg leading-relaxed">
          Audit. Optimize. Generate. Deploy.
        </p>

        <div className="mt-2 h-px w-32 bg-gradient-to-r from-violet-500 to-transparent" />
      </section>

      {/* Action buttons - Terminal style */}
      <section className="mb-16 flex flex-wrap gap-3">
        <button
          onClick={handleRunDemo}
          disabled={demoLoading}
          className="group relative border border-violet-500/50 bg-violet-500/10 px-6 py-3 text-sm text-violet-300 transition-all hover:bg-violet-500/20 hover:border-violet-500 disabled:opacity-50"
        >
          <span className="text-violet-500 mr-2">$</span>
          {demoLoading ? (
            <span className="text-slate-400">executing<span className="animate-pulse">...</span></span>
          ) : (
            <>run --demo</>
          )}
        </button>

        <Link
          href="/audit"
          className="group border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm text-slate-300 transition-all hover:bg-slate-800 hover:border-slate-600"
        >
          <span className="text-emerald-500 mr-2">$</span>
          audit --new
        </Link>

        <Link
          href="/pseo"
          className="group border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm text-slate-300 transition-all hover:bg-slate-800 hover:border-slate-600"
        >
          <span className="text-amber-500 mr-2">$</span>
          pseo --generate
        </Link>
      </section>

      {/* Modules grid - File tree style */}
      <section className="mb-16">
        <div className="text-xs text-slate-600 mb-4">// modules.map()</div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { href: '/audit', label: 'audit', color: 'sky' },
            { href: '/pseo', label: 'pseo', color: 'violet' },
            { href: '/keywords', label: 'keywords', color: 'amber' },
            { href: '/leads', label: 'leads', color: 'emerald' },
            { href: '/content', label: 'content', color: 'pink' },
            { href: '/assets', label: 'assets', color: 'slate' },
          ].map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="text-slate-600 text-xs mb-2">
                <span className={`text-${mod.color}-500`}>01</span> file
              </div>
              <div className="text-white font-medium group-hover:text-violet-400 transition-colors">
                {mod.label}<span className="text-slate-600">.ts</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Two column layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Recent assets - Log style */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-slate-600">// assets.recent()</div>
            <Link href="/assets" className="text-xs text-violet-500 hover:text-violet-400">
              view all →
            </Link>
          </div>

          <div className="border border-slate-800 bg-slate-950">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs text-slate-600">~/assets</span>
            </div>

            <div className="p-4 min-h-[280px]">
              {loadingAssets && (
                <div className="text-slate-500 text-sm">
                  <span className="text-emerald-500">→</span> fetching assets<span className="animate-pulse">...</span>
                </div>
              )}

              {assetsError && !loadingAssets && (
                <div className="text-red-400 text-sm">
                  <span className="text-red-500">✗</span> error: {assetsError}
                </div>
              )}

              {!loadingAssets && !assetsError && assets.length === 0 && (
                <div className="text-slate-600 text-sm">
                  <span className="text-slate-500">→</span> no assets found
                  <br />
                  <span className="text-slate-700">  run `audit --new` to get started</span>
                </div>
              )}

              {!loadingAssets && !assetsError && assets.length > 0 && (
                <div className="space-y-1">
                  {assets.map((asset, i) => (
                    <Link
                      key={asset.id}
                      href={`/assets/${asset.id}`}
                      className="group flex items-start gap-3 py-2 text-sm hover:bg-slate-900/50 -mx-2 px-2 transition-colors"
                    >
                      <span className="text-slate-700 w-4 text-right shrink-0">{i + 1}</span>
                      <span className="text-emerald-500 shrink-0">→</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-300 group-hover:text-violet-400 transition-colors truncate block">
                          {asset.title || 'untitled'}
                        </span>
                        <span className="text-slate-600 text-xs truncate block">
                          {asset.summary || 'no description'}
                        </span>
                      </div>
                      <span className="text-slate-700 text-xs shrink-0">
                        [{asset.type || 'asset'}]
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats - Config style */}
        <section>
          <div className="text-xs text-slate-600 mb-4">// config.json</div>

          <div className="border border-slate-800 bg-slate-950 p-6">
            <pre className="text-sm">
<span className="text-slate-600">{`{`}</span>
{`
  `}<span className="text-violet-400">&quot;system&quot;</span>: <span className="text-emerald-400">&quot;online&quot;</span>,
{`
  `}<span className="text-violet-400">&quot;assets&quot;</span>: <span className="text-amber-400">{totalAssets}</span>,
{`
  `}<span className="text-violet-400">&quot;modules&quot;</span>: <span className="text-amber-400">6</span>,
{`
  `}<span className="text-violet-400">&quot;version&quot;</span>: <span className="text-emerald-400">&quot;2.0.0&quot;</span>
<span className="text-slate-600">{`}`}</span>
            </pre>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="text-xs text-slate-600 mb-3">// quick.links</div>
              <div className="space-y-2">
                {[
                  { href: '/fix', label: 'fix-engine' },
                  { href: '/tone-adjust', label: 'tone-adjust' },
                  { href: '/press-release', label: 'press-release' },
                  { href: '/deck-outline', label: 'deck-outline' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-slate-500 hover:text-violet-400 transition-colors"
                  >
                    <span className="text-slate-700 mr-2">→</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer comment */}
      <div className="mt-16 text-xs text-slate-800">
        {`// end of file`}
      </div>
    </main>
  );
}

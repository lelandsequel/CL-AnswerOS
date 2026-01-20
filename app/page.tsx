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
  | {
      data: ClientAsset[];
    }
  | {
      error: string;
    };

export default function DashboardPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
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

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoadingAssets(true);
        setAssetsError(null);

        const res = await fetch('/api/client-assets', {
          method: 'GET',
        });

        const json = (await res.json()) as AssetsResponse;

        if (!res.ok || 'error' in json) {
          throw new Error(
            'error' in json ? json.error : 'Failed to load assets',
          );
        }

        const data = json.data || [];
        // newest first, top 5
        const sorted = data
          .slice()
          .sort((a, b) => {
            const ta = a.created_at ? Date.parse(a.created_at) : 0;
            const tb = b.created_at ? Date.parse(b.created_at) : 0;
            return tb - ta;
          })
          .slice(0, 5);

        setAssets(sorted);
      } catch (err: any) {
        console.error('Dashboard assets error:', err);
        setAssetsError(
          err?.message || 'Unable to load recent assets right now.',
        );
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  const totalAssets = assets.length;
  const hasAssets = totalAssets > 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8">
      {/* Top welcome / summary */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950/95 to-slate-900/90 p-6 shadow-lg shadow-black/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Welcome back to C&L Answer OS
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Audit, AEO, client assets and prospecting — all wired into one
              control panel. Pick up where you left off or spin up something
              new.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-400">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Snapshot
            </span>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200">
                Assets: <span className="font-semibold">{totalAssets}</span>
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200">
                Modules: <span className="font-semibold">Audit · AEO · Leads</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={handleRunDemo}
          disabled={demoLoading}
          className="rounded-2xl border border-green-500/40 bg-gradient-to-br from-green-950/40 to-emerald-950/40 p-4 text-left transition-all hover:border-green-500/60 hover:from-green-950/60 hover:to-emerald-950/60 disabled:opacity-50"
        >
          <div className="text-lg font-semibold text-green-300">
            {demoLoading ? '⏳ Loading...' : '🚀 Run Demo'}
          </div>
          <p className="mt-1 text-xs text-green-200/70">
            See the full platform in action with pre-loaded demo data.
          </p>
        </button>
        <QuickAction
          href="/audit"
          label="Run Site Audit"
          description="Scan a site, generate a structured audit and detailed report."
        />
        <QuickAction
          href="/leads"
          label="Prospect Leads"
          description="Use DataForSEO to pull lead lists by niche + city."
        />
        <QuickAction
          href="/assets"
          label="View Asset Library"
          description="See all saved audits, reports, lead lists and more."
        />
      </section>

      {/* Two-column lower section */}
      <section className="grid gap-6 lg:grid-cols-[2fr_1.2fr]">
        {/* Recent assets */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-lg shadow-black/40">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Recent Assets
              </h2>
              <p className="text-xs text-slate-400">
                Latest audits, reports, lead lists and other saved outputs.
              </p>
            </div>
            <Link
              href="/assets"
              className="text-xs font-medium text-sky-300 hover:text-sky-200"
            >
              View all →
            </Link>
          </div>

          {loadingAssets && (
            <p className="py-4 text-xs text-slate-400">
              Loading recent assets…
            </p>
          )}

          {assetsError && !loadingAssets && (
            <p className="rounded-2xl border border-red-800/70 bg-red-950/70 px-3 py-2 text-xs text-red-100">
              {assetsError}
            </p>
          )}

          {!loadingAssets && !assetsError && !hasAssets && (
            <p className="py-4 text-xs text-slate-500">
              No assets yet. Run an audit, generate content, or save a lead list
              to see it appear here.
            </p>
          )}

          {!loadingAssets && !assetsError && hasAssets && (
            <ul className="divide-y divide-slate-800 text-xs">
              {assets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/assets/${asset.id}`}
                      className="font-medium text-sky-300 hover:text-sky-200"
                    >
                      {asset.title || 'Untitled'}
                    </Link>
                    <p className="text-slate-400">
                      {asset.summary || 'No description'}
                    </p>
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {asset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-slate-900 px-2 py-1 text-[10px] text-slate-400">
                    {asset.type || 'asset'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right sidebar: Quick stats */}
        <div className="flex flex-col gap-4">
          {/* Stats card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-lg shadow-black/40">
            <h3 className="mb-4 text-sm font-semibold text-slate-50">
              Quick Stats
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Assets</span>
                <span className="font-semibold text-sky-300">{totalAssets}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Modules</span>
                <span className="font-semibold text-sky-300">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="rounded-full bg-green-900/40 px-2 py-1 text-green-300">
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Help card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 shadow-lg shadow-black/40">
            <h3 className="mb-3 text-sm font-semibold text-slate-50">
              Getting Started
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/audit" className="text-sky-300 hover:text-sky-200">
                  → Run your first audit
                </Link>
              </li>
              <li>
                <Link href="/leads" className="text-sky-300 hover:text-sky-200">
                  → Pull a lead list
                </Link>
              </li>
              <li>
                <Link href="/assets" className="text-sky-300 hover:text-sky-200">
                  → Browse saved assets
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickAction({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/80"
    >
      <h3 className="font-semibold text-slate-50 group-hover:text-sky-300">
        {label}
      </h3>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </Link>
  );
}

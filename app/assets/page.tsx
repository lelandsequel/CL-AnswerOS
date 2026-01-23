// app/assets/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ClientAsset } from '@/lib/types';
import { AssetList } from '@/components/assets';
import { Card } from '@/components/ui/card';

export default function AssetsPage() {
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/client-assets');
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load assets');
        }
        const data = await res.json();
        console.log("[Assets Page] API response:", data);
        const assetsArray = Array.isArray(data.assets) ? data.assets : [];
        console.log("[Assets Page] Setting assets:", assetsArray.length, "items");
        if (!cancelled) {
          setAssets(assetsArray);
        }
      } catch (err: any) {
        console.error('Error loading assets:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load assets');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAssets();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
        <div className="mb-8">
          <div className="text-xs text-slate-600 mb-2">// assets.init()</div>
          <div className="h-8 w-48 animate-pulse bg-slate-800" />
        </div>
        <Card variant="terminal" title="~/assets">
          <div className="text-slate-500 text-sm">
            <span className="text-emerald-500">-&gt;</span> loading assets<span className="animate-pulse">...</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse bg-slate-900/50 border border-slate-800" />
            ))}
          </div>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
        <div className="mb-8">
          <div className="text-xs text-slate-600 mb-2">// assets.init()</div>
          <h1 className="text-3xl font-bold text-white mb-2">Asset Library</h1>
        </div>
        <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/5 p-4">
          <span className="text-red-500">x</span> failed to load assets: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs text-slate-600 mb-2">// assets.init()</div>
        <h1 className="text-3xl font-bold text-white mb-2">Asset Library</h1>
        <p className="text-slate-500 text-sm">
          All assets across every client - audits, reports, and more.
        </p>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-slate-500 to-transparent" />
      </div>

      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-6 text-sm">
        <div className="text-slate-500">
          total: <span className="text-amber-400">{assets.length}</span>
        </div>
        <div className="text-slate-500">
          types: <span className="text-violet-400">{[...new Set(assets.map(a => a.type))].length}</span>
        </div>
        <Link href="/audit" className="text-slate-600 hover:text-violet-400 transition-colors">
          -&gt; /audit
        </Link>
      </div>

      {/* Assets list */}
      {assets.length === 0 ? (
        <div className="border border-dashed border-slate-800 p-8 text-center">
          <div className="text-slate-600 text-sm">
            <span className="text-slate-700">-&gt;</span> no assets found
          </div>
          <div className="text-xs text-slate-700 mt-2">
            run an audit to create your first asset
          </div>
          <Link
            href="/audit"
            className="inline-block mt-4 border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            <span className="text-violet-500 mr-2">$</span>
            audit --new
          </Link>
        </div>
      ) : (
        <AssetList
          assets={assets}
          showClient
          title=""
          subtitle=""
        />
      )}

      <div className="mt-16 text-xs text-slate-800">// end of file</div>
    </main>
  );
}

// app/assets/page.tsx

'use client';

import { useEffect, useState } from 'react';
import type { ClientAsset } from '@/lib/types';
import { AssetList } from '@/components/assets';

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
          throw new Error(
            text || 'Failed to load assets'
          );
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
          setError(
            err.message || 'Failed to load assets'
          );
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
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-800" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-900" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-slate-900"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="rounded-xl border border-red-800/60 bg-red-950/60 px-4 py-3 text-sm text-red-200">
          Failed to load assets: {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <AssetList
        assets={assets}
        showClient
        title="Global Asset Library"
        subtitle="All assets across every client – audits, Lelandized reports, and more."
      />
    </main>
  );
}


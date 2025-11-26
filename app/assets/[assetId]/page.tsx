'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { ClientAsset } from '@/lib/types';

type PageProps = {
  params: Promise<{
    assetId: string;
  }>;
};

export default function GlobalAssetViewerPage({
  params,
}: PageProps) {
  const { assetId } = use(params);

  const [asset, setAsset] = useState<ClientAsset | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAsset() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/client-assets/${encodeURIComponent(
            assetId
          )}`
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            text || 'Failed to load asset'
          );
        }

        const json = (await res.json()) as ClientAsset;
        if (!cancelled) {
          setAsset(json);
        }
      } catch (err: any) {
        console.error('Error loading asset:', err);
        if (!cancelled) {
          setError(
            err.message || 'Failed to load asset'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAsset();

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  async function handleDelete() {
    if (isDeleting || deleted) return;

    if (
      !window.confirm(
        'Delete this asset permanently?'
      )
    )
      return;

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/client-assets/${encodeURIComponent(
          assetId
        )}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          text || 'Failed to delete asset'
        );
      }

      setDeleted(true);
    } catch (err: any) {
      console.error('Error deleting asset:', err);
      setError(
        err.message || 'Failed to delete asset'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 h-6 w-72 animate-pulse rounded bg-slate-800" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-900" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-4 rounded-xl border border-red-800/60 bg-red-950/60 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
        <Link
          href="/assets"
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          ← Back to global asset library
        </Link>
      </main>
    );
  }

  if (!asset || deleted) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-4 text-sm text-slate-300">
          {deleted
            ? 'Asset deleted.'
            : 'Asset not found.'}
        </p>
        <Link
          href="/assets"
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          ← Back to global asset library
        </Link>
      </main>
    );
  }

  const createdAt = asset.createdAt
    ? new Date(asset.createdAt)
    : null;
  const updatedAt = asset.updatedAt
    ? new Date(asset.updatedAt)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Link
            href="/assets"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Back to global asset library
          </Link>
          <h1 className="text-xl font-semibold text-slate-50">
            {asset.title || 'Untitled Asset'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-200">
              {asset.type || 'Asset'}
            </span>
            {asset.tags && asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {asset.clientId && (
              <Link
                href={`/clients/${asset.clientId}/assets`}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-sky-300 hover:text-sky-200"
              >
                View client library
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center rounded-lg border border-red-800/80 bg-red-950/80 px-3 py-1.5 text-xs font-medium text-red-100 shadow-sm transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Deleting…' : 'Delete Asset'}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-400">
        {createdAt && (
          <span>
            Created:{' '}
            <span className="text-slate-200">
              {createdAt.toLocaleString()}
            </span>
          </span>
        )}
        {updatedAt && (
          <span>
            Updated:{' '}
            <span className="text-slate-200">
              {updatedAt.toLocaleString()}
            </span>
          </span>
        )}
        {asset.clientId && (
          <span>
            Client ID:{' '}
            <span className="font-mono text-slate-200">
              {asset.clientId}
            </span>
          </span>
        )}
        <span>
          Asset ID:{' '}
          <span className="font-mono text-slate-500">
            {asset.id}
          </span>
        </span>
      </div>

      {asset.summary && (
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-100">
          {asset.summary}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-100">
          Raw Payload
        </h2>
        <pre className="max-h-[480px] overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(asset.payload ?? null, null, 2)}
        </pre>
      </div>
    </main>
  );
}


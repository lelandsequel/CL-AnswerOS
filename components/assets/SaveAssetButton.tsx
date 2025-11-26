// components/assets/SaveAssetButton.tsx

'use client';

import { useState } from 'react';
import type { ClientAsset } from '@/lib/types';

type SaveAssetButtonProps = {
  label?: string;
  clientId?: string | null;
  type: string;
  title: string;
  summary?: string;
  payload: unknown;
  tags?: string[];
  className?: string;
  onSaved?: (asset: ClientAsset) => void;
  disabled?: boolean;
};

export function SaveAssetButton({
  label = 'Save as Asset',
  clientId,
  type,
  title,
  summary,
  payload,
  tags,
  className = '',
  onSaved,
  disabled,
}: SaveAssetButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedAsset, setSavedAsset] =
    useState<ClientAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (isSaving || disabled) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/client-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId ?? null,
          type,
          title,
          summary: summary ?? '',
          payload,
          tags: tags ?? [],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save asset');
      }

      const json = (await res.json()) as ClientAsset;
      setSavedAsset(json);
      onSaved?.(json);
    } catch (err: any) {
      console.error('Error saving asset:', err);
      setError(
        err.message || 'Failed to save asset'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving || disabled}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg border',
          'border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium',
          'text-slate-50 shadow-sm transition hover:bg-slate-800',
          'disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}
      >
        {isSaving && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
        )}
        <span>
          {savedAsset ? 'Saved ✓' : label}
        </span>
      </button>

      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}

      {savedAsset && (
        <p className="text-xs text-emerald-400">
          Asset saved •{' '}
          <span className="font-semibold">
            {savedAsset.title}
          </span>
        </p>
      )}
    </div>
  );
}


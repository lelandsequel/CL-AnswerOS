'use client';

import { useState } from 'react';
import { DeckOutlineForm } from '@/components/DeckOutlineForm';
import { OutputPanel } from '@/components/OutputPanel';
import { DeckOutlineResult } from '@/lib/pseo-types';

export default function DeckOutlinePage() {
  const [result, setResult] = useState<DeckOutlineResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/deck-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate deck outline');
      }

      const { data: deckResult } = await response.json();
      setResult(deckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!result) return null;

    return (
      <OutputPanel
        title="Proposal Deck Outline"
        content={result.outline}
        filename={`deck-outline-${result.company_name.toLowerCase().replace(/\s+/g, '-')}.md`}
      />
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">
          Proposal Deck Outline Generator
        </h1>
        <p className="text-slate-400">
          Generate a comprehensive proposal deck outline for your client
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-slate-50 mb-4">
            Client Information
          </h2>
          <DeckOutlineForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        <div>
          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-300 mb-4">
              {error}
            </div>
          )}
          {renderOutput()}
        </div>
      </div>
    </div>
  );
}


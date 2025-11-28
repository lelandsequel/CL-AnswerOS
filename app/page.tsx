// app/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import type { AuditRecord } from '@/lib/types';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recent audits
  const [recentAudits, setRecentAudits] = useState<AuditRecord[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  useEffect(() => {
    loadRecentAudits();
  }, []);

  async function loadRecentAudits() {
    try {
      setLoadingAudits(true);
      const res = await fetch('/api/audits');
      if (res.ok) {
        const data = await res.json();
        // Get most recent 5 audits
        const audits = (data.audits || []).slice(0, 5);
        setRecentAudits(audits);
      }
    } catch (err) {
      console.error('Failed to load recent audits:', err);
    } finally {
      setLoadingAudits(false);
    }
  }

  async function runAudit() {
    if (!url.trim()) return;
    
    try {
      setLoading(true);
      setError('');

      // Redirect to audit page with URL param
      const params = new URLSearchParams({ url: url.trim() });
      if (clientName.trim()) {
        params.append('clientName', clientName.trim());
      }
      window.location.href = `/audit?${params.toString()}`;
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-8">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 mb-4">
          C&L Answer OS
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Audit a website, get a client-ready report.
        </p>
      </section>

      {/* Main Audit Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Website URL
            </label>
            <Input
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="text-base"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-2">
              Client Name (optional)
            </label>
            <Input
              value={clientName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientName(e.target.value)}
              placeholder="Acme Corp"
              className="text-base"
            />
          </div>

          <Button
            className="w-full text-base py-3"
            onClick={runAudit}
            disabled={loading || !url.trim()}
          >
            {loading ? 'Starting Audit...' : 'Run Audit'}
          </Button>

          {error && (
            <div className="text-sm text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Audits */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-50">
            Recent Audits
          </h2>
          <Link
            href="/saved"
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            View all →
          </Link>
        </div>

        {loadingAudits && <Spinner />}

        {!loadingAudits && recentAudits.length === 0 && (
          <Card className="p-4">
            <p className="text-sm text-slate-400">
              No audits yet. Run your first audit above to get started.
            </p>
          </Card>
        )}

        {!loadingAudits && recentAudits.length > 0 && (
          <div className="space-y-3">
            {recentAudits.map((audit) => (
              <Card key={audit.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-100 truncate">
                      {audit.domain || audit.url}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {audit.summary || 'Audit completed'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {audit.opportunityRating && (
                      <span className="text-xs px-2 py-1 rounded-full bg-sky-500/20 text-sky-300">
                        {audit.opportunityRating}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

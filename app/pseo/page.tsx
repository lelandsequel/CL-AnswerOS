// app/pseo/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Spinner from '@/components/Spinner';
import { PseoAuditResponse } from '@/lib/pseo-types';
import { AssetLoader } from '@/components/assets/AssetLoader';
import { ClientBriefCard } from '@/components/assets/ClientBriefCard';
import { DemoFlowStepper } from '@/components/DemoFlowStepper';
import { SiteGeneratorPanel } from '@/components/SiteGeneratorButton';
import { auditAssetToPseoForm } from '@/lib/asset-mapper';
import type { ClientAsset } from '@/lib/types';

function PSEOContent() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('asset');
  const isDemo = searchParams.get('demo') === '1';

  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    industry: '',
    geography: '',
    services: '',
    target_customer: '',
    notes: '',
    locations: '',
    loan_programs: '',
    asset_classes: '',
    use_cases: '',
  });

  const [result, setResult] = useState<PseoAuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadedAsset, setLoadedAsset] = useState<ClientAsset | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [assetLoading, setAssetLoading] = useState(false);

  // Auto-load asset from URL param
  useEffect(() => {
    if (assetId && !loadedAsset) {
      setAssetLoading(true);
      fetch(`/api/client-assets?type=audit&id=${assetId}`)
        .then(res => res.json())
        .then(assets => {
          const asset = Array.isArray(assets) ? assets[0] : assets;
          if (asset) {
            handleAssetLoaded(asset);
            if (isDemo) {
              setToastMessage('asset loaded');
            }
          }
        })
        .catch(err => {
          console.error('Failed to load asset:', err);
          setToastMessage('failed to load demo asset');
          setToastType('error');
        })
        .finally(() => setAssetLoading(false));
    }
  }, [assetId, loadedAsset, isDemo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssetLoaded = (asset: ClientAsset) => {
    const formData = auditAssetToPseoForm(asset);
    setFormData(prev => ({ ...prev, ...formData }));
    setLoadedAsset(asset);
    setToastMessage(`loaded: ${asset.title}`);
    setToastType('success');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        company_name: formData.company_name,
        website_url: formData.website_url,
        industry: formData.industry,
        geography: formData.geography,
        target_customer: formData.target_customer,
        notes: formData.notes,
      };

      // Parse comma-separated arrays
      if (formData.services) {
        payload.services = formData.services.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (formData.locations) {
        payload.locations = formData.locations.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (formData.loan_programs) {
        payload.loan_programs = formData.loan_programs.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (formData.asset_classes) {
        payload.asset_classes = formData.asset_classes.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (formData.use_cases) {
        payload.use_cases = formData.use_cases.split(',').map(s => s.trim()).filter(Boolean);
      }

      const response = await fetch('/api/pseo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate pSEO audit');
      }

      const auditResult = await response.json();
      setResult(auditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!result) return null;

    const output = result.markdown;

    return (
      <Card variant="terminal" title="~/pseo/result">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs text-slate-600">// output.md</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? 'copied' : 'copy --clipboard'}
            </Button>
            <Button
              variant="secondary"
              prefix="$"
              onClick={() => {
                const element = document.createElement('a');
                const file = new Blob([output], { type: 'text/markdown' });
                element.href = URL.createObjectURL(file);
                const companyName = (result.meta?.company_name || 'pseo-audit').toLowerCase().replace(/\s+/g, '-');
                element.download = `${companyName}.md`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              download --md
            </Button>
          </div>
        </div>

        <pre className="bg-slate-900/50 border border-slate-800 p-4 text-xs text-slate-300 overflow-auto max-h-96 whitespace-pre-wrap break-words font-mono">
          {output}
        </pre>

        {/* Site Generator */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <SiteGeneratorPanel auditData={result} />
        </div>
      </Card>
    );
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs text-slate-600 mb-2">// pseo.init()</div>
        <h1 className="text-3xl font-bold text-white mb-2">pSEO Generator</h1>
        <p className="text-slate-500 text-sm">
          Generate a programmatic SEO strategy with page types, URL structure, and sample pages.
        </p>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-violet-500 to-transparent" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 px-4 py-2 text-sm font-mono z-50 border ${
          toastType === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
            : 'bg-red-500/10 border-red-500/50 text-red-300'
        }`}>
          <span className={toastType === 'success' ? 'text-emerald-500' : 'text-red-500'}>→</span> {toastMessage}
        </div>
      )}

      {/* Demo Flow Stepper */}
      {isDemo && assetId && (
        <div className="mb-6">
          <DemoFlowStepper currentStep="pseo" assetId={assetId} />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left: Form */}
        <div className="space-y-4">
          <Card title="config">
            {/* Asset Loader */}
            <div className="mb-4">
              <AssetLoader
                assetType="audit"
                onAssetSelected={handleAssetLoaded}
                onLoaded={handleAssetLoaded}
                label="load --asset"
              />
            </div>

            {/* Client Brief Card */}
            {loadedAsset && (
              <div className="mb-4">
                <ClientBriefCard asset={loadedAsset} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                placeholder="e.g., RockSpring Capital"
              />

              <Input
                label="website_url"
                name="website_url"
                type="url"
                value={formData.website_url}
                onChange={handleChange}
                required
                placeholder="https://example.com"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Real Estate"
                />

                <Input
                  label="geography"
                  name="geography"
                  value={formData.geography}
                  onChange={handleChange}
                  required
                  placeholder="e.g., United States"
                />
              </div>

              <Input
                label="services"
                name="services"
                value={formData.services}
                onChange={handleChange}
                required
                placeholder="Bridge Loans, Construction Financing"
              />

              <Input
                label="target_customer"
                name="target_customer"
                value={formData.target_customer}
                onChange={handleChange}
                required
                placeholder="e.g., Real estate developers"
              />

              <Textarea
                label="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="// optional context"
                rows={3}
              />

              <div className="border-t border-slate-800 pt-4 mt-4">
                <div className="text-xs text-slate-600 mb-3">// optional page_types</div>

                <div className="space-y-3">
                  <Input
                    label="locations"
                    name="locations"
                    value={formData.locations}
                    onChange={handleChange}
                    placeholder="Houston, Dallas, Austin"
                  />

                  <Input
                    label="loan_programs"
                    name="loan_programs"
                    value={formData.loan_programs}
                    onChange={handleChange}
                    placeholder="Bridge Loans, Construction Loans"
                  />

                  <Input
                    label="asset_classes"
                    name="asset_classes"
                    value={formData.asset_classes}
                    onChange={handleChange}
                    placeholder="Commercial Real Estate, Multifamily"
                  />

                  <Input
                    label="use_cases"
                    name="use_cases"
                    value={formData.use_cases}
                    onChange={handleChange}
                    placeholder="Fix and Flip, Ground-Up Development"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                prefix="$"
                className="w-full"
              >
                {isLoading ? 'generating...' : 'generate --pseo'}
              </Button>
            </form>

            {error && (
              <div className="mt-4 text-xs text-red-400 border border-red-500/30 bg-red-500/5 p-3">
                <span className="text-red-500">x</span> {error}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {!result && !isLoading && (
            <div className="border border-dashed border-slate-800 p-8 text-center">
              <div className="text-slate-600 text-sm">
                <span className="text-slate-700">-&gt;</span> fill in company details and run generate --pseo
              </div>
              <div className="text-xs text-slate-700 mt-2">
                outputs: page types, URL structure, schema, 25+ sample pages
              </div>
            </div>
          )}

          {isLoading && (
            <Card variant="terminal" title="~/pseo">
              <div className="text-slate-500 text-sm">
                <span className="text-emerald-500">-&gt;</span> generating pSEO strategy<span className="animate-pulse">...</span>
              </div>
              <Spinner />
            </Card>
          )}

          {result && renderOutput()}
        </div>
      </div>

      <div className="mt-16 text-xs text-slate-800">// end of file</div>
    </main>
  );
}

export default function PSEOPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PSEOContent />
    </Suspense>
  );
}

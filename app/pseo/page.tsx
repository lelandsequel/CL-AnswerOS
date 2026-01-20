'use client';

import { useState, useEffect } from 'react';
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
import { auditAssetToPseoForm } from '@/lib/asset-mapper';
import type { ClientAsset } from '@/lib/types';

export default function PSEOPage() {
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
              setToastMessage('✓ Demo asset loaded');
            }
          }
        })
        .catch(err => {
          console.error('Failed to load asset:', err);
          setToastMessage('Failed to load demo asset');
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
    setToastMessage(`✓ Loaded: ${asset.title}`);
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
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">pSEO Audit Result</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-xs px-3 py-1"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
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
              className="text-xs px-3 py-1"
            >
              Download
            </Button>
          </div>
        </div>

        <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-gray-300 overflow-auto max-h-96 whitespace-pre-wrap break-words font-mono">
          {output}
        </pre>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF]">
              pSEO Audit Generator
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Generate a comprehensive programmatic SEO strategy with page types, URL structure, and 25+ sample pages.
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 animate-in fade-in ${
            toastType === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-300'
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          }`}>
            {toastMessage}
          </div>
        )}

        {/* Demo Flow Stepper */}
        {isDemo && assetId && (
          <DemoFlowStepper currentStep="pseo" assetId={assetId} />
        )}

        <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)]">
          {/* Left side: form */}
          <div className="space-y-3">
            {/* Asset Loader */}
            <div className="flex gap-2">
              <AssetLoader
                assetType="audit"
                onAssetSelected={handleAssetLoaded}
                onLoaded={handleAssetLoaded}
                label="📦 Load Audit Asset"
              />
            </div>

            {/* Client Brief Card */}
            {loadedAsset && (
              <ClientBriefCard asset={loadedAsset} />
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Company Name *
                </label>
                <Input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., RockSpring Capital"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Website URL *
                </label>
                <Input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  required
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Industry *
                  </label>
                  <Input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Real Estate"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Geography *
                  </label>
                  <Input
                    type="text"
                    name="geography"
                    value={formData.geography}
                    onChange={handleChange}
                    required
                    placeholder="e.g., United States"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Services (comma-separated) *
                </label>
                <Input
                  type="text"
                  name="services"
                  value={formData.services}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Bridge Loans, Construction Financing"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Target Customer *
                </label>
                <Input
                  type="text"
                  name="target_customer"
                  value={formData.target_customer}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Real estate developers"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Additional Notes
                </label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional context..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-xs text-gray-500 mb-3">Optional: Customize page types</p>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Locations (comma-separated)
                  </label>
                  <Input
                    type="text"
                    name="locations"
                    value={formData.locations}
                    onChange={handleChange}
                    placeholder="e.g., Houston, Dallas, Austin"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">
                    Loan Programs (comma-separated)
                  </label>
                  <Input
                    type="text"
                    name="loan_programs"
                    value={formData.loan_programs}
                    onChange={handleChange}
                    placeholder="e.g., Bridge Loans, Construction Loans"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">
                    Asset Classes (comma-separated)
                  </label>
                  <Input
                    type="text"
                    name="asset_classes"
                    value={formData.asset_classes}
                    onChange={handleChange}
                    placeholder="e.g., Commercial Real Estate, Multifamily"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">
                    Use Cases (comma-separated)
                  </label>
                  <Input
                    type="text"
                    name="use_cases"
                    value={formData.use_cases}
                    onChange={handleChange}
                    placeholder="e.g., Fix and Flip, Ground-Up Development"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate pSEO Audit'}
              </Button>
            </form>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {error}
              </div>
            )}
          </div>

          {/* Right side: result */}
          <div>
            {!result && !isLoading && (
              <div className="text-xs sm:text-sm text-gray-500">
                Fill in your company details and click "Generate pSEO Audit" to see page types, URL structure, schema recommendations, and 25+ sample pages.
              </div>
            )}

            {isLoading && <Spinner />}

            {result && renderOutput()}
          </div>
        </div>
      </Card>
    </div>
  );
}


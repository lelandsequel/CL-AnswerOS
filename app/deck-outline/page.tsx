'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Spinner from '@/components/Spinner';
import { DeckOutlineResult } from '@/lib/pseo-types';
import { AssetLoader } from '@/components/assets/AssetLoader';
import { ClientBriefCard } from '@/components/assets/ClientBriefCard';
import { DemoFlowStepper } from '@/components/DemoFlowStepper';
import { auditAssetToDeckOutlineForm } from '@/lib/asset-mapper';
import type { ClientAsset } from '@/lib/types';

export default function DeckOutlinePage() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('asset');
  const isDemo = searchParams.get('demo') === '1';

  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    industry: '',
    current_challenges: '',
    target_outcomes: '',
    budget_range: '',
    timeline: '',
  });

  const [result, setResult] = useState<DeckOutlineResult | null>(null);
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
    const formValues = auditAssetToDeckOutlineForm(asset);
    setFormData(prev => ({ ...prev, ...formValues }));
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
      const challenges = formData.current_challenges
        .split('\n')
        .map(c => c.trim())
        .filter(c => c);

      const outcomes = formData.target_outcomes
        .split('\n')
        .map(o => o.trim())
        .filter(o => o);

      const response = await fetch('/api/deck-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          current_challenges: challenges,
          target_outcomes: outcomes,
        }),
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
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">Proposal Deck Outline</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(result.outline);
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
                const file = new Blob([result.outline], { type: 'text/markdown' });
                element.href = URL.createObjectURL(file);
                element.download = `deck-outline-${result.company_name.toLowerCase().replace(/\s+/g, '-')}.md`;
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
          {result.outline}
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
              Proposal Deck Outline Generator
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Generate a comprehensive 14-slide proposal deck outline with speaker notes and visual suggestions.
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
          <DemoFlowStepper currentStep="deck" assetId={assetId} />
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
                  placeholder="e.g., Commercial Real Estate Finance"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Current Challenges (one per line) *
                </label>
                <Textarea
                  name="current_challenges"
                  value={formData.current_challenges}
                  onChange={handleChange}
                  required
                  placeholder="Limited organic visibility&#10;Missing from AI search results&#10;Inconsistent lead quality"
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Target Outcomes (one per line) *
                </label>
                <Textarea
                  name="target_outcomes"
                  value={formData.target_outcomes}
                  onChange={handleChange}
                  required
                  placeholder="Rank for 200+ keywords&#10;Appear in AI Overviews&#10;2-3x increase in qualified leads"
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Budget Range
                  </label>
                  <Input
                    type="text"
                    name="budget_range"
                    value={formData.budget_range}
                    onChange={handleChange}
                    placeholder="e.g., $25K-$50K"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Timeline
                  </label>
                  <Input
                    type="text"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    placeholder="e.g., 90 days"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Generate Deck Outline'}
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
                Fill in your client details and click "Generate Deck Outline" to see a 14-slide proposal deck with speaker notes and visual suggestions.
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


'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Spinner from '@/components/Spinner';
import { PSEOAuditResult } from '@/lib/pseo-types';

export default function PSEOPage() {
  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    industry: '',
    geography: '',
    services: '',
    target_customer: '',
    notes: '',
  });

  const [result, setResult] = useState<PSEOAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const services = formData.services
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const response = await fetch('/api/pseo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          services,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate pSEO audit');
      }

      const { data: auditResult } = await response.json();
      setResult(auditResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!result) return null;

    const output = `# pSEO Audit: ${result.company_name}

## Overview
- **Industry:** ${result.industry}
- **Total Estimated Pages:** ${result.totalEstimatedPages}

## Page Types

${result.pageTypes
  .map(
    (pt) => `### ${pt.name}
- **Description:** ${pt.description}
- **URL Pattern:** \`${pt.urlPattern}\`
- **Estimated Count:** ${pt.estimatedCount}
- **Template Sections:** ${pt.templateSections.join(', ')}
- **Schema Types:** ${pt.schemaTypes.join(', ')}`
  )
  .join('\n\n')}

## URL Structure
${result.urlStructure}

## Internal Linking Strategy
${result.internalLinkingStrategy}

## Schema Recommendations
${result.schemaRecommendations.map((s) => `- ${s}`).join('\n')}

## Sample Pages (${result.samplePages.length} total)

${result.samplePages
  .map((p) => {
    const metrics = p.metrics ? ` | Vol: ${p.metrics.searchVolume} | CPC: $${p.metrics.cpc.toFixed(2)} | Comp: ${(p.metrics.competition * 100).toFixed(0)}%` : '';
    return `- **${p.title}** (\`${p.url}\`) - ${p.pageType}${metrics}`;
  })
  .join('\n')}

## Content Templates

${Object.entries(result.contentTemplates)
  .map(
    ([pageType, sections]) => `### ${pageType}
${(sections as string[]).map((s) => `- ${s}`).join('\n')}`
  )
  .join('\n\n')}
`;

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
                element.download = `pseo-audit-${result.company_name.toLowerCase().replace(/\s+/g, '-')}.md`;
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

        <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)]">
          {/* Left side: form */}
          <div className="space-y-3">
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


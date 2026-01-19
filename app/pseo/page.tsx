'use client';

import { useState } from 'react';
import { PSEOAuditForm } from '@/components/PSEOAuditForm';
import { OutputPanel } from '@/components/OutputPanel';
import { PSEOAuditResult } from '@/lib/pseo-types';

export default function PSEOPage() {
  const [result, setResult] = useState<PSEOAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pseo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
  .map((p) => `- **${p.title}** (\`${p.url}\`) - ${p.pageType}`)
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
      <OutputPanel
        title="pSEO Audit Result"
        content={output}
        filename={`pseo-audit-${result.company_name.toLowerCase().replace(/\s+/g, '-')}.md`}
      />
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">pSEO Audit</h1>
        <p className="text-slate-400">
          Generate a comprehensive programmatic SEO strategy for your website
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold text-slate-50 mb-4">
            Company Information
          </h2>
          <PSEOAuditForm onSubmit={handleSubmit} isLoading={isLoading} />
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


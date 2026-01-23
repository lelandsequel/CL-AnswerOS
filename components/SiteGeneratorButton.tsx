'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateSiteZip, SITE_TEMPLATES, type SiteTemplate } from '@/lib/site-generator';
import type { PseoAuditResponse } from '@/lib/pseo-types';
import type { StructuredAudit, KeywordMetric } from '@/lib/types';

interface SiteGeneratorButtonProps {
  auditData: PseoAuditResponse;
  structuredAudit?: StructuredAudit;
  keywordMetrics?: KeywordMetric[];
  format?: 'html' | 'nextjs';
  template?: SiteTemplate;
  brandColor?: string;
  className?: string;
}

export function SiteGeneratorButton({
  auditData,
  structuredAudit,
  keywordMetrics,
  format = 'html',
  template = 'clean',
  brandColor,
  className = '',
}: SiteGeneratorButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const blob = await generateSiteZip(
        auditData,
        {
          format,
          template,
          brandColor,
          includeStyles: true,
        },
        structuredAudit,
        keywordMetrics
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${auditData.meta.company_name.toLowerCase().replace(/\s+/g, '-')}-site-${template}-${format}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Site generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGenerate}
      disabled={isGenerating}
      className={`text-xs ${className}`}
    >
      {isGenerating ? 'Generating...' : format === 'nextjs' ? 'Next.js' : 'HTML'}
    </Button>
  );
}

interface SiteGeneratorPanelProps {
  auditData: PseoAuditResponse;
  structuredAudit?: StructuredAudit;
  keywordMetrics?: KeywordMetric[];
}

export function SiteGeneratorPanel({ auditData, structuredAudit, keywordMetrics }: SiteGeneratorPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate>('clean');
  const hasFullAudit = !!structuredAudit;

  const templates = Object.values(SITE_TEMPLATES);

  return (
    <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🚀</span>
        <h3 className="text-sm font-semibold text-green-300">Generate Website</h3>
        {hasFullAudit && (
          <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
            Full SEO + AEO
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Turn your pSEO audit into a deployable website with all {auditData.totals.total_pages} pages,
        proper SEO meta tags, and schema markup.
        {hasFullAudit && ' Enhanced with positioning, messaging pillars, and AEO optimization from your full audit.'}
      </p>

      {/* Template Selector */}
      <div className="mb-4">
        <label className="text-xs text-gray-500 mb-2 block">Choose a template:</label>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedTemplate === t.id
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{t.preview}</span>
                <span className="text-xs font-medium text-gray-200">{t.name}</span>
              </div>
              <p className="text-[10px] text-gray-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Template Preview */}
      <div className="mb-4 p-3 rounded-lg bg-black/20 border border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded"
            style={{ background: SITE_TEMPLATES[selectedTemplate].colors.primary }}
          />
          <div>
            <p className="text-xs font-medium text-gray-300">
              {SITE_TEMPLATES[selectedTemplate].name}
            </p>
            <p className="text-[10px] text-gray-500">
              {SITE_TEMPLATES[selectedTemplate].style.buttonStyle} buttons,{' '}
              {SITE_TEMPLATES[selectedTemplate].style.heroStyle} hero,{' '}
              {SITE_TEMPLATES[selectedTemplate].typography.fontFamily.split(',')[0].replace(/'/g, '')}
            </p>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-2">
        <SiteGeneratorButton
          auditData={auditData}
          structuredAudit={structuredAudit}
          keywordMetrics={keywordMetrics}
          template={selectedTemplate}
          format="html"
        />
        <SiteGeneratorButton
          auditData={auditData}
          structuredAudit={structuredAudit}
          keywordMetrics={keywordMetrics}
          template={selectedTemplate}
          format="nextjs"
        />
      </div>

      <p className="text-[10px] text-gray-500 mt-3">
        HTML: Static files ready to upload anywhere.
        Next.js: Full React project with TypeScript + Tailwind.
      </p>
    </div>
  );
}

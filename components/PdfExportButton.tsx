'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateAuditPdf, generateSimpleReportPdf } from '@/lib/pdf-export';
import type { OperatorReport, StructuredAudit } from '@/lib/types';

interface PdfExportButtonProps {
  // For full audit PDF
  auditData?: {
    url: string;
    clientName?: string;
    structuredAudit?: StructuredAudit;
    report?: OperatorReport;
  };
  // For simple text export
  simpleExport?: {
    content: string;
    title: string;
    filename: string;
  };
  // UI customization
  label?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
}

export function PdfExportButton({
  auditData,
  simpleExport,
  label = 'Export PDF',
  variant = 'outline',
  className = '',
  disabled = false,
}: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Small delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (auditData) {
        generateAuditPdf({
          title: 'SEO/AEO Audit Report',
          url: auditData.url,
          clientName: auditData.clientName,
          structuredAudit: auditData.structuredAudit,
          report: auditData.report,
        });
      } else if (simpleExport) {
        generateSimpleReportPdf(
          simpleExport.content,
          simpleExport.title,
          simpleExport.filename
        );
      }
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = disabled || (!auditData && !simpleExport);

  return (
    <Button
      variant={variant}
      onClick={handleExport}
      disabled={isDisabled || isExporting}
      className={`text-xs ${className}`}
    >
      {isExporting ? 'Generating...' : label}
    </Button>
  );
}

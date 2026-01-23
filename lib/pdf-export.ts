// lib/pdf-export.ts
// Client-side PDF generation for audit reports

import jsPDF from 'jspdf';
import type { OperatorReport } from './types';

interface AuditPdfOptions {
  title: string;
  url: string;
  clientName?: string;
  report?: OperatorReport;
  structuredAudit?: {
    overview?: {
      domain: string;
      current_state: string;
      opportunity_rating: string;
      raw_score: number;
    };
    core_issues?: Array<{
      category: string;
      severity: string;
      symptoms: string[];
      business_impact: string;
    }>;
    aeo_opportunities?: Array<{
      focus: string;
      tactics: string[];
      expected_impact: string;
    }>;
    quick_wins_48h?: Array<{
      action: string;
      impact_score: number;
      effort_level: string;
    }>;
    investment_outlook?: {
      recommended_budget_range: string;
      projected_roi: string;
      notes?: string;
    };
  };
  branding?: {
    companyName?: string;
    primaryColor?: string;
  };
}

// Colors
const COLORS = {
  primary: [10, 132, 255] as [number, number, number], // #0A84FF
  dark: [15, 23, 42] as [number, number, number], // slate-900
  text: [255, 255, 255] as [number, number, number],
  textMuted: [156, 163, 175] as [number, number, number], // gray-400
  accent: [34, 197, 94] as [number, number, number], // green-500
  warning: [234, 179, 8] as [number, number, number], // yellow-500
  danger: [239, 68, 68] as [number, number, number], // red-500
};

function getSeverityColor(severity: string): [number, number, number] {
  switch (severity.toLowerCase()) {
    case 'critical':
      return COLORS.danger;
    case 'high':
      return [249, 115, 22]; // orange-500
    case 'medium':
      return COLORS.warning;
    default:
      return COLORS.accent;
  }
}

export function generateAuditPdf(options: AuditPdfOptions): void {
  const { title, url, clientName, report, structuredAudit, branding } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to add text with word wrap
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number = 5
  ): number => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  // ============================================
  // HEADER
  // ============================================
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(branding?.companyName || 'C&L Strategy', margin, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('SEO / AEO Audit Report', margin, 30);

  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), pageWidth - margin - 40, 30);

  yPos = 55;

  // ============================================
  // AUDIT TARGET INFO
  // ============================================
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');

  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(9);
  doc.text('AUDIT TARGET', margin + 5, yPos + 7);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(clientName || url, margin + 5, yPos + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(url, margin + 5, yPos + 22);

  yPos += 35;

  // ============================================
  // OVERVIEW SECTION
  // ============================================
  if (structuredAudit?.overview) {
    const overview = structuredAudit.overview;

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Overview', margin, yPos);
    yPos += 8;

    // Opportunity rating badge
    const rating = overview.opportunity_rating || 'Medium';
    const ratingColor = rating === 'High' ? COLORS.accent :
                        rating === 'Low' ? COLORS.danger : COLORS.warning;

    doc.setFillColor(...ratingColor);
    doc.roundedRect(margin, yPos, 35, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${rating} Opportunity`, margin + 3, yPos + 5.5);

    // Score
    if (overview.raw_score) {
      doc.setTextColor(...COLORS.textMuted);
      doc.setFont('helvetica', 'normal');
      doc.text(`Score: ${overview.raw_score}/100`, margin + 42, yPos + 5.5);
    }

    yPos += 15;

    // Current state
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(overview.current_state || '', margin, yPos, contentWidth);
    yPos += 10;
  }

  // ============================================
  // CORE ISSUES
  // ============================================
  if (structuredAudit?.core_issues && structuredAudit.core_issues.length > 0) {
    checkNewPage(40);

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Core Issues Identified', margin, yPos);
    yPos += 10;

    for (const issue of structuredAudit.core_issues) {
      checkNewPage(30);

      // Issue header
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');

      // Severity badge
      const sevColor = getSeverityColor(issue.severity);
      doc.setFillColor(...sevColor);
      doc.roundedRect(margin + 2, yPos + 1.5, 20, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(issue.severity.toUpperCase(), margin + 4, yPos + 5);

      // Category
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(10);
      doc.text(issue.category, margin + 26, yPos + 5.5);

      yPos += 12;

      // Symptoms
      doc.setTextColor(...COLORS.textMuted);
      doc.setFontSize(8);
      for (const symptom of issue.symptoms.slice(0, 3)) {
        doc.text(`• ${symptom}`, margin + 5, yPos);
        yPos += 4;
      }

      // Business impact
      doc.setTextColor(...COLORS.text);
      doc.setFontSize(9);
      yPos = addWrappedText(issue.business_impact, margin + 5, yPos + 2, contentWidth - 10, 4);
      yPos += 8;
    }
  }

  // ============================================
  // AEO OPPORTUNITIES
  // ============================================
  if (structuredAudit?.aeo_opportunities && structuredAudit.aeo_opportunities.length > 0) {
    checkNewPage(40);

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AEO Opportunities', margin, yPos);
    yPos += 10;

    for (const opp of structuredAudit.aeo_opportunities) {
      checkNewPage(25);

      doc.setTextColor(...COLORS.accent);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`→ ${opp.focus}`, margin, yPos);
      yPos += 6;

      doc.setTextColor(...COLORS.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      for (const tactic of opp.tactics.slice(0, 3)) {
        doc.text(`• ${tactic}`, margin + 5, yPos);
        yPos += 4;
      }

      doc.setTextColor(...COLORS.text);
      doc.setFontSize(9);
      doc.text(`Expected Impact: ${opp.expected_impact}`, margin + 5, yPos);
      yPos += 8;
    }
  }

  // ============================================
  // QUICK WINS
  // ============================================
  if (structuredAudit?.quick_wins_48h && structuredAudit.quick_wins_48h.length > 0) {
    checkNewPage(40);

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Quick Wins (48 Hours)', margin, yPos);
    yPos += 10;

    for (const win of structuredAudit.quick_wins_48h.slice(0, 5)) {
      checkNewPage(12);

      // Impact score indicator
      const impactColor = win.impact_score >= 8 ? COLORS.accent :
                          win.impact_score >= 5 ? COLORS.warning : COLORS.textMuted;
      doc.setFillColor(...impactColor);
      doc.circle(margin + 3, yPos - 1, 2, 'F');

      doc.setTextColor(...COLORS.text);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(win.action, margin + 8, yPos);

      doc.setTextColor(...COLORS.textMuted);
      doc.setFontSize(8);
      doc.text(`Impact: ${win.impact_score}/10 | Effort: ${win.effort_level}`,
               pageWidth - margin - 45, yPos);

      yPos += 7;
    }
    yPos += 5;
  }

  // ============================================
  // INVESTMENT OUTLOOK
  // ============================================
  if (structuredAudit?.investment_outlook) {
    checkNewPage(40);

    const outlook = structuredAudit.investment_outlook;

    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Investment Outlook', margin + 5, yPos + 8);

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.text(`Budget Range: ${outlook.recommended_budget_range}`, margin + 5, yPos + 18);

    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(
      `Projected ROI: ${outlook.projected_roi}`,
      margin + 5,
      yPos + 26,
      contentWidth - 10,
      4
    );

    yPos += 45;
  }

  // ============================================
  // OPERATOR REPORTS (if provided)
  // ============================================
  if (report?.boardSummary) {
    doc.addPage();
    yPos = margin;

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Board Summary', margin, yPos);
    yPos += 10;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.boardSummary, margin, yPos, contentWidth, 5);
  }

  if (report?.moneyboard) {
    checkNewPage(60);
    yPos += 15;

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Moneyboard: Execution Roadmap', margin, yPos);
    yPos += 10;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.moneyboard, margin, yPos, contentWidth, 5);
  }

  // ============================================
  // FOOTER ON ALL PAGES
  // ============================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(8);
    doc.text(
      `Generated by ${branding?.companyName || 'C&L Strategy'} | ${url}`,
      margin,
      pageHeight - 10
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
  }

  // Save
  const filename = `audit-report-${clientName?.toLowerCase().replace(/\s+/g, '-') || 'export'}-${Date.now()}.pdf`;
  doc.save(filename);
}

export function generateSimpleReportPdf(
  content: string,
  title: string,
  filename: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 20);

  // Content
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const lines = doc.splitTextToSize(content, contentWidth);
  doc.text(lines, margin, 45);

  doc.save(filename);
}

// lib/site-generator.ts
// Generates deployable websites from pSEO audit + main audit data
// Implements 5 pillars of SEO + AEO best practices

import JSZip from 'jszip';
import type { PseoAuditResponse, PseoPage } from './pseo-types';
import type { StructuredAudit, KeywordMetric } from './types';

// ============================================
// TEMPLATE SYSTEM
// ============================================

export type SiteTemplate = 'clean' | 'bold' | 'corporate' | 'dark';

export interface TemplateConfig {
  id: SiteTemplate;
  name: string;
  description: string;
  preview: string; // emoji/icon for UI
  colors: {
    primary: string;
    primaryDark: string;
    text: string;
    textMuted: string;
    textLight: string;
    bg: string;
    bgSecondary: string;
    bgDark: string;
    border: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: string;
    bodyLineHeight: string;
  };
  style: {
    borderRadius: string;
    cardShadow: string;
    cardHoverShadow: string;
    headerStyle: 'solid' | 'gradient' | 'transparent';
    heroStyle: 'gradient' | 'solid' | 'image-ready';
    buttonStyle: 'rounded' | 'pill' | 'sharp';
  };
}

export const SITE_TEMPLATES: Record<SiteTemplate, TemplateConfig> = {
  clean: {
    id: 'clean',
    name: 'Clean & Minimal',
    description: 'Professional, lots of whitespace, modern simplicity',
    preview: '✨',
    colors: {
      primary: '#0A84FF',
      primaryDark: '#0066CC',
      text: '#1f2937',
      textMuted: '#6b7280',
      textLight: '#9ca3af',
      bg: '#ffffff',
      bgSecondary: '#f9fafb',
      bgDark: '#111827',
      border: '#e5e7eb',
      accent: '#10b981',
    },
    typography: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      headingWeight: '700',
      bodyLineHeight: '1.7',
    },
    style: {
      borderRadius: '12px',
      cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
      cardHoverShadow: '0 8px 24px rgba(0,0,0,0.08)',
      headerStyle: 'solid',
      heroStyle: 'gradient',
      buttonStyle: 'rounded',
    },
  },
  bold: {
    id: 'bold',
    name: 'Bold & Modern',
    description: 'Vibrant colors, strong gradients, tech-forward',
    preview: '🚀',
    colors: {
      primary: '#7C3AED',
      primaryDark: '#5B21B6',
      text: '#0f172a',
      textMuted: '#475569',
      textLight: '#94a3b8',
      bg: '#ffffff',
      bgSecondary: '#f8fafc',
      bgDark: '#0f172a',
      border: '#e2e8f0',
      accent: '#f59e0b',
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      headingWeight: '800',
      bodyLineHeight: '1.75',
    },
    style: {
      borderRadius: '16px',
      cardShadow: '0 4px 12px rgba(124, 58, 237, 0.1)',
      cardHoverShadow: '0 20px 40px rgba(124, 58, 237, 0.15)',
      headerStyle: 'gradient',
      heroStyle: 'gradient',
      buttonStyle: 'pill',
    },
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Traditional, professional, trustworthy',
    preview: '🏢',
    colors: {
      primary: '#1e40af',
      primaryDark: '#1e3a8a',
      text: '#1e293b',
      textMuted: '#64748b',
      textLight: '#94a3b8',
      bg: '#ffffff',
      bgSecondary: '#f1f5f9',
      bgDark: '#0f172a',
      border: '#cbd5e1',
      accent: '#059669',
    },
    typography: {
      fontFamily: "'Georgia', 'Times New Roman', serif",
      headingWeight: '700',
      bodyLineHeight: '1.8',
    },
    style: {
      borderRadius: '4px',
      cardShadow: '0 1px 2px rgba(0,0,0,0.05)',
      cardHoverShadow: '0 4px 12px rgba(0,0,0,0.1)',
      headerStyle: 'solid',
      heroStyle: 'solid',
      buttonStyle: 'sharp',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Sleek dark theme, modern and elegant',
    preview: '🌙',
    colors: {
      primary: '#60a5fa',
      primaryDark: '#3b82f6',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      textLight: '#64748b',
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      bgDark: '#020617',
      border: '#334155',
      accent: '#34d399',
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      headingWeight: '600',
      bodyLineHeight: '1.7',
    },
    style: {
      borderRadius: '8px',
      cardShadow: '0 2px 8px rgba(0,0,0,0.3)',
      cardHoverShadow: '0 8px 32px rgba(0,0,0,0.4)',
      headerStyle: 'transparent',
      heroStyle: 'gradient',
      buttonStyle: 'rounded',
    },
  },
};

export interface SiteGeneratorOptions {
  format: 'html' | 'nextjs';
  template?: SiteTemplate;
  includeStyles?: boolean;
  brandColor?: string; // overrides template primary color
  footerText?: string;
}

export interface FullSiteData {
  pseoAudit: PseoAuditResponse;
  structuredAudit?: StructuredAudit;
  keywordMetrics?: KeywordMetric[];
}

interface GeneratedFile {
  path: string;
  content: string;
}

interface ContentContext {
  meta: PseoAuditResponse['meta'];
  positioning: string;
  messagingPillars: string[];
  contentPillars: string[];
  targetPersona: string;
  painPoints: string[];
  aeoOpportunities: Array<{ focus: string; tactics: string[] }>;
  quickWins: string[];
  brandColor: string;
  footerText: string;
  template: TemplateConfig;
}

// ============================================
// EXTRACT CONTENT CONTEXT FROM AUDITS
// ============================================

function buildContentContext(
  data: FullSiteData,
  options: SiteGeneratorOptions
): ContentContext {
  const { pseoAudit, structuredAudit } = data;
  const meta = pseoAudit.meta;
  const playbook = structuredAudit?.content_playbook;
  const template = SITE_TEMPLATES[options.template || 'clean'];

  return {
    meta,
    positioning: playbook?.positioning_statement ||
      `${meta.company_name} delivers expert ${meta.industry.toLowerCase()} solutions for ${meta.target_customer}.`,
    messagingPillars: playbook?.key_messaging_pillars || [
      `Trusted ${meta.industry} expertise`,
      `Tailored solutions for ${meta.target_customer}`,
      `Proven results in ${meta.geography}`,
    ],
    contentPillars: playbook?.content_pillars || [
      meta.industry,
      'Best practices',
      'Industry insights',
    ],
    targetPersona: playbook?.target_persona?.summary || meta.target_customer,
    painPoints: playbook?.target_persona?.pain_points || [
      'Finding the right partner',
      'Getting results quickly',
      'Understanding options',
    ],
    aeoOpportunities: structuredAudit?.aeo_opportunities || [],
    quickWins: structuredAudit?.quick_wins_48h?.map(w => w.action) || [],
    brandColor: options.brandColor || template.colors.primary,
    footerText: options.footerText || 'All rights reserved.',
    template,
  };
}

// ============================================
// SCHEMA MARKUP GENERATORS (AEO)
// ============================================

function generateOrganizationSchema(ctx: ContentContext): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ctx.meta.company_name,
    url: ctx.meta.website_url,
    description: ctx.positioning,
    areaServed: ctx.meta.geography,
    knowsAbout: ctx.contentPillars,
  };
}

function generateServiceSchema(page: PseoPage, ctx: ContentContext): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    provider: {
      '@type': 'Organization',
      name: ctx.meta.company_name,
    },
    areaServed: ctx.meta.geography,
    description: `${page.title} - ${ctx.positioning}`,
    audience: {
      '@type': 'Audience',
      audienceType: ctx.targetPersona,
    },
  };
}

function generateFAQSchema(page: PseoPage, ctx: ContentContext): object {
  const faqs = generateFAQsForPage(page, ctx);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function generateSpeakableSchema(page: PseoPage, ctx: ContentContext): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.speakable-intro', '.speakable-summary', 'h1'],
    },
    description: `${page.title} services from ${ctx.meta.company_name}`,
  };
}

function generateHowToSchema(page: PseoPage, ctx: ContentContext): object | null {
  if (!page.template_sections.includes('Process')) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to get ${page.title.toLowerCase()}`,
    description: `Step-by-step guide to ${page.title.toLowerCase()} with ${ctx.meta.company_name}`,
    step: [
      {
        '@type': 'HowToStep',
        name: 'Initial Consultation',
        text: `Contact ${ctx.meta.company_name} to discuss your ${page.primary_keyword.toLowerCase()} needs.`,
      },
      {
        '@type': 'HowToStep',
        name: 'Assessment',
        text: 'We analyze your requirements and provide tailored recommendations.',
      },
      {
        '@type': 'HowToStep',
        name: 'Proposal',
        text: 'Receive a detailed proposal with timeline and investment.',
      },
      {
        '@type': 'HowToStep',
        name: 'Execution',
        text: 'Our team implements the solution with ongoing support.',
      },
    ],
  };
}

function generateBreadcrumbSchema(page: PseoPage, ctx: ContentContext): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: ctx.meta.website_url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title,
        item: `${ctx.meta.website_url}/${page.path}`,
      },
    ],
  };
}

function generateAllSchemas(page: PseoPage, ctx: ContentContext): string {
  const schemas: object[] = [
    generateOrganizationSchema(ctx),
    generateBreadcrumbSchema(page, ctx),
  ];

  if (page.schema_types.includes('Service')) {
    schemas.push(generateServiceSchema(page, ctx));
  }

  if (page.schema_types.includes('FAQPage')) {
    schemas.push(generateFAQSchema(page, ctx));
  }

  // AEO: Add speakable for voice search
  schemas.push(generateSpeakableSchema(page, ctx));

  // AEO: Add HowTo for process pages
  const howTo = generateHowToSchema(page, ctx);
  if (howTo) schemas.push(howTo);

  return schemas.map(s => JSON.stringify(s, null, 2)).join('\n');
}

// ============================================
// CONTENT GENERATORS
// ============================================

function generateFAQsForPage(page: PseoPage, ctx: ContentContext): Array<{ question: string; answer: string }> {
  const faqs = [
    {
      question: `What is ${page.title}?`,
      answer: `${page.title} is a key offering from ${ctx.meta.company_name}, designed specifically for ${ctx.targetPersona}. ${ctx.positioning}`,
    },
    {
      question: `Who is ${page.title} for?`,
      answer: `${page.title} is ideal for ${ctx.targetPersona} who are looking for ${page.primary_keyword.toLowerCase()} solutions. Common pain points we address include: ${ctx.painPoints.slice(0, 2).join(', ')}.`,
    },
    {
      question: `Why choose ${ctx.meta.company_name} for ${page.title}?`,
      answer: `${ctx.messagingPillars[0]}. ${ctx.messagingPillars[1] || ''} We serve clients across ${ctx.meta.geography}.`,
    },
    {
      question: `How do I get started with ${page.title}?`,
      answer: `Contact ${ctx.meta.company_name} for a consultation. We'll assess your needs and provide a tailored recommendation.`,
    },
  ];

  // Add keyword-specific FAQs
  page.secondary_keywords.slice(0, 2).forEach(kw => {
    faqs.push({
      question: `How does ${kw.toLowerCase()} work?`,
      answer: `${kw} is part of our ${page.title.toLowerCase()} offering. Contact us to learn how we can help with your specific ${kw.toLowerCase()} needs.`,
    });
  });

  return faqs;
}

function generateBenefitsFromPainPoints(ctx: ContentContext): string[] {
  return ctx.painPoints.map(pain => {
    // Transform pain points into benefits
    if (pain.toLowerCase().includes('finding')) {
      return `Expert guidance to find the right solution`;
    }
    if (pain.toLowerCase().includes('time') || pain.toLowerCase().includes('quick')) {
      return `Fast turnaround with dedicated support`;
    }
    if (pain.toLowerCase().includes('understand') || pain.toLowerCase().includes('complex')) {
      return `Clear, transparent process with no jargon`;
    }
    if (pain.toLowerCase().includes('cost') || pain.toLowerCase().includes('price')) {
      return `Competitive pricing with flexible options`;
    }
    if (pain.toLowerCase().includes('trust') || pain.toLowerCase().includes('reliable')) {
      return `Proven track record with verified results`;
    }
    return `Solution for: ${pain}`;
  });
}

function generateAEOContentBlock(ctx: ContentContext): string {
  if (ctx.aeoOpportunities.length === 0) return '';

  const opportunities = ctx.aeoOpportunities.slice(0, 3);

  return `
    <section class="aeo-block section-alt">
      <div class="container">
        <h2>How We Help (AI-Optimized)</h2>
        <p class="speakable-intro">${ctx.positioning}</p>
        <div class="grid">
          ${opportunities.map(opp => `
          <div class="card">
            <h3>${escapeHtml(opp.focus)}</h3>
            <ul>
              ${opp.tactics.slice(0, 3).map(t => `<li>${escapeHtml(t)}</li>`).join('')}
            </ul>
          </div>
          `).join('')}
        </div>
      </div>
    </section>`;
}

// ============================================
// TEMPLATE-BASED CSS GENERATOR
// ============================================

function generateTemplateCSS(ctx: ContentContext): string {
  const t = ctx.template;
  const c = t.colors;
  const brandDark = adjustColor(ctx.brandColor, -20);

  // Determine button border-radius based on style
  const btnRadius = t.style.buttonStyle === 'pill' ? '50px' :
                    t.style.buttonStyle === 'sharp' ? '4px' : t.style.borderRadius;

  // Header background based on style
  const headerBg = t.style.headerStyle === 'gradient'
    ? `linear-gradient(135deg, ${ctx.brandColor} 0%, ${brandDark} 100%)`
    : t.style.headerStyle === 'transparent'
    ? c.bgSecondary
    : ctx.brandColor;

  const headerTextColor = t.style.headerStyle === 'transparent' ? c.text : 'white';

  // Hero background
  const heroBg = t.style.heroStyle === 'gradient'
    ? `linear-gradient(135deg, ${ctx.brandColor} 0%, ${brandDark} 100%)`
    : ctx.brandColor;

  // Dark theme card adjustments
  const cardBg = t.id === 'dark' ? c.bgSecondary : 'white';
  const cardBorder = t.id === 'dark' ? c.border : c.border;

  return `
    :root {
      --brand-color: ${ctx.brandColor};
      --brand-dark: ${brandDark};
      --text-color: ${c.text};
      --text-muted: ${c.textMuted};
      --text-light: ${c.textLight};
      --bg-color: ${c.bg};
      --bg-secondary: ${c.bgSecondary};
      --bg-dark: ${c.bgDark};
      --border-color: ${c.border};
      --accent-color: ${c.accent};
      --radius: ${t.style.borderRadius};
      --btn-radius: ${btnRadius};
    }

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: ${t.typography.fontFamily};
      line-height: ${t.typography.bodyLineHeight};
      color: var(--text-color);
      background: var(--bg-color);
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    /* Header & Navigation */
    header {
      background: ${headerBg};
      color: ${headerTextColor};
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
      ${t.style.headerStyle !== 'transparent' ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : 'border-bottom: 1px solid var(--border-color);'}
    }
    header .container { display: flex; align-items: center; justify-content: space-between; }
    header h1 { font-size: 1.25rem; font-weight: ${t.typography.headingWeight}; }
    nav a {
      color: ${t.style.headerStyle === 'transparent' ? 'var(--text-muted)' : 'rgba(255,255,255,0.9)'};
      text-decoration: none;
      margin-left: 24px;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    nav a:hover {
      ${t.style.headerStyle === 'transparent' ? 'color: var(--brand-color);' : 'opacity: 0.8;'}
    }

    /* Hero Section */
    .hero {
      background: ${heroBg};
      color: white;
      padding: ${t.id === 'bold' ? '100px 0' : '80px 0'};
      text-align: center;
    }
    .hero h1 {
      font-size: ${t.id === 'bold' ? '3.5rem' : '2.75rem'};
      margin-bottom: 20px;
      font-weight: ${t.typography.headingWeight};
      line-height: 1.2;
      ${t.id === 'bold' ? 'letter-spacing: -0.02em;' : ''}
    }
    .hero p { font-size: 1.25rem; opacity: 0.9; max-width: 700px; margin: 0 auto 32px; }
    .hero .positioning { font-size: 1.1rem; opacity: 0.85; margin-bottom: 32px; font-style: italic; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: ${t.id === 'bold' ? '16px 36px' : '14px 32px'};
      border-radius: var(--btn-radius);
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.25s ease;
      cursor: pointer;
      border: none;
      ${t.id === 'bold' ? 'text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.9rem;' : ''}
    }
    .btn-primary {
      background: white;
      color: var(--brand-color);
      ${t.id === 'bold' ? 'box-shadow: 0 4px 14px rgba(0,0,0,0.15);' : ''}
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    }
    .btn-secondary {
      background: var(--brand-color);
      color: white;
    }
    .btn-secondary:hover {
      background: var(--brand-dark);
      transform: translateY(-1px);
    }
    .btn-outline {
      background: transparent;
      border: 2px solid ${t.id === 'dark' ? 'var(--brand-color)' : 'white'};
      color: ${t.id === 'dark' ? 'var(--brand-color)' : 'white'};
    }
    .btn-outline:hover {
      background: ${t.id === 'dark' ? 'var(--brand-color)' : 'white'};
      color: ${t.id === 'dark' ? 'white' : 'var(--brand-color)'};
    }

    /* Sections */
    .section { padding: ${t.id === 'bold' ? '100px 0' : '80px 0'}; }
    .section-alt { background: var(--bg-secondary); }
    .section h2 {
      font-size: ${t.id === 'bold' ? '2.5rem' : '2rem'};
      margin-bottom: 16px;
      text-align: center;
      font-weight: ${t.typography.headingWeight};
      ${t.id === 'bold' ? 'letter-spacing: -0.01em;' : ''}
    }
    .section .section-intro {
      text-align: center;
      color: var(--text-muted);
      max-width: 700px;
      margin: 0 auto 48px;
    }

    /* Grid System */
    .grid { display: grid; gap: ${t.id === 'bold' ? '32px' : '24px'}; }
    .grid-2 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    .grid-3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .grid-4 { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

    /* Cards */
    .card {
      background: ${cardBg};
      border: 1px solid ${cardBorder};
      border-radius: var(--radius);
      padding: ${t.id === 'bold' ? '36px' : '32px'};
      transition: all 0.3s ease;
      box-shadow: ${t.style.cardShadow};
    }
    .card:hover {
      box-shadow: ${t.style.cardHoverShadow};
      transform: translateY(-${t.id === 'bold' ? '8px' : '4px'});
      ${t.id === 'bold' ? 'border-color: var(--brand-color);' : ''}
    }
    .card h3 {
      font-size: 1.25rem;
      margin-bottom: 12px;
      color: var(--brand-color);
      font-weight: ${t.typography.headingWeight};
    }
    .card p { color: var(--text-muted); margin-bottom: 16px; }
    .card ul { margin: 16px 0; padding-left: 20px; }
    .card li { color: var(--text-muted); margin-bottom: 8px; }
    .card-link {
      color: var(--brand-color);
      font-weight: 600;
      text-decoration: none;
      ${t.id === 'bold' ? 'display: inline-flex; align-items: center; gap: 6px;' : ''}
    }
    .card-link:hover { text-decoration: underline; }
    ${t.id === 'bold' ? '.card-link::after { content: "→"; transition: transform 0.2s; } .card-link:hover::after { transform: translateX(4px); }' : ''}

    /* Benefits Section */
    .benefit-item { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
    .benefit-icon {
      width: 48px;
      height: 48px;
      background: ${t.id === 'bold' ? 'linear-gradient(135deg, var(--brand-color), var(--brand-dark))' : 'var(--brand-color)'};
      border-radius: ${t.id === 'corporate' ? '4px' : '12px'};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .benefit-content h4 { font-size: 1.1rem; margin-bottom: 4px; font-weight: ${t.typography.headingWeight}; }
    .benefit-content p { color: var(--text-muted); font-size: 0.95rem; }

    /* Pillars Section */
    .pillar { text-align: center; padding: 24px; }
    .pillar-icon { font-size: 3rem; margin-bottom: 16px; }
    .pillar h3 { font-size: 1.2rem; margin-bottom: 8px; font-weight: ${t.typography.headingWeight}; }
    .pillar p { color: var(--text-muted); font-size: 0.9rem; }

    /* FAQ Section */
    .faq-item {
      border-bottom: 1px solid var(--border-color);
      padding: 24px 0;
    }
    .faq-item:last-child { border-bottom: none; }
    .faq-question {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text-color);
    }
    .faq-answer { color: var(--text-muted); line-height: 1.8; }

    /* CTA Section */
    .cta-section {
      background: ${heroBg};
      color: white;
      padding: ${t.id === 'bold' ? '100px 0' : '80px 0'};
      text-align: center;
    }
    .cta-section h2 { margin-bottom: 16px; }
    .cta-section p { opacity: 0.9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto; }

    /* Content Pages */
    .breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 24px; }
    .breadcrumb a { color: var(--brand-color); text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .content { max-width: 800px; }
    .content h1 {
      font-size: 2.5rem;
      margin-bottom: 24px;
      line-height: 1.2;
      font-weight: ${t.typography.headingWeight};
    }
    .content .speakable-summary {
      font-size: 1.2rem;
      color: var(--text-muted);
      margin-bottom: 32px;
      padding: 24px;
      background: var(--bg-secondary);
      border-radius: var(--radius);
      border-left: 4px solid var(--brand-color);
    }
    .content h2 {
      font-size: 1.75rem;
      margin: 48px 0 20px;
      color: var(--text-color);
      font-weight: ${t.typography.headingWeight};
    }
    .content h3 { font-size: 1.25rem; margin: 32px 0 16px; }
    .content p { margin-bottom: 20px; color: var(--text-muted); }
    .content ul, .content ol { margin: 24px 0; padding-left: 28px; }
    .content li { margin-bottom: 12px; color: var(--text-muted); }
    .content .highlight-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 24px;
      margin: 32px 0;
    }

    /* Process Steps */
    .process-steps { counter-reset: step; }
    .process-step {
      display: flex;
      gap: 24px;
      padding: 24px 0;
      border-bottom: 1px solid var(--border-color);
    }
    .process-step:last-child { border-bottom: none; }
    .process-step::before {
      counter-increment: step;
      content: counter(step);
      width: 48px;
      height: 48px;
      background: ${t.id === 'bold' ? 'linear-gradient(135deg, var(--brand-color), var(--brand-dark))' : 'var(--brand-color)'};
      color: white;
      border-radius: ${t.id === 'corporate' ? '4px' : '50%'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .process-step-content h4 { margin-bottom: 8px; font-weight: ${t.typography.headingWeight}; }
    .process-step-content p { color: var(--text-muted); }

    /* Footer */
    footer {
      background: var(--bg-dark);
      color: var(--text-light);
      padding: 60px 0 40px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 40px;
      margin-bottom: 40px;
    }
    .footer-section h4 {
      color: ${t.id === 'dark' ? 'var(--text-color)' : 'white'};
      margin-bottom: 16px;
      font-size: 1rem;
      font-weight: ${t.typography.headingWeight};
    }
    .footer-section a {
      color: var(--text-light);
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }
    .footer-section a:hover { color: ${t.id === 'dark' ? 'var(--brand-color)' : 'white'}; }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 24px;
      text-align: center;
      font-size: 0.85rem;
    }

    /* AEO Optimized Content */
    .speakable-intro { font-size: 1.1rem; line-height: 1.8; }
    .aeo-block h2 { text-align: left; }

    /* Template-specific accents */
    ${t.id === 'bold' ? `
    .accent-bar {
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, var(--brand-color), var(--accent-color));
      margin: 0 auto 24px;
      border-radius: 2px;
    }
    .section h2::after {
      content: '';
      display: block;
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, var(--brand-color), var(--accent-color));
      margin: 16px auto 0;
      border-radius: 2px;
    }
    ` : ''}

    ${t.id === 'corporate' ? `
    .section h2 {
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 16px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    ` : ''}

    /* Responsive */
    @media (max-width: 768px) {
      .hero { padding: 60px 0; }
      .hero h1 { font-size: 2rem; }
      .hero p { font-size: 1.1rem; }
      .section { padding: 60px 0; }
      .section h2 { font-size: 1.75rem; }
      nav { display: none; }
      .content h1 { font-size: 2rem; }
    }
  `;
}

// ============================================
// HTML TEMPLATES (Enhanced with SEO/AEO)
// ============================================

function generateHtmlHead(
  title: string,
  description: string,
  ctx: ContentContext,
  schemaMarkup?: string,
  canonicalPath?: string
): string {
  const canonical = canonicalPath ? `${ctx.meta.website_url}/${canonicalPath}` : ctx.meta.website_url;

  return `<!DOCTYPE html>
<html lang="en" data-template="${ctx.template.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- SEO Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="${escapeHtml(ctx.meta.company_name)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">

  <!-- Technical SEO -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="theme-color" content="${ctx.brandColor}">

  <style>${generateTemplateCSS(ctx)}</style>


  <!-- Schema Markup (AEO) -->
  ${schemaMarkup ? schemaMarkup.split('\n').map(s => `<script type="application/ld+json">${s}</script>`).join('\n  ') : ''}
</head>`;
}

function generateNavigation(pages: PseoPage[], ctx: ContentContext, currentPath: string): string {
  const servicePages = pages.filter(p => p.type === 'service').slice(0, 4);

  return `
  <header>
    <div class="container">
      <h1>${escapeHtml(ctx.meta.company_name)}</h1>
      <nav>
        <a href="index.html">Home</a>
        ${servicePages.map(p => `<a href="${p.path}.html">${escapeHtml(p.title)}</a>`).join('')}
        <a href="contact.html">Contact</a>
      </nav>
    </div>
  </header>`;
}

function generateHomePage(data: FullSiteData, ctx: ContentContext): string {
  const { pseoAudit } = data;
  const { pages } = pseoAudit;
  const servicePages = pages.filter(p => p.type === 'service').slice(0, 6);
  const benefits = generateBenefitsFromPainPoints(ctx);

  const schemas = [
    generateOrganizationSchema(ctx),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: ctx.meta.company_name,
      url: ctx.meta.website_url,
    },
  ];
  const schemaMarkup = schemas.map(s => JSON.stringify(s, null, 2)).join('\n');

  return `${generateHtmlHead(
    `${ctx.meta.company_name} | ${ctx.meta.industry}`,
    ctx.positioning,
    ctx,
    schemaMarkup
  )}
<body>
  ${generateNavigation(pages, ctx, 'index')}

  <!-- Hero with Positioning -->
  <section class="hero">
    <div class="container">
      <h1>${escapeHtml(ctx.meta.industry)} Solutions for ${escapeHtml(ctx.targetPersona)}</h1>
      <p class="positioning speakable-intro">${escapeHtml(ctx.positioning)}</p>
      <p>Serving ${escapeHtml(ctx.meta.geography)}</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <a href="contact.html" class="btn btn-primary">Get Started</a>
        <a href="#services" class="btn btn-outline">Explore Services</a>
      </div>
    </div>
  </section>

  <!-- Key Messaging Pillars -->
  <section class="section">
    <div class="container">
      <h2>Why ${escapeHtml(ctx.meta.company_name)}?</h2>
      <p class="section-intro">We understand the challenges facing ${escapeHtml(ctx.targetPersona)}.</p>
      <div class="grid grid-3">
        ${ctx.messagingPillars.slice(0, 3).map((pillar, i) => `
        <div class="pillar">
          <div class="pillar-icon">${['✓', '★', '◆'][i]}</div>
          <h3>${escapeHtml(pillar)}</h3>
          <p>${escapeHtml(ctx.painPoints[i] ? `Solving: ${ctx.painPoints[i]}` : '')}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Services Grid -->
  <section class="section section-alt" id="services">
    <div class="container">
      <h2>Our Services</h2>
      <p class="section-intro">${escapeHtml(ctx.meta.industry)} solutions tailored for your needs.</p>
      <div class="grid grid-3">
        ${servicePages.map(page => `
        <div class="card">
          <h3>${escapeHtml(page.title)}</h3>
          <p>${escapeHtml(page.primary_keyword)} expertise for ${escapeHtml(ctx.targetPersona.toLowerCase())}.</p>
          <ul>
            ${page.secondary_keywords.slice(0, 3).map(kw => `<li>${escapeHtml(kw)}</li>`).join('')}
          </ul>
          <a href="${page.path}.html" class="card-link">Learn more →</a>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Benefits (from Pain Points) -->
  <section class="section">
    <div class="container">
      <h2>What Sets Us Apart</h2>
      <div style="max-width:700px;margin:0 auto;">
        ${benefits.slice(0, 4).map(benefit => `
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-content">
            <h4>${escapeHtml(benefit)}</h4>
            <p>Designed with ${escapeHtml(ctx.targetPersona.toLowerCase())} in mind.</p>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  ${generateAEOContentBlock(ctx)}

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="container">
      <h2>Ready to Get Started?</h2>
      <p>${escapeHtml(ctx.positioning)}</p>
      <a href="contact.html" class="btn btn-primary">Contact Us Today</a>
    </div>
  </section>

  ${generateFooter(pages, ctx)}
</body>
</html>`;
}

function generateServicePage(
  page: PseoPage,
  data: FullSiteData,
  ctx: ContentContext
): string {
  const { pseoAudit } = data;
  const { pages } = pseoAudit;
  const faqs = generateFAQsForPage(page, ctx);
  const schemaMarkup = generateAllSchemas(page, ctx);

  const description = `${page.title} services from ${ctx.meta.company_name}. ${page.primary_keyword} solutions for ${ctx.targetPersona}.`;

  return `${generateHtmlHead(
    `${page.title} | ${ctx.meta.company_name}`,
    description,
    ctx,
    schemaMarkup,
    page.path
  )}
<body>
  ${generateNavigation(pages, ctx, page.path)}

  <main>
    <div class="container" style="padding:60px 24px;">
      <div class="content">
        <nav class="breadcrumb">
          <a href="index.html">Home</a> / ${escapeHtml(page.title)}
        </nav>

        <h1>${escapeHtml(page.title)}</h1>

        <!-- Speakable Summary (AEO Optimized) -->
        <div class="speakable-summary">
          <p class="speakable-intro">${escapeHtml(ctx.meta.company_name)} provides expert ${escapeHtml(page.title.toLowerCase())} services for ${escapeHtml(ctx.targetPersona)} in ${escapeHtml(ctx.meta.geography)}. ${escapeHtml(ctx.positioning)}</p>
        </div>

        <h2>What We Offer</h2>
        <p>Our ${escapeHtml(page.primary_keyword.toLowerCase())} solutions are designed to address the specific needs of ${escapeHtml(ctx.targetPersona)}.</p>

        <ul>
          ${page.secondary_keywords.slice(0, 6).map(kw => `<li><strong>${escapeHtml(kw)}</strong></li>`).join('')}
        </ul>

        <h2>Who This Is For</h2>
        <p>${escapeHtml(ctx.targetPersona)} who are looking for:</p>
        <ul>
          ${ctx.painPoints.slice(0, 3).map(pain => `<li>Solutions for ${escapeHtml(pain.toLowerCase())}</li>`).join('')}
        </ul>

        ${page.template_sections.includes('Process') ? `
        <h2>Our Process</h2>
        <div class="process-steps">
          <div class="process-step">
            <div class="process-step-content">
              <h4>Initial Consultation</h4>
              <p>We start by understanding your specific ${escapeHtml(page.primary_keyword.toLowerCase())} needs and goals.</p>
            </div>
          </div>
          <div class="process-step">
            <div class="process-step-content">
              <h4>Analysis & Strategy</h4>
              <p>Our team develops a tailored approach based on your requirements.</p>
            </div>
          </div>
          <div class="process-step">
            <div class="process-step-content">
              <h4>Implementation</h4>
              <p>We execute the plan with ongoing communication and support.</p>
            </div>
          </div>
          <div class="process-step">
            <div class="process-step-content">
              <h4>Results & Optimization</h4>
              <p>Continuous improvement to ensure the best outcomes.</p>
            </div>
          </div>
        </div>
        ` : ''}

        <h2>Why Choose ${escapeHtml(ctx.meta.company_name)}?</h2>
        <div class="highlight-box">
          ${ctx.messagingPillars.slice(0, 3).map(pillar => `<p><strong>✓ ${escapeHtml(pillar)}</strong></p>`).join('')}
        </div>

        <h2>Frequently Asked Questions</h2>
        ${faqs.map(faq => `
        <div class="faq-item">
          <div class="faq-question">${escapeHtml(faq.question)}</div>
          <div class="faq-answer">${escapeHtml(faq.answer)}</div>
        </div>
        `).join('')}

      </div>
    </div>
  </main>

  <!-- CTA Section -->
  <section class="cta-section">
    <div class="container">
      <h2>Get Started with ${escapeHtml(page.title)}</h2>
      <p>Contact us to learn how we can help with your ${escapeHtml(page.primary_keyword.toLowerCase())} needs.</p>
      <a href="contact.html" class="btn btn-primary">Contact Us</a>
    </div>
  </section>

  ${generateFooter(pages, ctx)}
</body>
</html>`;
}

function generateContactPage(data: FullSiteData, ctx: ContentContext): string {
  const { pseoAudit } = data;
  const { pages } = pseoAudit;

  return `${generateHtmlHead(
    `Contact | ${ctx.meta.company_name}`,
    `Contact ${ctx.meta.company_name} for ${ctx.meta.industry.toLowerCase()} services. ${ctx.positioning}`,
    ctx,
    JSON.stringify(generateOrganizationSchema(ctx), null, 2),
    'contact'
  )}
<body>
  ${generateNavigation(pages, ctx, 'contact')}

  <main>
    <div class="container" style="padding:60px 24px;">
      <div class="content">
        <h1>Contact Us</h1>

        <div class="speakable-summary">
          <p>${escapeHtml(ctx.positioning)}</p>
        </div>

        <div class="grid grid-2" style="margin-top:40px;">
          <div class="card">
            <h3>Get in Touch</h3>
            <p>Fill out the form and we'll get back to you within 24 hours.</p>
            <form style="margin-top:24px;">
              <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:8px;font-weight:500;">Name *</label>
                <input type="text" required style="width:100%;padding:12px;border:1px solid var(--border-color);border-radius:8px;font-size:1rem;" placeholder="Your name">
              </div>
              <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:8px;font-weight:500;">Email *</label>
                <input type="email" required style="width:100%;padding:12px;border:1px solid var(--border-color);border-radius:8px;font-size:1rem;" placeholder="your@email.com">
              </div>
              <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:8px;font-weight:500;">Phone</label>
                <input type="tel" style="width:100%;padding:12px;border:1px solid var(--border-color);border-radius:8px;font-size:1rem;" placeholder="(555) 123-4567">
              </div>
              <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:8px;font-weight:500;">How can we help? *</label>
                <textarea required style="width:100%;padding:12px;border:1px solid var(--border-color);border-radius:8px;font-size:1rem;min-height:150px;resize:vertical;" placeholder="Tell us about your needs..."></textarea>
              </div>
              <button type="submit" class="btn btn-secondary" style="width:100%;">Send Message</button>
            </form>
          </div>

          <div>
            <div class="card" style="margin-bottom:24px;">
              <h3>Location</h3>
              <p style="font-size:1.1rem;">${escapeHtml(ctx.meta.geography)}</p>
            </div>

            <div class="card" style="margin-bottom:24px;">
              <h3>What We Do</h3>
              <p>${escapeHtml(ctx.meta.industry)}</p>
              <p style="margin-top:12px;font-style:italic;">${escapeHtml(ctx.positioning)}</p>
            </div>

            <div class="card">
              <h3>Who We Serve</h3>
              <p>${escapeHtml(ctx.targetPersona)}</p>
              <p style="margin-top:12px;color:var(--text-muted);">Common needs:</p>
              <ul>
                ${ctx.painPoints.slice(0, 3).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  ${generateFooter(pages, ctx)}
</body>
</html>`;
}

function generateFooter(pages: PseoPage[], ctx: ContentContext): string {
  const servicePages = pages.filter(p => p.type === 'service').slice(0, 6);
  const contentPillars = ctx.contentPillars.slice(0, 4);

  return `
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div class="footer-section">
          <h4>${escapeHtml(ctx.meta.company_name)}</h4>
          <p style="font-size:0.9rem;margin-bottom:16px;">${escapeHtml(ctx.positioning)}</p>
          <p style="font-size:0.85rem;">Serving ${escapeHtml(ctx.meta.geography)}</p>
        </div>
        <div class="footer-section">
          <h4>Services</h4>
          ${servicePages.map(p => `<a href="${p.path}.html">${escapeHtml(p.title)}</a>`).join('')}
        </div>
        <div class="footer-section">
          <h4>Topics</h4>
          ${contentPillars.map(pillar => `<a href="#">${escapeHtml(pillar)}</a>`).join('')}
        </div>
        <div class="footer-section">
          <h4>Company</h4>
          <a href="index.html">Home</a>
          <a href="contact.html">Contact</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${escapeHtml(ctx.meta.company_name)}. ${escapeHtml(ctx.footerText)}</p>
      </div>
    </div>
  </footer>`;
}

// ============================================
// NEXT.JS GENERATOR (Enhanced)
// ============================================

function generateNextJsProject(data: FullSiteData, ctx: ContentContext): GeneratedFile[] {
  const { pseoAudit } = data;
  const { meta, pages } = pseoAudit;
  const files: GeneratedFile[] = [];

  // package.json
  files.push({
    path: 'package.json',
    content: JSON.stringify({
      name: meta.company_name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        typescript: '^5',
        tailwindcss: '^3.4.0',
        postcss: '^8',
        autoprefixer: '^10',
      },
    }, null, 2),
  });

  // tsconfig.json
  files.push({
    path: 'tsconfig.json',
    content: JSON.stringify({
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules'],
    }, null, 2),
  });

  // tailwind.config.js
  files.push({
    path: 'tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '${ctx.brandColor}',
          dark: '${adjustColor(ctx.brandColor, -20)}',
        },
      },
    },
  },
  plugins: [],
};`,
  });

  // postcss.config.js
  files.push({
    path: 'postcss.config.js',
    content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`,
  });

  // globals.css
  files.push({
    path: 'app/globals.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

/* AEO Optimized Classes */
.speakable-intro {
  @apply text-lg text-gray-600 leading-relaxed;
}

.speakable-summary {
  @apply bg-gray-50 p-6 rounded-xl border-l-4 border-brand mb-8;
}`,
  });

  // Site config
  files.push({
    path: 'lib/config.ts',
    content: `export const siteConfig = {
  name: "${escapeQuotes(meta.company_name)}",
  url: "${escapeQuotes(meta.website_url)}",
  industry: "${escapeQuotes(meta.industry)}",
  geography: "${escapeQuotes(meta.geography)}",
  positioning: "${escapeQuotes(ctx.positioning)}",
  targetPersona: "${escapeQuotes(ctx.targetPersona)}",
  messagingPillars: ${JSON.stringify(ctx.messagingPillars)},
  contentPillars: ${JSON.stringify(ctx.contentPillars)},
  painPoints: ${JSON.stringify(ctx.painPoints)},
};`,
  });

  // Root layout
  files.push({
    path: 'app/layout.tsx',
    content: `import './globals.css';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: \`%s | \${siteConfig.name}\`,
  },
  description: siteConfig.positioning,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.positioning,
    siteName: siteConfig.name,
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <header className="bg-brand text-white py-4 sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <h1 className="text-xl font-bold">{siteConfig.name}</h1>
            <nav className="hidden md:flex gap-6">
              <a href="/" className="text-white/90 hover:text-white text-sm font-medium">Home</a>
              ${pages.filter(p => p.type === 'service').slice(0, 4).map(p =>
                `<a href="/${p.path}" className="text-white/90 hover:text-white text-sm font-medium">${escapeQuotes(p.title)}</a>`
              ).join('\n              ')}
              <a href="/contact" className="text-white/90 hover:text-white text-sm font-medium">Contact</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-900 text-gray-400 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-white font-semibold mb-4">{siteConfig.name}</h4>
                <p className="text-sm">{siteConfig.positioning}</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Services</h4>
                ${pages.filter(p => p.type === 'service').slice(0, 6).map(p =>
                  `<a href="/${p.path}" className="block text-sm hover:text-white mb-2">${escapeQuotes(p.title)}</a>`
                ).join('\n                ')}
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Topics</h4>
                ${ctx.contentPillars.slice(0, 4).map(pillar =>
                  `<span className="block text-sm mb-2">${escapeQuotes(pillar)}</span>`
                ).join('\n                ')}
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <a href="/" className="block text-sm hover:text-white mb-2">Home</a>
                <a href="/contact" className="block text-sm hover:text-white mb-2">Contact</a>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm">
              &copy; ${new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}`,
  });

  // Home page
  files.push({
    path: 'app/page.tsx',
    content: `import { siteConfig } from '@/lib/config';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand to-brand-dark text-white py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {siteConfig.industry} Solutions for {siteConfig.targetPersona}
          </h1>
          <p className="text-xl opacity-90 mb-4 speakable-intro">
            {siteConfig.positioning}
          </p>
          <p className="opacity-80 mb-8">Serving {siteConfig.geography}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/contact" className="bg-white text-brand px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
              Get Started
            </a>
            <a href="#services" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand transition">
              Explore Services
            </a>
          </div>
        </div>
      </section>

      {/* Messaging Pillars */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Why {siteConfig.name}?</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We understand the challenges facing {siteConfig.targetPersona.toLowerCase()}.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {siteConfig.messagingPillars.slice(0, 3).map((pillar, i) => (
              <div key={i} className="text-center p-6">
                <div className="text-4xl mb-4">{['✓', '★', '◆'][i]}</div>
                <h3 className="text-xl font-semibold mb-2">{pillar}</h3>
                <p className="text-gray-600 text-sm">
                  {siteConfig.painPoints[i] ? \`Solving: \${siteConfig.painPoints[i]}\` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-gray-50" id="services">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
          <p className="text-center text-gray-600 mb-12">
            {siteConfig.industry} solutions tailored for your needs.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            ${pages.filter(p => p.type === 'service').slice(0, 6).map(p => `
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-brand mb-3">${escapeQuotes(p.title)}</h3>
              <p className="text-gray-600 mb-4">${escapeQuotes(p.primary_keyword)} expertise.</p>
              <a href="/${p.path}" className="text-brand font-medium hover:underline">
                Learn more →
              </a>
            </div>`).join('')}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand to-brand-dark text-white py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="opacity-90 mb-8">{siteConfig.positioning}</p>
          <a href="/contact" className="inline-block bg-white text-brand px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
            Contact Us Today
          </a>
        </div>
      </section>
    </>
  );
}`,
  });

  // Generate service pages
  const servicePages = pages.filter(p => p.type === 'service');
  for (const page of servicePages) {
    const faqs = generateFAQsForPage(page, ctx);

    files.push({
      path: `app/${page.path}/page.tsx`,
      content: `import { siteConfig } from '@/lib/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${escapeQuotes(page.title)}',
  description: '${escapeQuotes(page.title)} services from ${escapeQuotes(meta.company_name)}. ${escapeQuotes(page.primary_keyword)} solutions.',
};

const faqs = ${JSON.stringify(faqs, null, 2)};

export default function ${toPascalCase(page.title)}Page() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/" className="text-brand hover:underline">Home</a> / ${escapeQuotes(page.title)}
      </nav>

      <h1 className="text-4xl font-bold mb-6">${escapeQuotes(page.title)}</h1>

      {/* Speakable Summary (AEO) */}
      <div className="speakable-summary">
        <p className="speakable-intro">
          {siteConfig.name} provides expert ${escapeQuotes(page.title.toLowerCase())} services
          for {siteConfig.targetPersona} in {siteConfig.geography}. {siteConfig.positioning}
        </p>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4">What We Offer</h2>
      <ul className="list-disc pl-6 space-y-2 text-gray-600">
        ${page.secondary_keywords.slice(0, 6).map(kw => `<li><strong>${escapeQuotes(kw)}</strong></li>`).join('\n        ')}
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-4">Who This Is For</h2>
      <p className="text-gray-600 mb-4">{siteConfig.targetPersona} looking for:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600">
        {siteConfig.painPoints.slice(0, 3).map((pain, i) => (
          <li key={i}>Solutions for {pain.toLowerCase()}</li>
        ))}
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-4">Why Choose {siteConfig.name}?</h2>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        {siteConfig.messagingPillars.slice(0, 3).map((pillar, i) => (
          <p key={i} className="mb-2"><strong className="text-brand">✓ {pillar}</strong></p>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4">Frequently Asked Questions</h2>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
            <p className="text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-brand to-brand-dark text-white p-8 rounded-xl text-center mt-16">
        <h3 className="text-2xl font-bold mb-4">Get Started with ${escapeQuotes(page.title)}</h3>
        <a href="/contact" className="inline-block bg-white text-brand px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
          Contact Us
        </a>
      </div>
    </div>
  );
}`,
    });
  }

  // Contact page
  files.push({
    path: 'app/contact/page.tsx',
    content: `import { siteConfig } from '@/lib/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: \`Contact \${siteConfig.name} for \${siteConfig.industry.toLowerCase()} services.\`,
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">Contact Us</h1>

      <div className="speakable-summary">
        <p>{siteConfig.positioning}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input type="text" required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input type="email" required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message *</label>
              <textarea required className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32" placeholder="How can we help?" />
            </div>
            <button type="submit" className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:opacity-90">
              Send Message
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold mb-2">Location</h3>
            <p className="text-gray-600">{siteConfig.geography}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold mb-2">What We Do</h3>
            <p className="text-gray-600">{siteConfig.industry}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold mb-2">Who We Serve</h3>
            <p className="text-gray-600">{siteConfig.targetPersona}</p>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  });

  // README
  files.push({
    path: 'README.md',
    content: `# ${meta.company_name} Website

Generated by LelandOS Site Generator with full SEO/AEO optimization.

## Features

- **5 Pillars of SEO**: Technical, On-page, Content, Structure, UX
- **AEO Optimized**: Speakable content, FAQ schema, HowTo markup
- **Schema Markup**: Organization, Service, FAQPage, BreadcrumbList, HowTo
- **Responsive Design**: Mobile-first Tailwind CSS
- **${pseoAudit.totals.total_pages} Pages Generated**

## Content Strategy

**Positioning:** ${ctx.positioning}

**Target Persona:** ${ctx.targetPersona}

**Messaging Pillars:**
${ctx.messagingPillars.map(p => `- ${p}`).join('\n')}

**Content Pillars:**
${ctx.contentPillars.map(p => `- ${p}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Deploy

This project is ready to deploy to Vercel, Netlify, or any Node.js hosting.
`,
  });

  return files;
}

// ============================================
// MAIN EXPORT FUNCTIONS
// ============================================

export async function generateSiteZip(
  pseoAudit: PseoAuditResponse,
  options: SiteGeneratorOptions = { format: 'html' },
  structuredAudit?: StructuredAudit,
  keywordMetrics?: KeywordMetric[]
): Promise<Blob> {
  const zip = new JSZip();

  const data: FullSiteData = {
    pseoAudit,
    structuredAudit,
    keywordMetrics,
  };

  const ctx = buildContentContext(data, options);

  if (options.format === 'nextjs') {
    const files = generateNextJsProject(data, ctx);
    for (const file of files) {
      zip.file(file.path, file.content);
    }
  } else {
    // HTML format
    const { pages } = pseoAudit;

    // Home page
    zip.file('index.html', generateHomePage(data, ctx));

    // Contact page
    zip.file('contact.html', generateContactPage(data, ctx));

    // All pages from pSEO audit
    for (const page of pages) {
      const html = generateServicePage(page, data, ctx);
      zip.file(`${page.path}.html`, html);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeQuotes(text: string): string {
  return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

function toPascalCase(text: string): string {
  return text
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function adjustColor(hex: string, amount: number): string {
  const clamp = (num: number) => Math.min(255, Math.max(0, num));

  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }

  const r = clamp(parseInt(color.slice(0, 2), 16) + amount);
  const g = clamp(parseInt(color.slice(2, 4), 16) + amount);
  const b = clamp(parseInt(color.slice(4, 6), 16) + amount);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// lib/audit-engine/fix-generator.ts
// Generates actual fixes (code, copy, files) for audit issues

import { callLLMTask } from '../llm';
import type { AuditFix, AuditIssue, Severity } from './types';

/**
 * Generate a robots.txt file
 */
export function generateRobotsTxt(options: {
  sitemap?: string;
  disallow?: string[];
  allow?: string[];
}): AuditFix {
  const lines = ['User-agent: *', ''];

  if (options.allow?.length) {
    for (const path of options.allow) {
      lines.push(`Allow: ${path}`);
    }
  }

  if (options.disallow?.length) {
    for (const path of options.disallow) {
      lines.push(`Disallow: ${path}`);
    }
  } else {
    lines.push('Disallow:'); // Allow all by default
  }

  if (options.sitemap) {
    lines.push('', `Sitemap: ${options.sitemap}`);
  }

  return {
    type: 'file',
    title: 'robots.txt',
    description: 'Robots.txt file to control search engine crawling',
    content: lines.join('\n'),
    filename: 'robots.txt',
    estimatedEffort: 'minutes',
  };
}

/**
 * Generate a sitemap.xml file
 */
export function generateSitemapXml(pages: Array<{ url: string; priority?: number; changefreq?: string }>): AuditFix {
  const urls = pages.map((page) => {
    return `  <url>
    <loc>${page.url}</loc>
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || 0.8}</priority>
  </url>`;
  });

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return {
    type: 'file',
    title: 'sitemap.xml',
    description: 'XML sitemap for search engine indexing',
    content,
    filename: 'public/sitemap.xml',
    language: 'xml',
    estimatedEffort: 'minutes',
  };
}

/**
 * Generate meta title tag
 */
export function generateTitleTag(options: {
  primaryKeyword: string;
  brandName: string;
  pageType: string;
}): AuditFix {
  const { primaryKeyword, brandName, pageType } = options;

  // Template based on page type
  let title: string;
  switch (pageType) {
    case 'home':
      title = `${primaryKeyword} | ${brandName}`;
      break;
    case 'service':
      title = `${primaryKeyword} Services | ${brandName}`;
      break;
    case 'location':
      title = `${primaryKeyword} | ${brandName}`;
      break;
    default:
      title = `${primaryKeyword} | ${brandName}`;
  }

  // Truncate to 60 chars
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  return {
    type: 'code',
    title: 'Optimized Title Tag',
    description: `SEO-optimized title tag (${title.length} chars)`,
    content: `<title>${title}</title>`,
    language: 'html',
    estimatedEffort: 'minutes',
  };
}

/**
 * Generate meta description
 */
export function generateMetaDescription(options: {
  primaryKeyword: string;
  secondaryKeyword?: string;
  cta: string;
  uniqueValue: string;
}): AuditFix {
  const { primaryKeyword, secondaryKeyword, cta, uniqueValue } = options;

  let description = `Looking for ${primaryKeyword}? ${uniqueValue}`;
  if (secondaryKeyword) {
    description += ` Our ${secondaryKeyword} services`;
  }
  description += ` ${cta}`;

  // Truncate to 160 chars
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return {
    type: 'code',
    title: 'Optimized Meta Description',
    description: `SEO-optimized meta description (${description.length} chars)`,
    content: `<meta name="description" content="${description}">`,
    language: 'html',
    estimatedEffort: 'minutes',
  };
}

/**
 * Generate canonical tag
 */
export function generateCanonicalTag(canonicalUrl: string): AuditFix {
  return {
    type: 'code',
    title: 'Canonical Tag',
    description: 'Prevents duplicate content issues',
    content: `<link rel="canonical" href="${canonicalUrl}">`,
    language: 'html',
    estimatedEffort: 'minutes',
  };
}

/**
 * Generate JSON-LD schema markup
 */
export function generateSchemaMarkup(
  type: 'Organization' | 'WebSite' | 'LocalBusiness' | 'FAQPage' | 'Article' | 'Product' | 'Service',
  data: Record<string, unknown>
): AuditFix {
  let schema: Record<string, unknown>;

  switch (type) {
    case 'Organization':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: data.name,
        url: data.url,
        logo: data.logo,
        description: data.description,
        sameAs: data.sameAs || [],
        contactPoint: data.contactPoint,
      };
      break;

    case 'WebSite':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: data.name,
        url: data.url,
        potentialAction: data.potentialAction || {
          '@type': 'SearchAction',
          target: `${data.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
      break;

    case 'LocalBusiness':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: data.name,
        url: data.url,
        image: data.image,
        telephone: data.telephone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.streetAddress,
          addressLocality: data.city,
          addressRegion: data.state,
          postalCode: data.postalCode,
          addressCountry: data.country || 'US',
        },
        geo: data.geo,
        openingHours: data.openingHours,
        priceRange: data.priceRange,
      };
      break;

    case 'FAQPage':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (data.faqs as Array<{ question: string; answer: string }>)?.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
      break;

    case 'Service':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: data.name,
        description: data.description,
        provider: {
          '@type': 'Organization',
          name: data.providerName,
        },
        areaServed: data.areaServed,
        serviceType: data.serviceType,
      };
      break;

    default:
      schema = {
        '@context': 'https://schema.org',
        '@type': type,
        ...data,
      };
  }

  const content = `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;

  return {
    type: 'code',
    title: `${type} Schema Markup`,
    description: `Structured data for ${type} to improve rich results`,
    content,
    language: 'html',
    estimatedEffort: 'minutes',
  };
}

/**
 * Generate speakable schema for voice search
 */
export function generateSpeakableSchema(options: {
  cssSelectors: string[];
  url: string;
}): AuditFix {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: options.cssSelectors,
    },
    url: options.url,
  };

  const content = `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;

  return {
    type: 'code',
    title: 'Speakable Schema',
    description: 'Marks content as suitable for text-to-speech and voice assistants',
    content,
    language: 'html',
    estimatedEffort: 'minutes',
  };
}

/**
 * Generate internal linking suggestions
 */
export function generateInternalLinkMap(pages: Array<{ url: string; title: string; keywords: string[] }>): AuditFix {
  const linkMap: Record<string, string[]> = {};

  for (const page of pages) {
    const relatedPages = pages
      .filter((p) => p.url !== page.url)
      .filter((p) => page.keywords.some((kw) => p.keywords.includes(kw) || p.title.toLowerCase().includes(kw.toLowerCase())))
      .slice(0, 3)
      .map((p) => p.url);

    linkMap[page.url] = relatedPages;
  }

  const content = `# Internal Linking Map

This map shows which pages should link to each other based on keyword relevance.

${Object.entries(linkMap)
  .map(
    ([url, links]) => `## ${url}
Link to:
${links.map((l) => `- ${l}`).join('\n') || '- (No related pages found)'}`
  )
  .join('\n\n')}
`;

  return {
    type: 'instruction',
    title: 'Internal Linking Map',
    description: 'Recommended internal links between pages',
    content,
    estimatedEffort: 'hours',
  };
}

/**
 * Generate FAQ content using LLM
 */
export async function generateFAQContent(options: {
  topic: string;
  industry: string;
  targetKeywords: string[];
  count?: number;
}): Promise<AuditFix> {
  const { topic, industry, targetKeywords, count = 5 } = options;

  const prompt = `Generate ${count} FAQ questions and answers for a ${industry} company about: ${topic}

Target keywords to naturally include: ${targetKeywords.join(', ')}

Requirements:
1. Questions should be what real customers would ask
2. Answers should be 2-4 sentences, informative and helpful
3. Include the target keywords naturally (don't stuff)
4. Format for featured snippets (direct, clear answers)

Return as JSON:
{
  "faqs": [
    { "question": "...", "answer": "..." }
  ]
}`;

  try {
    const result = await callLLMTask({
      task: 'pseo_generate',
      prompt,
      expectJson: true,
    });

    const parsed = result.raw?.parsedJson || JSON.parse(result.text);
    const faqs = parsed.faqs || [];

    const htmlContent = faqs
      .map(
        (faq: { question: string; answer: string }) => `<div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
  <h3 itemprop="name">${faq.question}</h3>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text">${faq.answer}</p>
  </div>
</div>`
      )
      .join('\n\n');

    return {
      type: 'code',
      title: `FAQ Content: ${topic}`,
      description: `${count} FAQ questions with schema markup`,
      content: htmlContent,
      language: 'html',
      estimatedEffort: 'minutes',
    };
  } catch (error) {
    return {
      type: 'instruction',
      title: `FAQ Content: ${topic}`,
      description: 'Manual FAQ creation needed',
      content: `Create ${count} FAQs about ${topic} targeting: ${targetKeywords.join(', ')}`,
      estimatedEffort: 'hours',
    };
  }
}

/**
 * Create an audit issue with its fix
 */
export function createIssue(
  id: string,
  title: string,
  description: string,
  severity: Severity,
  impact: string,
  currentState: string,
  fix: AuditFix
): AuditIssue {
  return {
    id,
    title,
    description,
    severity,
    impact,
    currentState,
    fix,
  };
}

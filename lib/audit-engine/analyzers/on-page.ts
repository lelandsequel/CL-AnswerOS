// lib/audit-engine/analyzers/on-page.ts
// On-Page SEO analysis (titles, metas, headings, images)

import { getOnPagePages } from '../dataforseo-client';
import {
  generateTitleTag,
  generateMetaDescription,
  generateCanonicalTag,
  createIssue,
} from '../fix-generator';
import type { PillarAnalysis, OnPageSEOData, AuditIssue } from '../types';

interface PageData {
  url: string;
  meta: {
    title: string;
    description: string;
    htags: { h1?: string[]; h2?: string[]; h3?: string[] };
    title_length: number;
    description_length: number;
    canonical: string;
    images_count: number;
  };
  checks: {
    no_title: boolean;
    title_too_long: boolean;
    title_too_short: boolean;
    no_description: boolean;
    description_too_long: boolean;
    description_too_short: boolean;
    no_h1_tag: boolean;
    no_image_alt: boolean;
    no_image_title: boolean;
    duplicate_title: boolean;
    duplicate_description: boolean;
  };
}

/**
 * Run on-page SEO analysis
 */
export async function analyzeOnPageSEO(
  taskId: string,
  domain: string,
  brandName: string
): Promise<{ analysis: PillarAnalysis; rawData: OnPageSEOData }> {
  const issues: AuditIssue[] = [];
  const quickWins: AuditIssue[] = [];

  // Get pages from crawl
  let pages: PageData[] = [];
  try {
    const rawPages = await getOnPagePages(taskId, { limit: 100 });
    pages = (rawPages || []) as unknown as PageData[];
  } catch (error) {
    console.error('[On-Page] Failed to get pages:', error);
  }

  // Analyze titles
  const titlesAnalysis = analyzeMetaTitles(pages);

  // Analyze descriptions
  const descriptionsAnalysis = analyzeMetaDescriptions(pages);

  // Analyze headings
  const headingsAnalysis = analyzeHeadings(pages);

  // Analyze images
  const imagesAnalysis = analyzeImages(pages);

  // Build raw data
  const rawData: OnPageSEOData = {
    titles: titlesAnalysis.data,
    metaDescriptions: descriptionsAnalysis.data,
    headings: headingsAnalysis.data,
    images: imagesAnalysis.data,
    links: {
      broken: [],
      nofollow: 0,
      external: 0,
      internal: 0,
    },
  };

  // =========================================================================
  // TITLE ISSUES
  // =========================================================================
  if (titlesAnalysis.data.missing.length > 0) {
    const issue = createIssue(
      'onpage-001',
      `${titlesAnalysis.data.missing.length} Pages Missing Title Tags`,
      'Title tags are crucial for SEO. They tell search engines what your page is about.',
      'CRITICAL',
      'Major ranking factor missing, poor SERP appearance',
      `${titlesAnalysis.data.missing.length} pages have no title tag`,
      {
        type: 'code',
        title: 'Add Title Tags',
        description: 'Title tags for pages missing them',
        content: titlesAnalysis.data.missing.slice(0, 10).map((url) => {
          const pageName = url.split('/').pop() || 'Home';
          return `<!-- ${url} -->
<title>${pageName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} | ${brandName}</title>`;
        }).join('\n\n'),
        language: 'html',
        estimatedEffort: 'hours',
      }
    );
    issues.push(issue);
    if (titlesAnalysis.data.missing.length <= 5) quickWins.push(issue);
  }

  if (titlesAnalysis.data.tooLong.length > 0) {
    issues.push(
      createIssue(
        'onpage-002',
        `${titlesAnalysis.data.tooLong.length} Title Tags Too Long`,
        'Title tags over 60 characters get truncated in search results.',
        'MEDIUM',
        'Truncated titles look unprofessional and may cut off key information',
        `${titlesAnalysis.data.tooLong.length} pages have titles over 60 characters`,
        {
          type: 'instruction',
          title: 'Shorten Title Tags',
          description: 'Pages with titles that need shortening',
          content: `# Pages with Titles Too Long

${titlesAnalysis.data.tooLong.slice(0, 10).map((url) => `- ${url}`).join('\n')}

## Guidelines:
- Keep titles under 60 characters
- Put primary keyword near the beginning
- Use format: Primary Keyword | Brand Name
- Remove filler words like "the", "and", "of"
`,
          estimatedEffort: 'hours',
        }
      )
    );
  }

  if (titlesAnalysis.data.duplicate.length > 0) {
    const issue = createIssue(
      'onpage-003',
      `${titlesAnalysis.data.duplicate.length} Duplicate Title Tags`,
      'Each page should have a unique title. Duplicates confuse search engines.',
      'HIGH',
      'Cannibalizes rankings, confuses users in search results',
      `${titlesAnalysis.data.duplicate.length} pages share the same title`,
      {
        type: 'instruction',
        title: 'Fix Duplicate Titles',
        description: 'Pages with duplicate titles',
        content: `# Pages with Duplicate Titles

${titlesAnalysis.data.duplicate.slice(0, 10).map((url) => `- ${url}`).join('\n')}

## How to Fix:
1. Make each title unique and descriptive
2. Include the specific topic/keyword for each page
3. Use the format: [Page Topic] | ${brandName}
4. Ensure titles accurately describe page content
`,
        estimatedEffort: 'hours',
      }
    );
    issues.push(issue);
    quickWins.push(issue);
  }

  // =========================================================================
  // META DESCRIPTION ISSUES
  // =========================================================================
  if (descriptionsAnalysis.data.missing.length > 0) {
    const issue = createIssue(
      'onpage-004',
      `${descriptionsAnalysis.data.missing.length} Pages Missing Meta Descriptions`,
      'Meta descriptions improve click-through rates from search results.',
      'HIGH',
      'Missing opportunity to improve CTR, Google may generate poor snippets',
      `${descriptionsAnalysis.data.missing.length} pages have no meta description`,
      {
        type: 'code',
        title: 'Add Meta Descriptions',
        description: 'Meta descriptions for pages missing them',
        content: descriptionsAnalysis.data.missing.slice(0, 5).map((url) => {
          const pageName = url.split('/').pop()?.replace(/-/g, ' ') || 'this page';
          return `<!-- ${url} -->
<meta name="description" content="Learn about ${pageName} from ${brandName}. Get expert insights and solutions. Contact us today!">`;
        }).join('\n\n'),
        language: 'html',
        estimatedEffort: 'hours',
      }
    );
    issues.push(issue);
    if (descriptionsAnalysis.data.missing.length <= 5) quickWins.push(issue);
  }

  if (descriptionsAnalysis.data.duplicate.length > 0) {
    issues.push(
      createIssue(
        'onpage-005',
        `${descriptionsAnalysis.data.duplicate.length} Duplicate Meta Descriptions`,
        'Each page should have a unique meta description.',
        'MEDIUM',
        'Missed CTR opportunity, appears low-quality to search engines',
        `${descriptionsAnalysis.data.duplicate.length} pages share the same meta description`,
        {
          type: 'instruction',
          title: 'Fix Duplicate Descriptions',
          description: 'Pages with duplicate meta descriptions',
          content: `# Pages with Duplicate Meta Descriptions

${descriptionsAnalysis.data.duplicate.slice(0, 10).map((url) => `- ${url}`).join('\n')}

## Guidelines:
- Each page needs a unique description
- Keep under 160 characters
- Include primary keyword naturally
- Add a call-to-action
- Accurately describe page content
`,
          estimatedEffort: 'hours',
        }
      )
    );
  }

  // =========================================================================
  // HEADING ISSUES
  // =========================================================================
  if (headingsAnalysis.data.pagesWithoutH1.length > 0) {
    const issue = createIssue(
      'onpage-006',
      `${headingsAnalysis.data.pagesWithoutH1.length} Pages Missing H1 Tag`,
      'Every page should have exactly one H1 tag describing the main topic.',
      'HIGH',
      'Major on-page SEO factor missing, poor accessibility',
      `${headingsAnalysis.data.pagesWithoutH1.length} pages have no H1 tag`,
      {
        type: 'code',
        title: 'Add H1 Tags',
        description: 'H1 tags for pages missing them',
        content: headingsAnalysis.data.pagesWithoutH1.slice(0, 5).map((url) => {
          const pageName = url.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Welcome';
          return `<!-- ${url} -->
<h1>${pageName}</h1>`;
        }).join('\n\n'),
        language: 'html',
        estimatedEffort: 'hours',
      }
    );
    issues.push(issue);
    quickWins.push(issue);
  }

  if (headingsAnalysis.data.pagesWithMultipleH1.length > 0) {
    issues.push(
      createIssue(
        'onpage-007',
        `${headingsAnalysis.data.pagesWithMultipleH1.length} Pages with Multiple H1 Tags`,
        'Pages should have only one H1 tag. Multiple H1s dilute focus.',
        'MEDIUM',
        'Confuses search engines about page topic',
        `${headingsAnalysis.data.pagesWithMultipleH1.length} pages have more than one H1`,
        {
          type: 'instruction',
          title: 'Fix Multiple H1 Tags',
          description: 'Pages with multiple H1 tags',
          content: `# Pages with Multiple H1 Tags

${headingsAnalysis.data.pagesWithMultipleH1.slice(0, 10).map((url) => `- ${url}`).join('\n')}

## How to Fix:
1. Identify the main topic of each page
2. Keep only ONE H1 that describes that topic
3. Convert other H1s to H2 or H3
4. Ensure H1 includes the primary keyword
`,
          estimatedEffort: 'hours',
        }
      )
    );
  }

  // =========================================================================
  // IMAGE ISSUES
  // =========================================================================
  if (imagesAnalysis.data.withoutAlt.length > 0) {
    const issue = createIssue(
      'onpage-008',
      `${imagesAnalysis.data.withoutAlt.length} Images Missing Alt Text`,
      'Alt text helps search engines understand images and improves accessibility.',
      'MEDIUM',
      'Missed image SEO opportunity, poor accessibility',
      `${imagesAnalysis.data.withoutAlt.length} images have no alt attribute`,
      {
        type: 'code',
        title: 'Add Alt Text to Images',
        description: 'Example of proper alt text implementation',
        content: `<!-- Before: Missing alt text -->
<img src="product.jpg">

<!-- After: Descriptive alt text -->
<img src="product.jpg" alt="Blue widget product with chrome finish - ${brandName}">

<!-- For Next.js Image component -->
<Image
  src="/product.jpg"
  alt="Blue widget product with chrome finish"
  width={800}
  height={600}
/>

<!-- Guidelines for alt text:
- Describe what's IN the image
- Include relevant keywords naturally
- Keep under 125 characters
- Don't start with "image of" or "picture of"
- For decorative images, use alt=""
-->`,
        language: 'html',
        estimatedEffort: 'hours',
      }
    );
    issues.push(issue);
    if (imagesAnalysis.data.withoutAlt.length <= 20) quickWins.push(issue);
  }

  // Calculate score
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'CRITICAL':
        score -= 25;
        break;
      case 'HIGH':
        score -= 15;
        break;
      case 'MEDIUM':
        score -= 10;
        break;
      case 'LOW':
        score -= 5;
        break;
    }
  }
  score = Math.max(0, score);

  const analysis: PillarAnalysis = {
    name: 'On-Page SEO',
    score,
    status: score >= 70 ? 'good' : score >= 40 ? 'needs-work' : 'critical',
    summary: buildOnPageSummary(rawData, issues),
    currentState: {
      totalPages: pages.length,
      pagesWithOptimizedTitles: rawData.titles.optimized,
      pagesWithOptimizedDescriptions: rawData.metaDescriptions.optimized,
      pagesWithH1: pages.length - rawData.headings.pagesWithoutH1.length,
      totalImages: rawData.images.totalImages,
      imagesWithAlt: rawData.images.totalImages - rawData.images.withoutAlt.length,
    },
    issues,
    quickWins,
  };

  return { analysis, rawData };
}

function analyzeMetaTitles(pages: PageData[]) {
  const missing: string[] = [];
  const tooLong: string[] = [];
  const tooShort: string[] = [];
  const duplicate: string[] = [];
  let optimized = 0;

  const seenTitles = new Map<string, string[]>();

  for (const page of pages) {
    if (page.checks?.no_title || !page.meta?.title) {
      missing.push(page.url);
    } else {
      const title = page.meta.title;
      const titleLength = page.meta.title_length || title.length;

      if (titleLength > 60 || page.checks?.title_too_long) {
        tooLong.push(page.url);
      } else if (titleLength < 30 || page.checks?.title_too_short) {
        tooShort.push(page.url);
      } else {
        optimized++;
      }

      // Track duplicates
      if (!seenTitles.has(title)) {
        seenTitles.set(title, []);
      }
      seenTitles.get(title)!.push(page.url);
    }
  }

  // Find duplicates
  for (const [, urls] of seenTitles) {
    if (urls.length > 1) {
      duplicate.push(...urls);
    }
  }

  return {
    data: {
      missing,
      tooLong,
      tooShort,
      duplicate,
      optimized,
      total: pages.length,
    },
  };
}

function analyzeMetaDescriptions(pages: PageData[]) {
  const missing: string[] = [];
  const tooLong: string[] = [];
  const tooShort: string[] = [];
  const duplicate: string[] = [];
  let optimized = 0;

  const seenDescriptions = new Map<string, string[]>();

  for (const page of pages) {
    if (page.checks?.no_description || !page.meta?.description) {
      missing.push(page.url);
    } else {
      const desc = page.meta.description;
      const descLength = page.meta.description_length || desc.length;

      if (descLength > 160 || page.checks?.description_too_long) {
        tooLong.push(page.url);
      } else if (descLength < 50 || page.checks?.description_too_short) {
        tooShort.push(page.url);
      } else {
        optimized++;
      }

      // Track duplicates
      if (!seenDescriptions.has(desc)) {
        seenDescriptions.set(desc, []);
      }
      seenDescriptions.get(desc)!.push(page.url);
    }
  }

  // Find duplicates
  for (const [, urls] of seenDescriptions) {
    if (urls.length > 1) {
      duplicate.push(...urls);
    }
  }

  return {
    data: {
      missing,
      tooLong,
      tooShort,
      duplicate,
      optimized,
      total: pages.length,
    },
  };
}

function analyzeHeadings(pages: PageData[]) {
  const pagesWithoutH1: string[] = [];
  const pagesWithMultipleH1: string[] = [];
  const headingStructureIssues: string[] = [];

  for (const page of pages) {
    const h1s = page.meta?.htags?.h1 || [];

    if (h1s.length === 0 || page.checks?.no_h1_tag) {
      pagesWithoutH1.push(page.url);
    } else if (h1s.length > 1) {
      pagesWithMultipleH1.push(page.url);
    }
  }

  return {
    data: {
      pagesWithoutH1,
      pagesWithMultipleH1,
      headingStructureIssues,
    },
  };
}

function analyzeImages(pages: PageData[]) {
  const withoutAlt: string[] = [];
  const withoutTitle: string[] = [];
  const oversized: string[] = [];
  let totalImages = 0;

  for (const page of pages) {
    totalImages += page.meta?.images_count || 0;

    if (page.checks?.no_image_alt) {
      withoutAlt.push(page.url);
    }
    if (page.checks?.no_image_title) {
      withoutTitle.push(page.url);
    }
  }

  return {
    data: {
      withoutAlt,
      withoutTitle,
      oversized,
      totalImages,
    },
  };
}

function buildOnPageSummary(data: OnPageSEOData, issues: AuditIssue[]): string {
  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = issues.filter((i) => i.severity === 'HIGH').length;

  if (criticalCount > 0) {
    return `Found ${criticalCount} critical on-page issues including missing title tags.`;
  }
  if (highCount > 0) {
    return `Found ${highCount} high-priority on-page issues to address.`;
  }
  if (issues.length > 0) {
    return `On-page optimization is mostly solid with ${issues.length} improvements recommended.`;
  }
  return 'On-page SEO is well-optimized across all pages.';
}

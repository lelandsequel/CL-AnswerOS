// lib/audit-engine/analyzers/technical.ts
// Technical SEO analysis using DataForSEO On-Page API

import {
  startOnPageCrawl,
  waitForCrawl,
  getOnPagePages,
  runLighthouseAudit,
} from '../dataforseo-client';
import {
  generateRobotsTxt,
  generateSitemapXml,
  generateCanonicalTag,
  createIssue,
} from '../fix-generator';
import type { PillarAnalysis, TechnicalSEOData, AuditIssue } from '../types';

interface CrawledPage {
  url: string;
  click_depth: number;
  broken_links: boolean;
  [key: string]: unknown;
}

/**
 * Run technical SEO analysis
 */
export async function analyzeTechnicalSEO(
  url: string,
  options?: { maxPages?: number }
): Promise<{ analysis: PillarAnalysis; rawData: TechnicalSEOData }> {
  const domain = new URL(url).hostname;
  const issues: AuditIssue[] = [];
  const quickWins: AuditIssue[] = [];

  // Start crawl
  console.log('[Technical] Starting On-Page crawl...');
  let summary;
  let pages: CrawledPage[] = [];
  let lighthouse;

  try {
    const taskId = await startOnPageCrawl(url, { maxPages: options?.maxPages ?? 100 });
    summary = await waitForCrawl(taskId, { maxWaitMs: 180000 });
    pages = (await getOnPagePages(taskId, { limit: 100 })) as CrawledPage[];
  } catch (error) {
    console.error('[Technical] Crawl failed:', error);
    // Return a minimal analysis if crawl fails
    return createFallbackAnalysis(url, domain);
  }

  // Run Lighthouse
  try {
    lighthouse = await runLighthouseAudit(url, { device: 'mobile' });
  } catch (error) {
    console.error('[Technical] Lighthouse failed:', error);
  }

  if (!summary) {
    return createFallbackAnalysis(url, domain);
  }

  const domainInfo = summary.domain_info;
  const pageMetrics = summary.page_metrics;
  const checks = domainInfo.checks;

  // Build raw data
  const rawData: TechnicalSEOData = {
    crawlability: {
      robotsTxt: {
        exists: checks.robots_txt,
        issues: !checks.robots_txt ? ['No robots.txt file found'] : [],
      },
      sitemap: {
        exists: checks.sitemap,
        pageCount: domainInfo.total_pages,
        issues: !checks.sitemap ? ['No XML sitemap found'] : [],
      },
      canonicals: {
        correctCount: 0, // Would need page-level analysis
        missingCount: 0,
        conflictingCount: 0,
      },
      redirects: {
        count: 0,
        chains: pageMetrics.redirect_loop,
        loops: pageMetrics.redirect_loop,
      },
    },
    performance: {
      loadTime: lighthouse?.audits?.['speed-index']?.numericValue ? lighthouse.audits['speed-index'].numericValue / 1000 : 0,
      ttfb: lighthouse?.audits?.['server-response-time']?.numericValue ? lighthouse.audits['server-response-time'].numericValue / 1000 : 0,
      lcp: lighthouse?.audits?.['largest-contentful-paint']?.numericValue ? lighthouse.audits['largest-contentful-paint'].numericValue / 1000 : 0,
      fid: lighthouse?.audits?.['max-potential-fid']?.numericValue || 0,
      cls: lighthouse?.audits?.['cumulative-layout-shift']?.numericValue || 0,
      mobileScore: lighthouse?.categories?.performance?.score ? lighthouse.categories.performance.score * 100 : 0,
      desktopScore: 0, // Would need separate desktop audit
    },
    indexability: {
      indexablePages: domainInfo.total_pages - pageMetrics.non_indexable,
      noindexPages: pageMetrics.non_indexable,
      blockedPages: 0,
      orphanPages: 0,
    },
    security: {
      https: checks.ssl,
      mixedContent: false, // Would need page-level analysis
      securityHeaders: [],
    },
  };

  // =========================================================================
  // ISSUE: Missing robots.txt
  // =========================================================================
  if (!checks.robots_txt) {
    const issue = createIssue(
      'tech-001',
      'Missing robots.txt',
      'No robots.txt file found. This file tells search engines how to crawl your site.',
      'HIGH',
      'Search engines may crawl inefficiently or index unwanted pages',
      'No robots.txt file exists at /robots.txt',
      generateRobotsTxt({
        sitemap: `https://${domain}/sitemap.xml`,
        disallow: ['/api/', '/admin/', '/_next/'],
        allow: ['/'],
      })
    );
    issues.push(issue);
    quickWins.push(issue);
  }

  // =========================================================================
  // ISSUE: Missing sitemap
  // =========================================================================
  if (!checks.sitemap) {
    const sitePages = pages?.slice(0, 50).map((p) => ({
      url: p.url,
      priority: p.click_depth === 1 ? 1.0 : p.click_depth === 2 ? 0.8 : 0.6,
      changefreq: 'weekly',
    })) || [];

    const issue = createIssue(
      'tech-002',
      'Missing XML Sitemap',
      'No XML sitemap found. Sitemaps help search engines discover and index your pages faster.',
      'HIGH',
      'Slower indexing, potential for pages to be missed by search engines',
      'No sitemap.xml file found',
      generateSitemapXml(sitePages.length ? sitePages : [{ url: url, priority: 1.0 }])
    );
    issues.push(issue);
    quickWins.push(issue);
  }

  // =========================================================================
  // ISSUE: No HTTPS
  // =========================================================================
  if (!checks.ssl) {
    issues.push(
      createIssue(
        'tech-003',
        'Site not using HTTPS',
        'Your site is not using HTTPS. Google uses HTTPS as a ranking signal.',
        'CRITICAL',
        'Security warnings in browsers, ranking penalty, user trust issues',
        'Site served over HTTP instead of HTTPS',
        {
          type: 'instruction',
          title: 'Enable HTTPS',
          description: 'Steps to enable HTTPS on your site',
          content: `# Enable HTTPS

1. **Get an SSL Certificate**
   - Free: Use Let's Encrypt (https://letsencrypt.org)
   - Or purchase from your hosting provider

2. **Install the Certificate**
   - Follow your hosting provider's instructions
   - For Vercel/Netlify: HTTPS is automatic

3. **Update Internal Links**
   - Change all http:// links to https://
   - Update canonical tags

4. **Set Up Redirects**
   - Redirect all HTTP traffic to HTTPS
   - Add to .htaccess or server config:

\`\`\`apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
\`\`\`

5. **Update Google Search Console**
   - Add HTTPS version of your site
   - Submit new sitemap
`,
          estimatedEffort: 'hours',
        }
      )
    );
  }

  // =========================================================================
  // ISSUE: Broken links
  // =========================================================================
  if (pageMetrics.broken_links > 0) {
    const brokenPages = pages?.filter((p) => p.broken_links) || [];
    issues.push(
      createIssue(
        'tech-004',
        `${pageMetrics.broken_links} Broken Links Found`,
        'Broken links hurt user experience and waste crawl budget.',
        pageMetrics.broken_links > 10 ? 'HIGH' : 'MEDIUM',
        'Poor user experience, wasted link equity, crawl issues',
        `Found ${pageMetrics.broken_links} broken links across the site`,
        {
          type: 'instruction',
          title: 'Fix Broken Links',
          description: 'Pages with broken links to fix',
          content: `# Broken Links to Fix

${brokenPages.slice(0, 20).map((p) => `- ${p.url}`).join('\n') || 'Run detailed crawl to identify specific broken links'}

## How to Fix

1. **For each broken link:**
   - If the target page exists elsewhere, update the link
   - If the target page is gone, remove the link or find alternative
   - If it's your page, create a redirect to relevant content

2. **For 404 pages:**
   - Create proper redirects (301) to relevant pages
   - Or create the missing content

3. **Prevent future issues:**
   - Use a link checker tool regularly
   - Set up monitoring for 404 errors
`,
          estimatedEffort: 'hours',
        }
      )
    );
  }

  // =========================================================================
  // ISSUE: Redirect loops
  // =========================================================================
  if (pageMetrics.redirect_loop > 0) {
    issues.push(
      createIssue(
        'tech-005',
        `${pageMetrics.redirect_loop} Redirect Loops Found`,
        'Redirect loops prevent pages from loading and waste crawl budget.',
        'CRITICAL',
        'Pages cannot be accessed, severe SEO impact',
        `Found ${pageMetrics.redirect_loop} redirect loops`,
        {
          type: 'instruction',
          title: 'Fix Redirect Loops',
          description: 'How to identify and fix redirect loops',
          content: `# Fix Redirect Loops

## What's a Redirect Loop?
Page A redirects to Page B, which redirects back to Page A (or through a chain back to A).

## How to Fix

1. **Identify the loops**
   - Use a redirect checker tool
   - Check server logs for redirect patterns

2. **Map out the redirects**
   - Document current redirect rules
   - Identify circular paths

3. **Fix the rules**
   - Each redirect should go to a final destination
   - Avoid chains of more than 2 redirects
   - Example fix in .htaccess:

\`\`\`apache
# Instead of:
# /page-a -> /page-b -> /page-a

# Do:
Redirect 301 /page-a /final-destination
Redirect 301 /page-b /final-destination
\`\`\`
`,
          estimatedEffort: 'hours',
        }
      )
    );
  }

  // =========================================================================
  // ISSUE: Poor Core Web Vitals
  // =========================================================================
  if (lighthouse) {
    const lcpScore = lighthouse.audits?.['largest-contentful-paint']?.score ?? 1;
    const clsScore = lighthouse.audits?.['cumulative-layout-shift']?.score ?? 1;
    const fidScore = lighthouse.audits?.['max-potential-fid']?.score ?? 1;

    if (lcpScore < 0.5 || clsScore < 0.5 || fidScore < 0.5) {
      const lcpValue = (lighthouse.audits?.['largest-contentful-paint']?.numericValue || 0) / 1000;
      const clsValue = lighthouse.audits?.['cumulative-layout-shift']?.numericValue || 0;

      issues.push(
        createIssue(
          'tech-006',
          'Poor Core Web Vitals',
          'Core Web Vitals are a ranking factor. Your site has performance issues.',
          'HIGH',
          'Ranking penalty, poor user experience, higher bounce rate',
          `LCP: ${lcpValue.toFixed(1)}s, CLS: ${clsValue.toFixed(2)}`,
          {
            type: 'code',
            title: 'Core Web Vitals Optimization',
            description: 'Code improvements for better Core Web Vitals',
            content: `// next.config.js optimizations
const nextConfig = {
  images: {
    // Use modern image formats
    formats: ['image/avif', 'image/webp'],
    // Enable blur placeholder for LCP
    placeholder: 'blur',
  },

  // Enable compression
  compress: true,

  // Optimize fonts
  optimizeFonts: true,

  experimental: {
    // Enable optimistic client cache
    optimisticClientCache: true,
  },
};

// For LCP improvement - preload critical assets
// Add to <Head> component:
<link rel="preload" as="image" href="/hero-image.webp" />
<link rel="preconnect" href="https://fonts.googleapis.com" />

// For CLS improvement - set explicit dimensions
// Always include width and height on images:
<Image
  src="/image.jpg"
  width={800}
  height={600}
  alt="Description"
/>

// Reserve space for dynamic content:
<div style={{ minHeight: '300px' }}>
  {/* Dynamic content */}
</div>`,
            language: 'javascript',
            estimatedEffort: 'hours',
          }
        )
      );
    }
  }

  // =========================================================================
  // ISSUE: Duplicate content
  // =========================================================================
  if (pageMetrics.duplicate_content > 0) {
    issues.push(
      createIssue(
        'tech-007',
        `${pageMetrics.duplicate_content} Pages with Duplicate Content`,
        'Duplicate content can cause ranking issues as search engines may not know which version to index.',
        'MEDIUM',
        'Diluted rankings, wasted crawl budget',
        `Found ${pageMetrics.duplicate_content} pages with duplicate content`,
        {
          type: 'instruction',
          title: 'Fix Duplicate Content',
          description: 'How to resolve duplicate content issues',
          content: `# Fix Duplicate Content

## Options:

### 1. Canonical Tags (Recommended)
Add canonical tags pointing to the preferred version:
\`\`\`html
<link rel="canonical" href="https://example.com/preferred-page">
\`\`\`

### 2. 301 Redirects
If duplicates shouldn't exist, redirect them:
\`\`\`apache
Redirect 301 /duplicate-page /original-page
\`\`\`

### 3. Consolidate Content
- Merge similar pages into one comprehensive page
- Keep the best-performing URL
- Redirect others to it

### 4. Parameter Handling
In Google Search Console:
- Go to Legacy Tools > URL Parameters
- Tell Google how to handle parameters
`,
          estimatedEffort: 'hours',
        }
      )
    );
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
    name: 'Technical SEO',
    score,
    status: score >= 70 ? 'good' : score >= 40 ? 'needs-work' : 'critical',
    summary: buildTechnicalSummary(rawData, issues),
    currentState: {
      hasRobotsTxt: checks.robots_txt,
      hasSitemap: checks.sitemap,
      hasSSL: checks.ssl,
      totalPages: domainInfo.total_pages,
      brokenLinks: pageMetrics.broken_links,
      mobileScore: rawData.performance.mobileScore,
      onpageScore: pageMetrics.onpage_score,
    },
    issues,
    quickWins,
  };

  return { analysis, rawData };
}

function buildTechnicalSummary(data: TechnicalSEOData, issues: AuditIssue[]): string {
  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = issues.filter((i) => i.severity === 'HIGH').length;

  if (criticalCount > 0) {
    return `Found ${criticalCount} critical technical issues requiring immediate attention.`;
  }
  if (highCount > 0) {
    return `Found ${highCount} high-priority technical issues to address.`;
  }
  if (issues.length > 0) {
    return `Technical foundation is solid with ${issues.length} minor improvements recommended.`;
  }
  return 'Technical SEO is well-optimized with no major issues found.';
}

function createFallbackAnalysis(url: string, domain: string): { analysis: PillarAnalysis; rawData: TechnicalSEOData } {
  return {
    analysis: {
      name: 'Technical SEO',
      score: 50,
      status: 'needs-work',
      summary: 'Unable to complete full technical crawl. Manual review recommended.',
      currentState: {
        crawlFailed: true,
        url,
      },
      issues: [
        createIssue(
          'tech-fallback',
          'Technical Crawl Failed',
          'Unable to complete automated crawl. This could be due to robots.txt blocking, server issues, or rate limiting.',
          'MEDIUM',
          'Cannot assess full technical health',
          'Automated crawl could not be completed',
          {
            type: 'instruction',
            title: 'Manual Technical Review',
            description: 'Steps for manual technical SEO review',
            content: `# Manual Technical Review Needed

1. Check robots.txt at ${url}/robots.txt
2. Check sitemap at ${url}/sitemap.xml
3. Run Google PageSpeed Insights: https://pagespeed.web.dev/
4. Check Google Search Console for crawl errors
5. Use browser dev tools to check for console errors
`,
            estimatedEffort: 'hours',
          }
        ),
      ],
      quickWins: [],
    },
    rawData: {
      crawlability: {
        robotsTxt: { exists: false, issues: ['Could not check'] },
        sitemap: { exists: false, issues: ['Could not check'] },
        canonicals: { correctCount: 0, missingCount: 0, conflictingCount: 0 },
        redirects: { count: 0, chains: 0, loops: 0 },
      },
      performance: {
        loadTime: 0,
        ttfb: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        mobileScore: 0,
        desktopScore: 0,
      },
      indexability: {
        indexablePages: 0,
        noindexPages: 0,
        blockedPages: 0,
        orphanPages: 0,
      },
      security: {
        https: false,
        mixedContent: false,
        securityHeaders: [],
      },
    },
  };
}

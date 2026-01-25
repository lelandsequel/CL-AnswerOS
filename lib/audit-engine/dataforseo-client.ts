// lib/audit-engine/dataforseo-client.ts
// DataForSEO API client for deep auditing

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3';

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error('DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set');
  }

  return `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;
}

async function apiRequest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${DATAFORSEO_API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[DataForSEO] Error:', res.status, text);
    throw new Error(`DataForSEO request failed: ${res.status}`);
  }

  return res.json();
}

// =============================================================================
// ON-PAGE API - Technical SEO Crawling
// Docs: https://docs.dataforseo.com/v3/on_page/overview/
// =============================================================================

export interface OnPageTaskResponse {
  tasks?: Array<{
    id: string;
    status_code: number;
    status_message: string;
    result?: Array<{
      crawl_progress: string;
      crawl_status: {
        pages_crawled: number;
        pages_in_queue: number;
      };
    }>;
  }>;
}

export interface OnPageSummaryResponse {
  tasks?: Array<{
    result?: Array<{
      crawl_progress: string;
      crawl_status: {
        max_crawl_pages: number;
        pages_crawled: number;
        pages_in_queue: number;
      };
      domain_info: {
        name: string;
        cms: string;
        ip: string;
        server: string;
        crawl_start: string;
        crawl_end: string;
        ssl_info: {
          valid_certificate: boolean;
          certificate_issuer: string;
          certificate_subject: string;
          certificate_version: string;
          certificate_hash: string;
          certificate_expiration_date: string;
        };
        checks: {
          sitemap: boolean;
          robots_txt: boolean;
          start_page_deny_flag: boolean;
          ssl: boolean;
          http2: boolean;
          test_canonicalization: boolean;
          test_hidden_server_signature: boolean;
          test_page_not_found: boolean;
          test_directory_browsing: boolean;
          test_https_redirect: boolean;
        };
        total_pages: number;
        page_not_found_status_code: number;
        canonicalization_status_code: number;
        directory_browsing_status_code: number;
        www_redirect_status_code: number | null;
        main_domain: string;
      };
      page_metrics: {
        links_external: number;
        links_internal: number;
        duplicate_title: number;
        duplicate_description: number;
        duplicate_content: number;
        broken_links: number;
        broken_resources: number;
        links_relation_conflict: number;
        redirect_loop: number;
        onpage_score: number;
        non_indexable: number;
        pages_with_low_word_count: number;
        pages_with_high_loading_time: number;
        pages_with_little_content: number;
        pages_with_meta_tags_issues: number;
      };
    }>;
  }>;
}

export interface OnPagePagesResponse {
  tasks?: Array<{
    result?: Array<{
      items?: Array<{
        url: string;
        meta: {
          title: string;
          charset: number;
          follow: boolean;
          generator: string;
          htags: {
            h1?: string[];
            h2?: string[];
            h3?: string[];
          };
          description: string;
          favicon: string;
          meta_keywords: string;
          canonical: string;
          internal_links_count: number;
          external_links_count: number;
          inbound_links_count: number;
          images_count: number;
          images_size: number;
          scripts_count: number;
          scripts_size: number;
          stylesheets_count: number;
          stylesheets_size: number;
          title_length: number;
          description_length: number;
          render_blocking_scripts_count: number;
          render_blocking_stylesheets_count: number;
          cumulative_layout_shift: number;
          largest_contentful_paint: number;
          total_blocking_time: number;
          time_to_interactive: number;
          first_contentful_paint: number;
          speed_index: number;
          deprecated_html_tags: string[];
          duplicate_meta_tags: string[];
          spell: string[];
          social_media_tags: {
            og_title: string;
            og_description: string;
            og_image: string;
            twitter_title: string;
            twitter_description: string;
            twitter_image: string;
          };
        };
        page_timing: {
          time_to_interactive: number;
          dom_complete: number;
          largest_contentful_paint: number;
          first_input_delay: number;
          connection_time: number;
          time_to_secure_connection: number;
          request_sent_time: number;
          waiting_time: number;
          download_time: number;
          duration_time: number;
          fetch_start: number;
          fetch_end: number;
        };
        onpage_score: number;
        total_dom_size: number;
        custom_js_response: unknown;
        resource_errors: {
          errors: Array<{ line: number; column: number; message: string }>;
          warnings: Array<{ line: number; column: number; message: string }>;
        };
        broken_resources: boolean;
        broken_links: boolean;
        duplicate_title: boolean;
        duplicate_description: boolean;
        duplicate_content: boolean;
        click_depth: number;
        size: number;
        encoded_size: number;
        total_transfer_size: number;
        fetch_time: string;
        cache_control: {
          cachable: boolean;
          ttl: number;
        };
        checks: {
          no_content_encoding: boolean;
          high_loading_time: boolean;
          is_redirect: boolean;
          is_4xx_code: boolean;
          is_5xx_code: boolean;
          is_broken: boolean;
          is_www: boolean;
          is_https: boolean;
          is_http: boolean;
          high_waiting_time: boolean;
          no_doctype: boolean;
          no_encoding_meta_tag: boolean;
          no_h1_tag: boolean;
          https_to_http_links: boolean;
          size_greater_than_3mb: boolean;
          meta_charset_consistency: boolean;
          has_meta_refresh_redirect: boolean;
          has_render_blocking_resources: boolean;
          redirect_chain: boolean;
          canonical_to_redirect: boolean;
          canonical_to_broken: boolean;
          has_html_doctype: boolean;
          has_links_to_redirects: boolean;
          seo_friendly_url: boolean;
          flash: boolean;
          frame: boolean;
          lorem_ipsum: boolean;
          seo_friendly_url_characters_check: boolean;
          seo_friendly_url_dynamic_check: boolean;
          seo_friendly_url_keywords_check: boolean;
          seo_friendly_url_relative_length_check: boolean;
          has_micromarkup: boolean;
          has_deprecated_html_tags: boolean;
          has_duplicate_meta_tags: boolean;
          canonical_to_meta_noindex: boolean;
          no_image_alt: boolean;
          no_image_title: boolean;
          title_too_long: boolean;
          title_too_short: boolean;
          no_title: boolean;
          no_description: boolean;
          description_too_long: boolean;
          description_too_short: boolean;
          irrelevant_description: boolean;
          irrelevant_title: boolean;
          irrelevant_meta_keywords: boolean;
          low_character_count: boolean;
          low_content_rate: boolean;
          small_page_size: boolean;
          no_favicon: boolean;
          no_content: boolean;
          low_readability_rate: boolean;
        };
        content_encoding: string;
        media_type: string;
        server: string;
        is_resource: boolean;
        status_code: number;
        location: string | null;
        url_length: number;
        relative_url_length: number;
      }>;
    }>;
  }>;
}

/**
 * Start an On-Page crawl task
 */
export async function startOnPageCrawl(
  target: string,
  options?: {
    maxPages?: number;
    enableJavaScript?: boolean;
    customUserAgent?: string;
  }
): Promise<string> {
  const response = await apiRequest<OnPageTaskResponse>('/on_page/task_post', [
    {
      target,
      max_crawl_pages: options?.maxPages ?? 100,
      load_resources: true,
      enable_javascript: options?.enableJavaScript ?? true,
      enable_browser_rendering: true,
      store_raw_html: false,
    },
  ]);

  const taskId = response.tasks?.[0]?.id;
  if (!taskId) {
    throw new Error('Failed to start On-Page crawl - no task ID returned');
  }

  return taskId;
}

type OnPageSummaryResult = NonNullable<NonNullable<OnPageSummaryResponse['tasks']>[0]['result']>[0];

/**
 * Get On-Page crawl summary
 */
export async function getOnPageSummary(taskId: string): Promise<OnPageSummaryResult | null> {
  const response = await apiRequest<OnPageSummaryResponse>('/on_page/summary', [
    { id: taskId },
  ]);

  return response.tasks?.[0]?.result?.[0] ?? null;
}

type OnPagePagesItems = NonNullable<NonNullable<NonNullable<OnPagePagesResponse['tasks']>[0]['result']>[0]['items']>;

/**
 * Get crawled pages with details
 */
export async function getOnPagePages(
  taskId: string,
  options?: {
    limit?: number;
    offset?: number;
    filters?: string[];
  }
): Promise<OnPagePagesItems> {
  const response = await apiRequest<OnPagePagesResponse>('/on_page/pages', [
    {
      id: taskId,
      limit: options?.limit ?? 100,
      offset: options?.offset ?? 0,
      filters: options?.filters,
    },
  ]);

  return response.tasks?.[0]?.result?.[0]?.items ?? [];
}

/**
 * Wait for crawl to complete (with timeout)
 */
export async function waitForCrawl(
  taskId: string,
  options?: { maxWaitMs?: number; pollIntervalMs?: number }
): Promise<OnPageSummaryResult | null> {
  const maxWait = options?.maxWaitMs ?? 120000; // 2 minutes default
  const pollInterval = options?.pollIntervalMs ?? 5000; // 5 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const summary = await getOnPageSummary(taskId);

    if (summary?.crawl_progress === 'finished') {
      return summary;
    }

    if (summary?.crawl_progress === 'failed') {
      throw new Error('On-Page crawl failed');
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`On-Page crawl timed out after ${maxWait}ms`);
}

// =============================================================================
// BACKLINKS API - Authority Analysis
// Docs: https://docs.dataforseo.com/v3/backlinks/overview/
// =============================================================================

export interface BacklinksSummaryResponse {
  tasks?: Array<{
    result?: Array<{
      target: string;
      first_seen: string;
      lost_date: string | null;
      rank: number;
      backlinks: number;
      backlinks_spam_score: number;
      crawled_pages: number;
      info: {
        server: string;
        cms: string;
        platform_type: string[];
        ip_address: string;
        country: string;
        is_ip: boolean;
        target_spam_score: number;
      };
      internal_links_count: number;
      external_links_count: number;
      broken_backlinks: number;
      broken_pages: number;
      referring_domains: number;
      referring_domains_nofollow: number;
      referring_main_domains: number;
      referring_main_domains_nofollow: number;
      referring_ips: number;
      referring_subnets: number;
      referring_pages: number;
      referring_pages_nofollow: number;
      referring_links_tld: { [tld: string]: number };
      referring_links_types: {
        anchor: number;
        alternate: number;
        canonical: number;
        image: number;
        form: number;
        redirect: number;
      };
      referring_links_attributes: {
        nofollow: number;
        noopener: number;
        noreferrer: number;
        external: number;
        ugc: number;
        sponsored: number;
        dofollow: number;
      };
      referring_links_platform_types: { [type: string]: number };
      referring_links_semantic_locations: { [location: string]: number };
      referring_links_countries: { [country: string]: number };
    }>;
  }>;
}

type BacklinksSummaryResult = NonNullable<NonNullable<BacklinksSummaryResponse['tasks']>[0]['result']>[0];

/**
 * Get backlinks summary for a domain
 */
export async function getBacklinksSummary(
  target: string
): Promise<BacklinksSummaryResult | null> {
  const response = await apiRequest<BacklinksSummaryResponse>('/backlinks/summary/live', [
    {
      target,
      include_subdomains: true,
    },
  ]);

  return response.tasks?.[0]?.result?.[0] ?? null;
}

// =============================================================================
// PAGE SPEED API - Core Web Vitals
// Docs: https://docs.dataforseo.com/v3/on_page/lighthouse/
// =============================================================================

export interface LighthouseResponse {
  tasks?: Array<{
    result?: Array<{
      audits: {
        [key: string]: {
          id: string;
          title: string;
          description: string;
          score: number | null;
          scoreDisplayMode: string;
          numericValue?: number;
          numericUnit?: string;
          displayValue?: string;
        };
      };
      categories: {
        performance: { score: number };
        accessibility: { score: number };
        'best-practices': { score: number };
        seo: { score: number };
      };
    }>;
  }>;
}

type LighthouseResult = NonNullable<NonNullable<LighthouseResponse['tasks']>[0]['result']>[0];

/**
 * Run Lighthouse audit on a URL
 */
export async function runLighthouseAudit(
  url: string,
  options?: { device?: 'desktop' | 'mobile' }
): Promise<LighthouseResult | null> {
  const response = await apiRequest<LighthouseResponse>('/on_page/lighthouse/live/json', [
    {
      url,
      for_mobile: options?.device === 'mobile',
      categories: ['performance', 'accessibility', 'best-practices', 'seo'],
    },
  ]);

  return response.tasks?.[0]?.result?.[0] ?? null;
}

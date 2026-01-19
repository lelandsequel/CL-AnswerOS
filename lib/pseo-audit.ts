import { PseoAuditRequest, PseoAuditResponse, PseoPage, PseoPageType } from "./pseo-types";
import { fetchKeywordDataFromDataForSEO } from "./dataforseo-extended";

function normList(input?: string[] | string): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => s.trim()).filter(Boolean);
  return input
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const GEO_PRESETS: Record<string, string[]> = {
  texas: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
  "united states": ["Houston", "Dallas", "Austin", "Chicago", "New York", "Los Angeles", "Miami", "Denver", "Atlanta", "Phoenix"],
  usa: ["Houston", "Dallas", "Austin", "Chicago", "New York", "Los Angeles", "Miami", "Denver", "Atlanta", "Phoenix"],
};

function deriveLocations(geography: string): string[] {
  const key = geography.toLowerCase().trim();
  if (GEO_PRESETS[key]) return GEO_PRESETS[key];
  if (key.includes("texas")) return GEO_PRESETS["texas"];
  if (key.includes("united states") || key.includes("usa")) return GEO_PRESETS["united states"];
  return [];
}

const TEMPLATE_SECTIONS: Record<PseoPageType, string[]> = {
  service: ["H1", "Overview", "Who It's For", "Benefits", "Process", "FAQs", "CTA"],
  loan_program: ["H1", "Program Overview", "Typical Terms", "Eligibility", "Process", "FAQs", "CTA"],
  asset_class: ["H1", "Asset Class Overview", "Common Deal Structures", "What We Finance", "Case Examples", "FAQs", "CTA"],
  market: ["H1", "Market Snapshot", "Local Deal Types", "How We Help", "FAQs", "CTA"],
  use_case: ["H1", "Use Case Overview", "Ideal Borrower", "How It Works", "Timeline", "FAQs", "CTA"],
  qualifier: ["H1", "Quick Answer", "Details", "Examples", "FAQs", "CTA"],
  comparison: ["H1", "Side-by-Side", "When To Choose A", "When To Choose B", "FAQs", "CTA"],
  faq_hub: ["H1", "Top Questions", "Glossary", "Related Pages", "CTA"],
};

const SCHEMA_TYPES: Record<PseoPageType, string[]> = {
  service: ["Service", "FAQPage", "BreadcrumbList", "Organization"],
  loan_program: ["Service", "FAQPage", "BreadcrumbList", "Organization"],
  asset_class: ["Service", "FAQPage", "BreadcrumbList", "Organization"],
  market: ["LocalBusiness", "Service", "FAQPage", "BreadcrumbList", "Organization"],
  use_case: ["Article", "FAQPage", "BreadcrumbList", "Organization"],
  qualifier: ["FAQPage", "BreadcrumbList", "Organization"],
  comparison: ["Article", "FAQPage", "BreadcrumbList", "Organization"],
  faq_hub: ["FAQPage", "BreadcrumbList", "Organization"],
};

function page(
  type: PseoPageType,
  title: string,
  path: string,
  primary_keyword: string,
  secondary_keywords: string[] = []
): PseoPage {
  return {
    type,
    title,
    path,
    primary_keyword,
    secondary_keywords,
    template_sections: TEMPLATE_SECTIONS[type],
    schema_types: SCHEMA_TYPES[type],
  };
}

function countByType(pages: PseoPage[]): Record<PseoPageType, number> {
  const base: Record<PseoPageType, number> = {
    service: 0,
    loan_program: 0,
    asset_class: 0,
    market: 0,
    use_case: 0,
    qualifier: 0,
    comparison: 0,
    faq_hub: 0,
  };
  for (const p of pages) base[p.type] += 1;
  return base;
}

export async function generatePseoAudit(req: PseoAuditRequest): Promise<PseoAuditResponse> {
  const services = normList(req.services);
  const loanPrograms = req.loan_programs?.map(s => s.trim()).filter(Boolean) ?? [];
  const assetClasses = req.asset_classes?.map(s => s.trim()).filter(Boolean) ?? [];
  const useCases = req.use_cases?.map(s => s.trim()).filter(Boolean) ?? [];
  const explicitLocations = req.locations?.map(s => s.trim()).filter(Boolean) ?? [];
  const locations = explicitLocations.length ? explicitLocations : deriveLocations(req.geography);

  const company = req.company_name.trim();
  const industry = req.industry.trim();
  const geo = req.geography.trim();

  const url_conventions = {
    service_base: "/services",
    loan_base: "/loans",
    asset_class_base: "/asset-class",
    market_base: "/markets",
    use_case_base: "/use-cases",
    qualify_base: "/qualify",
    compare_base: "/compare",
    faq_base: "/faqs",
  };

  const pages: PseoPage[] = [];

  for (const s of services) {
    pages.push(
      page(
        "service",
        `${s} for ${industry}`,
        `${url_conventions.service_base}/${slugify(s)}`,
        `${s} ${industry}`
      )
    );
  }

  for (const lp of loanPrograms) {
    pages.push(
      page(
        "loan_program",
        `${lp}`,
        `${url_conventions.loan_base}/${slugify(lp)}`,
        `${lp} ${industry}`
      )
    );
  }

  for (const ac of assetClasses) {
    pages.push(
      page(
        "asset_class",
        `${ac} Financing`,
        `${url_conventions.asset_class_base}/${slugify(ac)}`,
        `${ac} financing`
      )
    );
  }

  for (const loc of locations) {
    pages.push(
      page(
        "market",
        `${loc} ${industry} Financing`,
        `${url_conventions.market_base}/${slugify(loc)}`,
        `${loc} ${industry} financing`
      )
    );
  }

  for (const uc of useCases) {
    pages.push(
      page(
        "use_case",
        `${uc}`,
        `${url_conventions.use_case_base}/${slugify(uc)}`,
        `${uc} financing`
      )
    );
  }

  const qualifiers = [
    { title: "Minimum Loan Size", kw: "minimum loan size" },
    { title: "Typical LTV", kw: "loan to value" },
    { title: "Recourse vs Non-Recourse", kw: "recourse vs non recourse" },
    { title: "Speed to Close", kw: "how fast can I close" },
  ];
  for (const q of qualifiers) {
    pages.push(
      page(
        "qualifier",
        `${q.title}`,
        `${url_conventions.qualify_base}/${slugify(q.title)}`,
        `${q.kw} ${industry}`
      )
    );
  }

  const comparisons = [
    { a: "Bridge Loan", b: "Construction Loan" },
    { a: "Preferred Equity", b: "Mezzanine Financing" },
  ];
  for (const c of comparisons) {
    pages.push(
      page(
        "comparison",
        `${c.a} vs ${c.b}`,
        `${url_conventions.compare_base}/${slugify(`${c.a}-vs-${c.b}`)}`,
        `${c.a} vs ${c.b}`
      )
    );
  }

  const faqHubs = [
    "Bridge Loans FAQs",
    "Construction Financing FAQs",
    "Underwriting FAQs",
    "Closing Process FAQs",
  ];
  for (const fh of faqHubs) {
    pages.push(
      page(
        "faq_hub",
        fh,
        `${url_conventions.faq_base}/${slugify(fh.replace(/ faqs$/i, ""))}`,
        fh.toLowerCase().replace(/\s+/g, " ")
      )
    );
  }

  const by_type = countByType(pages);
  const total_pages = pages.length;

  const hubs = [
    ...pages.filter(p => p.type === "service").map(p => p.path),
    ...pages.filter(p => p.type === "loan_program").map(p => p.path),
  ];
  const spokes = [
    ...pages.filter(p => p.type === "market").map(p => p.path),
    ...pages.filter(p => p.type === "asset_class").map(p => p.path),
    ...pages.filter(p => p.type === "use_case").map(p => p.path),
  ];

  const schema_recommendations: Record<string, string[]> = {
    homepage: ["Organization", "WebSite", "BreadcrumbList"],
    service: SCHEMA_TYPES.service,
    loan_program: SCHEMA_TYPES.loan_program,
    asset_class: SCHEMA_TYPES.asset_class,
    market: SCHEMA_TYPES.market,
    use_case: SCHEMA_TYPES.use_case,
    qualifier: SCHEMA_TYPES.qualifier,
    comparison: SCHEMA_TYPES.comparison,
    faq_hub: SCHEMA_TYPES.faq_hub,
  };

  const internal_linking = {
    hubs,
    spokes,
    rules: [
      "All spokes must link back to 1–2 hubs using exact-match anchors.",
      "Markets link to relevant loan programs and 1 qualifier page.",
      "Asset class pages link to 2 use-cases and 1 comparison page.",
      "FAQ hubs link to all related hubs + top spokes.",
      "Every page includes breadcrumbs + related pages block.",
    ],
  };

  const lines: string[] = [];
  lines.push(`# pSEO Audit: ${company}`);
  lines.push(``);
  lines.push(`## Overview`);
  lines.push(`- **Industry:** ${industry}`);
  lines.push(`- **Geography:** ${geo}`);
  lines.push(`- **Target Customer:** ${req.target_customer}`);
  lines.push(`- **Total Pages:** ${total_pages}`);
  lines.push(``);
  lines.push(`## Page Inventory`);
  const order: PseoPageType[] = ["service","loan_program","asset_class","market","use_case","qualifier","comparison","faq_hub"];
  for (const t of order) lines.push(`- **${t}**: ${by_type[t]}`);
  lines.push(``);
  lines.push(`## URL Conventions`);
  lines.push(`- Services: \`${url_conventions.service_base}/{service}\``);
  lines.push(`- Loans: \`${url_conventions.loan_base}/{program}\``);
  lines.push(`- Asset Class: \`${url_conventions.asset_class_base}/{asset}\``);
  lines.push(`- Markets: \`${url_conventions.market_base}/{market}\``);
  lines.push(`- Use Cases: \`${url_conventions.use_case_base}/{use-case}\``);
  lines.push(`- Qualify: \`${url_conventions.qualify_base}/{topic}\``);
  lines.push(`- Compare: \`${url_conventions.compare_base}/{a}-vs-{b}\``);
  lines.push(`- FAQs: \`${url_conventions.faq_base}/{topic}\``);
  lines.push(``);
  lines.push(`## Internal Linking`);
  for (const r of internal_linking.rules) lines.push(`- ${r}`);
  lines.push(``);
  lines.push(`## Schema`);
  lines.push(`- Homepage: ${schema_recommendations.homepage.join(", ")}`);
  lines.push(`- Market Pages: ${schema_recommendations.market.join(", ")}`);
  lines.push(`- Service Pages: ${schema_recommendations.service.join(", ")}`);
  lines.push(``);
  lines.push(`## Pages (${total_pages})`);
  for (const p of pages) lines.push(`- **${p.title}** (\`${p.path}\`) — ${p.type}`);

  const markdown = lines.join("\n");

  // Enrich pages with real DataForSEO keyword data
  try {
    const keywords = pages.map(p => p.primary_keyword);
    const keywordData = await fetchKeywordDataFromDataForSEO(keywords, {
      location_name: geo,
    });

    // Create a map for quick lookup
    const dataMap = new Map(
      keywordData.map(d => [d.keyword.toLowerCase(), d])
    );

    // Enrich pages with metrics
    for (const page of pages) {
      const data = dataMap.get(page.primary_keyword.toLowerCase());
      if (data) {
        (page as any).metrics = {
          keyword: data.keyword,
          searchVolume: data.searchVolume,
          cpc: data.cpc,
          competition: data.competition,
        };
      }
    }

    // Update markdown with metrics
    const metricsLines: string[] = [];
    metricsLines.push(`## Pages (${total_pages})`);
    for (const p of pages) {
      const metrics = (p as any).metrics;
      if (metrics) {
        metricsLines.push(
          `- **${p.title}** (\`${p.path}\`) — ${p.type} | Vol: ${metrics.searchVolume} | CPC: $${metrics.cpc.toFixed(2)} | Comp: ${(metrics.competition * 100).toFixed(0)}%`
        );
      } else {
        metricsLines.push(`- **${p.title}** (\`${p.path}\`) — ${p.type}`);
      }
    }

    // Replace the pages section in markdown
    const markdownLines = markdown.split("\n");
    const pagesStartIdx = markdownLines.findIndex(l => l.startsWith("## Pages"));
    if (pagesStartIdx !== -1) {
      const newMarkdown = [
        ...markdownLines.slice(0, pagesStartIdx),
        ...metricsLines,
      ].join("\n");
      lines.splice(0, lines.length, ...newMarkdown.split("\n"));
    }
  } catch (error) {
    console.error("Failed to enrich with DataForSEO:", error);
    // Continue without enrichment
  }

  return {
    meta: {
      company_name: company,
      website_url: req.website_url,
      industry,
      geography: geo,
      target_customer: req.target_customer,
    },
    totals: { total_pages, by_type },
    url_conventions,
    internal_linking,
    schema_recommendations,
    pages,
    markdown: lines.join("\n"),
  };
}

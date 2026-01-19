type BriefCtx = {
  company_name?: string;
  industry?: string;
  geography?: string;
  markets?: string[];
  services?: string[];
};

type PageRow = {
  title: string;
  path: string;
  type: string;
};

function slugToTitle(s: string) {
  return s
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

function clamp(s: string, n: number) {
  const t = (s || "").trim();
  if (t.length <= n) return t;
  return t.slice(0, Math.max(0, n - 1)).trimEnd() + "…";
}

function parsePagesFromMarkdown(md: string): PageRow[] {
  const lines = md.split("\n");
  const pages: PageRow[] = [];
  let inPages = false;

  for (const line of lines) {
    if (/^##\s+Pages\s*\(/i.test(line.trim())) {
      inPages = true;
      continue;
    }
    if (inPages && /^##\s+/.test(line.trim())) break;

    if (inPages) {
      const m = line.match(/^\-\s+\*\*(.+?)\*\*\s+\(`([^`]+)`\)\s+—\s+([a-zA-Z0-9_]+)\s*$/);
      if (m) {
        pages.push({ title: m[1].trim(), path: m[2].trim(), type: m[3].trim() });
      }
    }
  }
  return pages;
}

function guessPrimaryKeyword(page: PageRow, ctx: BriefCtx) {
  const base = page.title.replace(/\bFAQs?\b/gi, "").replace(/\s+/g, " ").trim();
  const geo = (ctx.geography || "").trim();
  const mk = (ctx.markets || []).map((x) => x.trim()).filter(Boolean);
  const geoHint = mk.length ? mk[0] : geo;
  if (page.type === "market" && geoHint) return `${base} ${geoHint}`.trim();
  return base;
}

function intentForType(t: string) {
  const map: Record<string, string> = {
    service: "Commercial (hire/buy)",
    loan_program: "Commercial (product selection)",
    asset_class: "Commercial (fit/eligibility)",
    market: "Local commercial (near me / city intent)",
    use_case: "Commercial (use-case match)",
    qualifier: "Commercial (qualification / constraints)",
    comparison: "Commercial (comparison / decision)",
    faq_hub: "Informational (questions & objections)",
  };
  return map[t] || "Commercial";
}

function h1ForPage(page: PageRow, ctx: BriefCtx) {
  const company = ctx.company_name ? ` | ${ctx.company_name}` : "";
  if (page.type === "faq_hub") return `${page.title}${company}`.trim();
  return page.title.trim();
}

function metaTitleForPage(page: PageRow, ctx: BriefCtx) {
  const company = ctx.company_name ? ` | ${ctx.company_name}` : "";
  return clamp(`${page.title}${company}`, 60);
}

function metaDescForPage(page: PageRow, ctx: BriefCtx) {
  const company = ctx.company_name || "our team";
  const geo = ctx.geography ? ` in ${ctx.geography}` : "";
  const industry = ctx.industry ? ` for ${ctx.industry}` : "";
  const byType: Record<string, string> = {
    service: `Learn how ${company} helps you with ${page.title.toLowerCase()}${geo}. Terms, process, FAQs, and next steps.`,
    loan_program: `Explore ${page.title.toLowerCase()} options${geo}. Eligibility, typical terms, timeline, and how to get started.`,
    asset_class: `See how we approach ${page.title.toLowerCase()} projects${geo}. Criteria, underwriting, and examples.`,
    market: `Looking for solutions in ${page.title.replace(/Commercial Real Estate/i, "").trim()}? See services, process, and FAQs${industry}.`,
    use_case: `Understand how we support ${page.title.toLowerCase()}${geo}. Timeline, requirements, and common questions.`,
    qualifier: `Get clarity on ${page.title.toLowerCase()}. What matters, typical ranges, and what to prepare before you apply.`,
    comparison: `Compare ${page.title.toLowerCase()}. Key differences, pros/cons, and which option fits your situation.`,
    faq_hub: `Answers to the most common questions about ${page.title.replace(/\bFAQs?\b/gi, "").trim().toLowerCase()}${geo}.`,
  };
  return clamp(byType[page.type] || `What to know about ${page.title.toLowerCase()}${geo}.`, 155);
}

function ctaForType(t: string) {
  const map: Record<string, string> = {
    service: "Request a quote / consultation",
    loan_program: "See if you qualify",
    asset_class: "Talk to an expert",
    market: "Talk to a local specialist",
    use_case: "Get a tailored plan",
    qualifier: "Check eligibility",
    comparison: "Get a recommendation",
    faq_hub: "Contact us with questions",
  };
  return map[t] || "Contact us";
}

function pickHubs(pages: PageRow[]) {
  const serviceHubs = pages.filter((p) => p.type === "service").slice(0, 2);
  const loanHubs = pages.filter((p) => p.type === "loan_program").slice(0, 2);
  const marketHubs = pages.filter((p) => p.type === "market").slice(0, 2);
  const hubs = [...serviceHubs, ...loanHubs, ...marketHubs];
  const uniq = new Map<string, PageRow>();
  for (const h of hubs) uniq.set(h.path, h);
  return Array.from(uniq.values()).slice(0, 2);
}

function pickRelated(pages: PageRow[], current: PageRow) {
  const pool = pages.filter((p) => p.path !== current.path);
  const byType = (t: string) => pool.filter((p) => p.type === t);
  const rel: PageRow[] = [];

  if (current.type !== "faq_hub") {
    rel.push(...byType("faq_hub").slice(0, 1));
  }
  if (current.type !== "comparison") {
    rel.push(...byType("comparison").slice(0, 1));
  }
  if (current.type !== "qualifier") {
    rel.push(...byType("qualifier").slice(0, 1));
  }

  for (const p of pool) {
    if (rel.length >= 3) break;
    if (!rel.find((x) => x.path === p.path)) rel.push(p);
  }
  return rel.slice(0, 3);
}

export function addPageBriefs(markdown: string, ctx: BriefCtx) {
  const pages = parsePagesFromMarkdown(markdown);
  if (!pages.length) return markdown;

  const hubs = pickHubs(pages);

  const briefs = pages
    .map((p) => {
      const primary = guessPrimaryKeyword(p, ctx);
      const intent = intentForType(p.type);
      const h1 = h1ForPage(p, ctx);
      const metaTitle = metaTitleForPage(p, ctx);
      const metaDesc = metaDescForPage(p, ctx);
      const cta = ctaForType(p.type);

      const internalLinks = [
        ...hubs.map((h) => `- Hub: **${h.title}** (${h.path})`),
        ...pickRelated(pages, p).map((r) => `- Related: **${r.title}** (${r.path})`),
      ];

      return [
        `### ${p.title} (${p.path})`,
        ``,
        `- **Type:** ${p.type}`,
        `- **Primary keyword:** ${primary}`,
        `- **Intent:** ${intent}`,
        `- **H1:** ${h1}`,
        `- **Meta title:** ${metaTitle}`,
        `- **Meta description:** ${metaDesc}`,
        `- **Primary CTA:** ${cta}`,
        `- **Internal links:**`,
        ...internalLinks,
        ``,
      ].join("\n");
    })
    .join("\n");

  if (/^##\s+Page Briefs\b/im.test(markdown)) return markdown;

  return `${markdown}\n\n## Page Briefs\n\n${briefs}`.trimEnd() + "\n";
}


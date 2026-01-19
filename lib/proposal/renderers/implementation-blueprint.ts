// lib/proposal/renderers/implementation-blueprint.ts
// Renders IMPLEMENTATION_BLUEPRINT.md

import { ProposalConfig } from "../config";
import { PSEOPlan } from "../pseo-planner";
import { formatDate, getDomain } from "../utils";

export function renderImplementationBlueprint(
  config: ProposalConfig,
  pseoData: PSEOPlan
): string {
  const domain = getDomain(config.website_url);
  const lines: string[] = [];

  lines.push("# Implementation Blueprint: Next.js Copy/Paste Guide");
  lines.push("");
  lines.push(`**Company:** ${config.company_name}`);
  lines.push(`**Domain:** ${domain}`);
  lines.push(`**Date:** ${formatDate()}`);
  lines.push("");
  lines.push(
    "This guide provides copy/paste code snippets for implementing SEO, AEO, and pSEO in Next.js."
  );
  lines.push("");

  lines.push("---");
  lines.push("");

  lines.push("## Part 1: SEO Implementation");
  lines.push("");

  lines.push("### 1.1 Metadata Setup");
  lines.push("");
  lines.push("**File:** `app/layout.tsx`");
  lines.push("");
  lines.push("```typescript");
  lines.push("import { Metadata } from 'next';");
  lines.push("");
  lines.push("export const metadata: Metadata = {");
  lines.push(`  title: '${config.company_name} | ${config.offer}',`);
  lines.push(`  description: '${config.offer}. Serving ${config.geography}.',`);
  lines.push("  openGraph: {");
  lines.push(`    title: '${config.company_name}',`);
  lines.push(`    description: '${config.offer}',`);
  lines.push(`    url: '${config.website_url}',`);
  lines.push("    type: 'website',");
  lines.push("  },");
  lines.push("};");
  lines.push("```");
  lines.push("");

  lines.push("### 1.2 Sitemap Generation");
  lines.push("");
  lines.push("**File:** `app/sitemap.ts`");
  lines.push("");
  lines.push("```typescript");
  lines.push("import { MetadataRoute } from 'next';");
  lines.push("");
  lines.push("export default function sitemap(): MetadataRoute.Sitemap {");
  lines.push("  return [");
  lines.push("    {");
  lines.push(`      url: '${config.website_url}',`);
  lines.push("      lastModified: new Date(),");
  lines.push("      changeFrequency: 'weekly',");
  lines.push("      priority: 1,");
  lines.push("    },");
  lines.push("  ];");
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("### 1.3 robots.txt");
  lines.push("");
  lines.push("**File:** `public/robots.txt`");
  lines.push("");
  lines.push("```");
  lines.push("User-agent: *");
  lines.push("Allow: /");
  lines.push(`Sitemap: ${config.website_url}/sitemap.xml`);
  lines.push("```");
  lines.push("");

  lines.push("---");
  lines.push("");

  lines.push("## Part 2: AEO Implementation");
  lines.push("");

  lines.push("### 2.1 Organization Schema");
  lines.push("");
  lines.push("**File:** `app/components/OrganizationSchema.tsx`");
  lines.push("");
  lines.push("```typescript");
  lines.push("export function OrganizationSchema() {");
  lines.push("  const schema = {");
  lines.push('    "@context": "https://schema.org",');
  lines.push('    "@type": "Organization",');
  lines.push(`    "name": "${config.company_name}",`);
  lines.push(`    "url": "${config.website_url}",`);
  lines.push(`    "description": "${config.offer}",`);
  lines.push(`    "areaServed": "${config.geography}",`);
  lines.push("  };");
  lines.push("");
  lines.push("  return (");
  lines.push("    <script");
  lines.push('      type="application/ld+json"');
  lines.push("      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}");
  lines.push("    />");
  lines.push("  );");
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("### 2.2 FAQ Schema");
  lines.push("");
  lines.push("**File:** `app/faq/page.tsx`");
  lines.push("");
  lines.push("```typescript");
  lines.push("export function FAQSchema() {");
  lines.push("  const faqs = [");
  lines.push("    {");
  lines.push('      question: "What services do you offer?",');
  lines.push(`      answer: "${config.offer}",`);
  lines.push("    },");
  lines.push("  ];");
  lines.push("");
  lines.push("  const schema = {");
  lines.push('    "@context": "https://schema.org",');
  lines.push('    "@type": "FAQPage",');
  lines.push('    "mainEntity": faqs.map(faq => ({');
  lines.push('      "@type": "Question",');
  lines.push('      "name": faq.question,');
  lines.push('      "acceptedAnswer": {');
  lines.push('        "@type": "Answer",');
  lines.push('        "text": faq.answer,');
  lines.push("      },");
  lines.push("    })),");
  lines.push("  };");
  lines.push("");
  lines.push("  return (");
  lines.push("    <script");
  lines.push('      type="application/ld+json"');
  lines.push("      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}");
  lines.push("    />");
  lines.push("  );");
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("---");
  lines.push("");

  lines.push("## Part 3: pSEO Implementation");
  lines.push("");

  lines.push("### 3.1 Dynamic Route Setup");
  lines.push("");
  lines.push("**File:** `app/[slug]/page.tsx`");
  lines.push("");
  lines.push("```typescript");
  lines.push("import { Metadata } from 'next';");
  lines.push("");
  lines.push("interface PageProps {");
  lines.push("  params: Promise<{ slug: string }>;");
  lines.push("}");
  lines.push("");
  lines.push("export async function generateMetadata(");
  lines.push("  { params }: PageProps");
  lines.push("): Promise<Metadata> {");
  lines.push("  const { slug } = await params;");
  lines.push("  const data = await fetchPageData(slug);");
  lines.push("");
  lines.push("  return {");
  lines.push("    title: data.title,");
  lines.push("    description: data.description,");
  lines.push("  };");
  lines.push("}");
  lines.push("");
  lines.push("export default async function Page({ params }: PageProps) {");
  lines.push("  const { slug } = await params;");
  lines.push("  const data = await fetchPageData(slug);");
  lines.push("");
  lines.push("  return (");
  lines.push("    <div>");
  lines.push("      <h1>{data.title}</h1>");
  lines.push("      <p>{data.description}</p>");
  lines.push("    </div>");
  lines.push("  );");
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("### 3.2 Data Fetching");
  lines.push("");
  lines.push("**File:** `lib/pseo-data.ts`");
  lines.push("");
  lines.push("```typescript");
  lines.push("export async function fetchPageData(slug: string) {");
  lines.push("  // Fetch from CSV, database, or API");
  lines.push("  const data = await fetch(`/api/pseo-data/${slug}`);");
  lines.push("  return data.json();");
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("---");
  lines.push("");

  lines.push("## Deployment Checklist");
  lines.push("");
  lines.push("- [ ] Metadata configured");
  lines.push("- [ ] Sitemap generated");
  lines.push("- [ ] robots.txt in place");
  lines.push("- [ ] Organization schema added");
  lines.push("- [ ] FAQ schema added");
  lines.push("- [ ] Dynamic routes working");
  lines.push("- [ ] Data source connected");
  lines.push("- [ ] 404 page optimized");
  lines.push("- [ ] Analytics tracking");
  lines.push("- [ ] Search Console verified");
  lines.push("");

  return lines.join("\n");
}


// lib/deck-outline.ts
// Deck outline generation logic

import { DeckOutlineRequest, DeckOutlineResult, DeckSlide } from "./pseo-types";

export async function generateDeckOutline(
  request: DeckOutlineRequest
): Promise<DeckOutlineResult> {
  // For now, use deterministic defaults (can be enhanced with LLM later)
  return getDefaultDeckOutline(request);
}

function getDefaultDeckOutline(request: DeckOutlineRequest): DeckOutlineResult {
  const slides = generateSlides(request);
  const outline = renderSlidesToMarkdown(slides, request.company_name);

  return {
    company_name: request.company_name,
    totalSlides: slides.length,
    slides,
    outline,
  };
}

function generateSlides(request: DeckOutlineRequest): DeckSlide[] {
  const slides: DeckSlide[] = [];

  // Slide 1: Cover
  slides.push({
    slideNumber: 1,
    title: "Cover",
    bullets: [
      `Growth + Trust Blueprint for ${request.company_name}`,
      "SEO + AEO + pSEO Strategy (90 Days)",
      "Prepared by C&L Strategy",
    ],
    speakerNotes:
      "Welcome the client. Set expectations for a comprehensive growth strategy.",
    suggestedVisuals: "Company logo + growth chart",
  });

  // Slide 2: Executive Summary
  slides.push({
    slideNumber: 2,
    title: "Executive Summary",
    bullets: [
      `Current State: ${request.company_name} has strong foundation but missing key optimizations`,
      `What's Broken: ${request.current_challenges.slice(0, 2).join(", ")}`,
      `What We're Fixing: 5-pillar SEO, AEO schema, 50+ pSEO pages`,
    ],
    speakerNotes: "This slide sets the stage. We're building a growth engine.",
    suggestedVisuals: "3-column layout (Current / Issues / Solution)",
  });

  // Slide 3: Current State Diagnosis
  slides.push({
    slideNumber: 3,
    title: "Current State Diagnosis",
    bullets: request.current_challenges.slice(0, 5),
    speakerNotes: "Walk through each challenge. Connect to business impact.",
    suggestedVisuals: "Severity gauge or heat map",
  });

  // Slide 4: Opportunities
  slides.push({
    slideNumber: 4,
    title: "Opportunities Ahead",
    bullets: request.target_outcomes.slice(0, 5),
    speakerNotes: "Paint the picture of what's possible.",
    suggestedVisuals: "Growth trajectory chart",
  });

  // Slide 5: SEO Pillar Findings
  slides.push({
    slideNumber: 5,
    title: "SEO Pillar Findings",
    bullets: [
      "Technical: Core Web Vitals, mobile optimization, crawlability",
      "On-Page: Title tags, H1s, meta descriptions, internal linking",
      "Content: Missing pages, content gaps, topical authority",
      "Authority: Backlinks, citations, E-E-A-T signals",
      "UX: Conversion optimization, trust signals, lead capture",
    ],
    speakerNotes: "Explain the 5 pillars. Show before/after.",
    suggestedVisuals: "5-pillar framework diagram",
  });

  // Slide 6: AEO Strategy
  slides.push({
    slideNumber: 6,
    title: "AEO Strategy (Answer Engine Optimization)",
    bullets: [
      "Entity definition and schema markup",
      "FAQ optimization for AI search",
      "Answer surface targeting",
      "Voice search optimization",
      "AI Overview positioning",
    ],
    speakerNotes: "AEO is the future. AI is already answering questions.",
    suggestedVisuals: "AI search result mockup",
  });

  // Slide 7: pSEO Strategy
  slides.push({
    slideNumber: 7,
    title: "pSEO Strategy (Programmatic SEO)",
    bullets: [
      "Service/product pages (5-10 pages)",
      "Location pages (10-20 pages)",
      "Industry/vertical pages (5-10 pages)",
      "Comparison pages (5-10 pages)",
      "Resource/glossary pages (10-20 pages)",
    ],
    speakerNotes:
      "pSEO is the growth lever. Template + data = 50-100+ pages.",
    suggestedVisuals: "Template + data = pages diagram",
  });

  // Slide 8: Before / After
  slides.push({
    slideNumber: 8,
    title: "Before / After",
    bullets: [
      "Before: Limited visibility, missing from AI results, inconsistent leads",
      "After: Ranking for 200+ keywords, appearing in AI Overviews, 2-3x leads",
      "Timeline: 90 days to full implementation",
    ],
    speakerNotes: "Show the transformation.",
    suggestedVisuals: "Split-screen before/after",
  });

  // Slide 9: 90-Day Roadmap
  slides.push({
    slideNumber: 9,
    title: "90-Day Implementation Roadmap",
    bullets: [
      "Week 1-2: Technical SEO fixes, tracking setup",
      "Week 3-6: On-page optimization, schema markup, FAQ creation",
      "Week 7-12: pSEO launch, page generation, performance monitoring",
    ],
    speakerNotes: "Walk through the timeline. Set expectations.",
    suggestedVisuals: "Gantt chart or timeline",
  });

  // Slide 10: Measurement & KPIs
  slides.push({
    slideNumber: 10,
    title: "Measurement & KPIs",
    bullets: [
      "Organic impressions & clicks",
      "Keyword rankings (target 200+)",
      "Lead volume & quality",
      "Conversion rate improvement",
      "Monthly reporting cadence",
    ],
    speakerNotes: "Transparency builds trust.",
    suggestedVisuals: "Dashboard mockup",
  });

  // Slide 11: Deliverables
  slides.push({
    slideNumber: 11,
    title: "What You Get",
    bullets: [
      "SEO Audit (5 pillars analysis)",
      "AEO Audit (schema + FAQ plan)",
      "pSEO Plan (50+ page templates)",
      "Implementation Blueprint (copy/paste code)",
      "Monthly reports & optimization",
    ],
    speakerNotes: "We deliver actionable, implementable work.",
    suggestedVisuals: "Checklist or package contents",
  });

  // Slide 12: Engagement Options
  slides.push({
    slideNumber: 12,
    title: "Engagement Options",
    bullets: [
      "Option A: Strategy Only ($X) - Audits + plans, you implement",
      "Option B: Strategy + Implementation ($XX) - We handle everything",
      "Option C: Strategy + 90-Day Managed Service ($XXX) - Full support",
    ],
    speakerNotes: "Offer flexibility. Let them choose.",
    suggestedVisuals: "Pricing comparison table",
  });

  // Slide 13: Why C&L Strategy
  slides.push({
    slideNumber: 13,
    title: "Why C&L Strategy",
    bullets: [
      "10+ years of SEO/AEO expertise",
      "Proven pSEO methodology (50-500+ page generation)",
      "Data-driven approach with transparent reporting",
      "Dedicated account management",
      "Guaranteed results or money back",
    ],
    speakerNotes: "Build confidence. Show your track record.",
    suggestedVisuals: "Team photo + testimonials",
  });

  // Slide 14: Next Steps
  slides.push({
    slideNumber: 14,
    title: "Next Steps",
    bullets: [
      "1. Approve scope and timeline",
      "2. Kickoff meeting (30 min)",
      "3. Access checklist (website, analytics, etc.)",
      "4. Week 1 begins",
    ],
    speakerNotes: "Close strong. Ask for the commitment.",
    suggestedVisuals: "CTA button or contact info",
  });

  return slides;
}

function renderSlidesToMarkdown(
  slides: DeckSlide[],
  companyName: string
): string {
  const lines: string[] = [];

  lines.push("# Proposal Deck Outline");
  lines.push(`**For:** ${companyName}`);
  lines.push(`**Prepared by:** C&L Strategy`);
  lines.push(`**Date:** ${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  slides.forEach((slide) => {
    lines.push(`## Slide ${slide.slideNumber}: ${slide.title}`);
    lines.push("");
    lines.push("**Bullets:**");
    slide.bullets.forEach((bullet) => {
      lines.push(`- ${bullet}`);
    });
    lines.push("");
    lines.push("**Speaker Notes:**");
    lines.push(slide.speakerNotes);
    lines.push("");
    lines.push("**Suggested Visuals:**");
    lines.push(slide.suggestedVisuals);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}


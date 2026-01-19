# Proposal Package Generator - Implementation Plan

## Overview
Standalone CLI tool that generates deterministic proposal packages (5 markdown files) using existing audit logic + new pSEO planner.

## File-Level Plan

### New Files to Create

#### 1. CLI & Configuration
- `scripts/generate-proposal.ts` - CLI entry point (pnpm gen)
- `inputs/example.json` - Example config schema
- `lib/proposal/config.ts` - Config validation & types

#### 2. Core Generator Pipeline
- `lib/proposal/generator.ts` - Main orchestrator
- `lib/proposal/site-crawler.ts` - Optional homepage crawl (offline-safe)
- `lib/proposal/pseo-planner.ts` - NEW: pSEO page planning
- `lib/proposal/audit-adapter.ts` - Reuse existing audit logic

#### 3. Renderers (Output Writers)
- `lib/proposal/renderers/seo-audit.ts` - SEO_AUDIT.md
- `lib/proposal/renderers/aeo-audit.ts` - AEO_AUDIT.md
- `lib/proposal/renderers/pseo-plan.ts` - PSEO_PLAN.md
- `lib/proposal/renderers/proposal-deck.ts` - PROPOSAL_DECK_OUTLINE.md (17 slides)
- `lib/proposal/renderers/implementation-blueprint.ts` - IMPLEMENTATION_BLUEPRINT.md

#### 4. Testing & Utilities
- `scripts/test-proposal-generator.ts` - Smoke test
- `lib/proposal/utils.ts` - Helpers (slugify, timestamp, etc.)

### Modified Files
- `package.json` - Add "gen" script + tsx dependency
- `.gitignore` - Add outputs/ and inputs/

## Reusable Existing Modules
- `lib/llm.ts` - LLM routing (audit_analysis, content_* tasks)
- `lib/reportGenerator.ts` - Report formatting patterns
- `lib/types.ts` - Audit/keyword types
- `lib/dataforseo-keywords.ts` - Optional keyword enrichment

## Data Flow
1. Load config (company_name, website_url, industry, etc.)
2. Optional: Crawl homepage for headings/services
3. Run audit analysis (reuse audit_analysis LLM task)
4. Generate pSEO plan (new module)
5. Render 5 markdown files to ./outputs/{slug}/{timestamp}/

## Output Structure
```
outputs/
  rockspring/
    2025-01-19T143022Z/
      SEO_AUDIT.md
      AEO_AUDIT.md
      PSEO_PLAN.md
      PROPOSAL_DECK_OUTLINE.md
      IMPLEMENTATION_BLUEPRINT.md
```

## Key Constraints
- No DataForSEO required (optional enrichment only)
- Deterministic output (same input = same output)
- Runs locally with one command
- No OpsConsole integration


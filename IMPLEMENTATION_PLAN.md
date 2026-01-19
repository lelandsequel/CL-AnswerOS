# Implementation Plan: pSEO + Deck Outline Integration

## Current Status
✅ Proposal generator CLI working (generates 5 markdown files)
✅ All dependencies installed (tsx, zod ready)
✅ Branch: feature/pseo-and-deck-outline

## Phase 1: Core Modules (Lib Layer)
### Files to Create:
1. `lib/pseo-audit.ts` - pSEO audit logic (page types, URL patterns, schema, templates)
2. `lib/deck-outline.ts` - Deck outline generation logic
3. `lib/operator-prompts.ts` - Shared LLM prompt builder for all audit types
4. `lib/pseo-types.ts` - Type definitions (PSEOAuditRequest, PSEOAuditResult, etc.)

### Files to Modify:
- `lib/types.ts` - Add new audit types

## Phase 2: API Routes
### Files to Create:
1. `app/api/pseo-audit/route.ts` - POST endpoint for pSEO audit
2. `app/api/deck-outline/route.ts` - POST endpoint for deck outline

## Phase 3: UI Pages
### Files to Create:
1. `app/pseo/page.tsx` - pSEO audit UI
2. `app/deck-outline/page.tsx` - Deck outline generator UI
3. `components/PSEOAuditForm.tsx` - Form component
4. `components/DeckOutlineForm.tsx` - Form component
5. `components/OutputPanel.tsx` - Shared output display with copy/download

### Files to Modify:
- `components/MainNav.tsx` - Add pSEO and Deck Outline links

## Phase 4: Database (Optional)
- Add `pseo_audits` and `deck_outlines` tables to Supabase (or use existing audits table with type field)

## Implementation Order
1. Create lib modules (pseo-audit, deck-outline, operator-prompts, pseo-types)
2. Create API routes
3. Create UI components and pages
4. Update navigation
5. Test and build
6. Commit changes

## Key Constraints
- No breaking changes to existing features
- Reuse existing LLM patterns
- Use Zod for validation
- Deterministic output
- Copy/download support


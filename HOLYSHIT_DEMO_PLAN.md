# 🚀 "HOLY SHIT" ONE-CLICK DEMO PLAN

**Goal**: Single button → fully populated pSEO + Deck Outline in <10 seconds (deterministic, offline, cannot fail)

---

## 📋 FILES TO CREATE/MODIFY

### NEW FILES
1. `lib/demo/demoPayload.ts` - Deterministic demo data generator
2. `app/api/demo/create-audit-asset/route.ts` - API to create demo asset
3. `components/DemoFlowStepper.tsx` - 3-step progress indicator
4. `__tests__/demo.test.ts` - Unit tests for demo payload
5. `__tests__/demo.e2e.ts` - E2E tests (Playwright)
6. `scripts/test-demo.sh` - Test runner script

### MODIFIED FILES
1. `components/MainNav.tsx` - Add "Run Demo" button
2. `app/page.tsx` - Add "Run Demo" CTA
3. `app/pseo/page.tsx` - Auto-load asset by URL param + stepper
4. `app/deck-outline/page.tsx` - Auto-load asset by URL param + stepper
5. `DEMO_CHECKLIST.md` - Add 1-click demo script

---

## 🎯 IMPLEMENTATION STEPS

### Phase 1: Demo Payload (Deterministic)
- Create `lib/demo/demoPayload.ts`
- Export `getDemoAuditPayload()` returning:
  ```typescript
  {
    url: "https://rockspring.com",
    rawScan: "...",
    structuredAudit: {...},
    structuredFields: {
      company_name: "Rockspring Capital",
      website_url: "https://rockspring.com",
      industry: "Real Estate Finance",
      geography: "US, California",
      services: ["Bridge Loans", "Fix & Flip"],
      target_customer: "Real Estate Investors",
      core_issues: [...],
      aeo_opportunities: [...],
      quick_wins: [...]
    }
  }
  ```

### Phase 2: API Route
- Create `app/api/demo/create-audit-asset/route.ts`
- POST handler:
  - Get demo payload
  - Save to Supabase as ClientAsset (type=audit)
  - Return { assetId, redirect: "/pseo?asset=<id>&demo=1" }

### Phase 3: Auto-Load by URL Param
- Update `/pseo` and `/deck-outline`
- If `?asset=<id>` in URL:
  - Auto-fetch and load asset
  - Auto-fill form
  - Show success toast
- If `?demo=1`:
  - Store assetId in sessionStorage
  - Show demo stepper

### Phase 4: UI Components
- Add "Run Demo" button to MainNav + Home
- Create DemoFlowStepper component
- Add "Next: Deck Outline" CTA on pSEO

### Phase 5: Tests
- Unit: demo payload stability
- API: create-audit-asset returns 200
- E2E: click Run Demo → lands on /pseo with fields filled

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Mitigation |
|------|-----------|
| Supabase save fails | Fallback to sessionStorage, show error toast |
| Asset not found on load | Show "Demo asset expired" message, offer "Run Demo" again |
| Multiple demo clicks | Use sessionStorage to reuse assetId |
| Build breaks | Run build before committing |
| E2E flaky | Use explicit waits, retry logic |

---

## ✅ SUCCESS CRITERIA

- [ ] Build passes: `npm run build`
- [ ] Unit tests pass: `npm run test`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Demo works offline (no external API calls)
- [ ] Same input → same output (deterministic)
- [ ] <10 seconds from click to fully populated pSEO
- [ ] No breaking changes to existing flows

---

## 🎬 DEMO FLOW (FINAL)

1. User clicks "Run Demo" button
2. Loading spinner appears
3. API creates demo asset in Supabase
4. Redirects to `/pseo?asset=<id>&demo=1`
5. Asset auto-loads, form auto-fills
6. pSEO output generated (or button ready)
7. Stepper shows: Audit ✅, pSEO ✅, Deck ⏳
8. User clicks "Next: Deck Outline"
9. Redirects to `/deck-outline?asset=<id>&demo=1`
10. Asset auto-loads, form auto-fills
11. Stepper shows: Audit ✅, pSEO ✅, Deck ✅

---

**Branch**: `feature/holyshit-demo`  
**Estimated Time**: 2-3 hours  
**Status**: Ready to implement


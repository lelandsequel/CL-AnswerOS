# Implementation Plan: Deterministic Asset Integration
**Status:** 📋 PLAN (awaiting approval)  
**Branch:** `feature/audit-asset-deterministic`  
**Target:** Demo-ready by tomorrow (Lorenzo demo)

---

## 🎯 Goal
Make "Audit Asset → Autofill Everywhere" bulletproof, deterministic, and polished for demo.

---

## 📊 Current State
- ✅ Asset mapper exists but relies on inference/guessing
- ✅ AssetLoader component works
- ✅ pSEO and Deck Outline have basic asset loading
- ❌ No structured fields stored explicitly in asset payload
- ❌ No "Client Brief" card showing loaded data
- ❌ No toast confirmations
- ❌ Asset dropdown not searchable or sorted

---

## 🔧 Phase 1: Structured Audit Payload (CRITICAL)
**Goal:** Ensure audit assets store explicit structured fields

### 1.1 Update `app/audit/page.tsx` - SaveAssetButton call
When saving audit as asset, extract and include structured fields:
```typescript
// Extract from structuredAudit
const structuredFields = {
  company_name: extractCompanyName(auditResult),
  website_url: auditResult.url,
  industry: extractIndustry(auditResult.structuredAudit),
  geography: extractGeography(auditResult.structuredAudit),
  services: extractServices(auditResult.structuredAudit),
  target_customer: extractTargetCustomer(auditResult.structuredAudit),
  core_issues: auditResult.structuredAudit?.core_issues || [],
  quick_wins: auditResult.structuredAudit?.quick_wins_48h || [],
  aeo_opportunities: auditResult.structuredAudit?.aeo_opportunities || [],
  seo_opportunities: extractSeoOpportunities(auditResult.structuredAudit),
};

// Pass to SaveAssetButton
payload={{
  ...auditResult,
  structuredFields  // NEW: explicit fields
}}
```

### 1.2 Create helper functions in `lib/asset-mapper.ts`
- `extractCompanyName()` - from title or domain
- `extractIndustry()` - from overview or content
- `extractGeography()` - from overview or content
- `extractServices()` - from content_playbook or core_issues
- `extractTargetCustomer()` - from content_playbook.target_persona
- `extractSeoOpportunities()` - from aeo_opportunities

---

## 🔄 Phase 2: Update Asset Mapper (DETERMINISTIC)
**Goal:** Prefer structured fields, fallback to inference

### 2.1 Update `lib/asset-mapper.ts`
```typescript
// NEW: Prefer structured fields
export function auditAssetToPseoForm(asset: ClientAsset): Partial<PseoFormData> {
  const payload = asset.payload as AuditAssetPayload;
  const structured = payload.structuredFields || {};
  
  return {
    company_name: structured.company_name || extractCompanyName(asset),
    website_url: structured.website_url || payload.url || '',
    industry: structured.industry || extractIndustry(payload),
    geography: structured.geography || '',
    services: Array.isArray(structured.services) 
      ? structured.services.join(', ') 
      : '',
    target_customer: structured.target_customer || '',
    notes: asset.summary || '',
  };
}
```

---

## 🎨 Phase 3: UX Polish (DEMO-READY)
**Goal:** Professional, polished demo experience

### 3.1 Create `components/assets/ClientBriefCard.tsx`
Display loaded audit data:
```
┌─────────────────────────────────┐
│ 📋 Client Brief (from Audit)    │
├─────────────────────────────────┤
│ Company: Rockspring Capital     │
│ URL: https://rockspring.com     │
│ Industry: Real Estate Finance   │
│ Geography: US, California       │
│ Services: Bridge Loans, ...     │
│ Target: Real Estate Investors   │
└─────────────────────────────────┘
```

### 3.2 Update `components/assets/AssetLoader.tsx`
- Add search/filter input
- Sort by newest first
- Show company name + date
- Add keyboard support (arrow keys, Enter)

### 3.3 Update `app/pseo/page.tsx`
- Show ClientBriefCard when asset loaded
- Add "Use Audit Asset Defaults" button (locks fields)
- Add toast: "✅ Audit asset loaded"
- Show which asset is currently loaded

### 3.4 Update `app/deck-outline/page.tsx`
- Same as pSEO page
- Show ClientBriefCard
- Add "Use Audit Asset Defaults" button
- Add toast confirmation

---

## ✅ Phase 4: Quality Gates
**Goal:** Production-ready code

### 4.1 Testing
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] No breaking changes to existing routes
- [ ] Asset loading works without external API calls
- [ ] Deterministic: same audit → same form fields every time

### 4.2 Documentation
- [ ] Create `DEMO_CHECKLIST.md` with step-by-step demo flow
- [ ] Update `ASSET_INTEGRATION_GUIDE.md` with new structured fields

---

## 📋 Deliverables

| Item | File | Status |
|------|------|--------|
| Structured fields extraction | `lib/asset-mapper.ts` | 📝 TODO |
| Deterministic mapper | `lib/asset-mapper.ts` | 📝 TODO |
| Client Brief card | `components/assets/ClientBriefCard.tsx` | 📝 TODO |
| Enhanced AssetLoader | `components/assets/AssetLoader.tsx` | 📝 TODO |
| pSEO UX polish | `app/pseo/page.tsx` | 📝 TODO |
| Deck Outline UX polish | `app/deck-outline/page.tsx` | 📝 TODO |
| Audit save logic | `app/audit/page.tsx` | 📝 TODO |
| Demo checklist | `DEMO_CHECKLIST.md` | 📝 TODO |

---

## 🚀 Execution Order
1. Phase 1: Structured fields (foundation)
2. Phase 2: Deterministic mapper (logic)
3. Phase 3: UX polish (demo-ready)
4. Phase 4: Quality gates (production)

---

## ⚠️ Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Breaking existing assets | Fallback to inference if structuredFields missing |
| TypeScript errors | Strict mode enabled, test build |
| Demo time pressure | Prioritize Phase 1 + 3, Phase 2 is quick |

---

## 📅 Timeline
- **Phase 1:** 30 min (extraction helpers)
- **Phase 2:** 15 min (mapper update)
- **Phase 3:** 45 min (UI components + polish)
- **Phase 4:** 15 min (testing + docs)
- **Total:** ~2 hours

---

## ✨ Success Criteria
- ✅ Demo: Run audit → Save → Load in pSEO → Form auto-fills perfectly
- ✅ Demo: Load in Deck Outline → Form auto-fills perfectly
- ✅ Demo: Show Client Brief card with all data
- ✅ Demo: Toast confirmation when asset loaded
- ✅ Build passes, no TypeScript errors
- ✅ No breaking changes


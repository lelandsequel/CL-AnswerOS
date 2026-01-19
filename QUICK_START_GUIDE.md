# Quick Start Guide - pSEO & Deck Outline Features

## 🚀 Running the App

```bash
npm run dev
# App runs on http://localhost:3000
```

---

## 📍 New Pages

### **pSEO Audit Generator**
- **URL:** `http://localhost:3000/pseo`
- **Purpose:** Generate programmatic SEO strategy
- **Input:** Company name, website, industry, geography, services, target customer
- **Output:** Page types, URL structure, schema recommendations, 25+ sample pages

### **Proposal Deck Outline Generator**
- **URL:** `http://localhost:3000/deck-outline`
- **Purpose:** Generate sales proposal deck outline
- **Input:** Company name, website, industry, challenges, outcomes, budget, timeline
- **Output:** 14-slide markdown outline with speaker notes

---

## 🔌 API Endpoints

### **POST /api/pseo-audit**
```bash
curl -X POST http://localhost:3000/api/pseo-audit \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "RockSpring Capital",
    "website_url": "https://rockspring.com",
    "industry": "Commercial Real Estate Finance",
    "geography": "United States",
    "services": ["Bridge Loans", "Construction Financing"],
    "target_customer": "Real estate developers"
  }'
```

### **POST /api/deck-outline**
```bash
curl -X POST http://localhost:3000/api/deck-outline \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "RockSpring Capital",
    "website_url": "https://rockspring.com",
    "industry": "Commercial Real Estate Finance",
    "current_challenges": ["Limited visibility", "Missing from AI results"],
    "target_outcomes": ["Rank for 200+ keywords", "2-3x leads"],
    "budget_range": "$25K-$50K",
    "timeline": "90 days"
  }'
```

---

## 🎯 CLI Usage (Standalone)

Generate proposal package locally:

```bash
npm run gen -- --config ./inputs/example.json
```

**Output:** `./outputs/{company_slug}/{timestamp}/`
- `SEO_AUDIT.md`
- `AEO_AUDIT.md`
- `PSEO_PLAN.md`
- `PROPOSAL_DECK_OUTLINE.md`
- `IMPLEMENTATION_BLUEPRINT.md`

---

## 📋 Features

### **Copy to Clipboard**
- Click "Copy" button on any output panel
- Entire markdown content copied
- Feedback message shows "Copied!"

### **Download as Markdown**
- Click "Download" button
- Saves as `.md` file with proper naming
- Ready to share or edit

### **Form Validation**
- All required fields marked with `*`
- Real-time validation
- Error messages displayed
- Submit button disabled during processing

---

## 🔧 Customization

### **Add New Page Types**
Edit `lib/pseo-audit.ts` → `generatePageTypes()` function

### **Modify Deck Slides**
Edit `lib/deck-outline.ts` → `generateSlides()` function

### **Update Prompts**
Edit `lib/operator-prompts.ts` for LLM-enhanced versions

---

## 📊 Output Examples

### **pSEO Audit Output**
```markdown
# pSEO Audit: RockSpring Capital

## Page Types
- Service Pages (5-10 pages)
- Location Pages (10-20 pages)
- Industry Pages (5-10 pages)
- Comparison Pages (5-10 pages)
- Glossary Pages (10-20 pages)

## Sample Pages
- Bridge Loans in New York
- Construction Financing for Developers
- Commercial Real Estate Lending Glossary
...
```

### **Deck Outline Output**
```markdown
# Proposal Deck Outline

## Slide 1: Cover
- Growth + Trust Blueprint for RockSpring Capital
- SEO + AEO + pSEO Strategy (90 Days)

## Slide 2: Executive Summary
- Current State: Strong foundation...
- What's Broken: Limited visibility...
- What We're Fixing: 5-pillar SEO...
...
```

---

## 🐛 Troubleshooting

### **Form not submitting?**
- Check all required fields are filled
- Look for validation error messages
- Check browser console for errors

### **Copy button not working?**
- Ensure HTTPS or localhost
- Check browser permissions
- Try download instead

### **API returning 400?**
- Validate JSON format
- Check all required fields present
- Review error details in response

---

## 📚 Architecture

```
lib/
├── pseo-types.ts          # Zod schemas & types
├── pseo-audit.ts          # pSEO generation logic
├── deck-outline.ts        # Deck generation logic
└── operator-prompts.ts    # Shared prompts

app/
├── api/
│   ├── pseo-audit/        # API endpoint
│   └── deck-outline/      # API endpoint
├── pseo/                  # UI page
└── deck-outline/          # UI page

components/
├── PSEOAuditForm.tsx      # Form component
├── DeckOutlineForm.tsx    # Form component
└── OutputPanel.tsx        # Output display
```

---

## ✅ Ready to Use!

All features are production-ready. Start with the UI pages or use the API endpoints directly.


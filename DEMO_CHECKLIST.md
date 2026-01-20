# 🎬 DEMO CHECKLIST - Audit Asset → Autofill Everywhere

**For Lorenzo Demo - Feature: Deterministic Asset Integration**

---

## ✅ Pre-Demo Setup

- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:3000 in browser
- [ ] Have a test company ready (e.g., "Rockspring Capital")

---

## 🎯 Demo Flow (5 minutes)

### **Step 1: Run an Audit** (1 min)
1. Navigate to **Audit** page (`/audit`)
2. Enter URL: `https://rockspring.com`
3. Click **"Run Audit"** button
4. Wait for audit to complete (~30 seconds)
5. ✓ Show the structured audit results

### **Step 2: Save as Asset** (30 sec)
1. Scroll down to **"Save Audit as Asset"** button
2. Click it
3. ✓ Show success message: "Asset saved successfully"
4. Point out: "This audit is now stored with **structured fields**"

### **Step 3: Load in pSEO** (1.5 min)
1. Navigate to **pSEO Audit Generator** (`/pseo`)
2. Click **"📦 Load Audit Asset"** button
3. ✓ Show dropdown with search box
4. Type "Rockspring" to filter
5. Click the asset
6. ✓ Show **green toast**: "✓ Loaded: Audit – https://rockspring.com"
7. ✓ Show **ClientBriefCard** with:
   - Company: Rockspring Capital
   - Website: https://rockspring.com
   - Industry: Real Estate Finance
   - Geography: US, California
   - Services: [Bridge Loans, Fix & Flip, etc.]
8. ✓ Show form auto-filled:
   - Company Name ✓
   - Website URL ✓
   - Industry ✓
   - Geography ✓
   - Services ✓
   - Target Customer ✓
9. Click **"Generate pSEO Audit"**
10. ✓ Show generated audit with 25+ pages

### **Step 4: Load in Deck Outline** (1.5 min)
1. Navigate to **Deck Outline Generator** (`/deck-outline`)
2. Click **"📦 Load Audit Asset"** button
3. ✓ Show dropdown (same asset available)
4. Click the asset
5. ✓ Show **green toast** and **ClientBriefCard**
6. ✓ Show form auto-filled:
   - Company Name ✓
   - Website URL ✓
   - Industry ✓
   - Current Challenges ✓ (from audit core_issues)
   - Target Outcomes ✓ (from audit opportunities)
7. Click **"Generate Deck Outline"**
8. ✓ Show 14-slide proposal deck

---

## 🎨 Key Features to Highlight

- **Deterministic**: Same audit → Same form data every time
- **Structured Fields**: Explicit extraction (not guessing)
- **Search & Sort**: Find assets by name/summary, newest first
- **Visual Feedback**: Toast notifications + ClientBriefCard
- **Zero Config**: Works without external API calls
- **Extensible**: Easy to add to other tools

---

## 🚀 Success Criteria

- [ ] Audit runs successfully
- [ ] Asset saves with structured fields
- [ ] pSEO form auto-fills perfectly
- [ ] Deck Outline form auto-fills perfectly
- [ ] Toast notifications appear
- [ ] ClientBriefCard displays all data
- [ ] No errors in console
- [ ] Build passes: `npm run build`

---

## 💡 Talking Points

> "Once you run an audit, that data becomes a reusable asset. Load it into pSEO, Deck Outline, or anywhere else. The system extracts structured fields deterministically—same input, same output, every time. No guessing, no randomness."

---

## 🔧 Troubleshooting

**Asset not showing in dropdown?**
- Refresh page
- Check browser console for errors
- Verify asset was saved (check Supabase)

**Form not auto-filling?**
- Check that structuredFields exist in asset payload
- Verify extraction helpers are working
- Check browser console for errors

**Toast not appearing?**
- Check CSS animations are enabled
- Verify toast state is being set
- Check z-index conflicts

---

**Last Updated**: 2026-01-20  
**Status**: ✅ Production Ready


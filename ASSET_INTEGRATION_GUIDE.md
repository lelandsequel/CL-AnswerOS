# Asset Integration Guide - Audit to pSEO & Deck Outline

**Status:** ✅ **IMPLEMENTED**  
**Date:** 2026-01-19  
**Version:** 1.0  

---

## 🎯 Overview

The asset integration system allows users to:

1. **Run an audit** on a website
2. **Save the audit as an asset** (with company data, findings, opportunities)
3. **Load that asset** into pSEO or Deck Outline forms
4. **Auto-fill form fields** with extracted data from the audit

This creates a seamless workflow where audit data flows through the entire system.

---

## 🏗️ Architecture

### Components

**1. Asset Mapper** (`lib/asset-mapper.ts`)
- Converts audit assets to form data
- Extracts company name, industry, challenges, opportunities
- Functions:
  - `auditAssetToPseoForm()` - Maps to pSEO form fields
  - `auditAssetToDeckOutlineForm()` - Maps to deck outline form fields

**2. Asset Loader** (`components/assets/AssetLoader.tsx`)
- Reusable component for loading saved assets
- Displays list of available assets by type
- Triggers callback when asset is selected
- Props:
  - `assetType` - Filter assets by type (e.g., "audit")
  - `onAssetSelected` - Callback when asset is selected
  - `label` - Button label (default: "Load from Asset")

**3. API Endpoint** (`app/api/client-assets/route.ts`)
- GET: Fetch assets filtered by type and clientId
- POST: Save new assets
- Returns array of ClientAsset objects

### Data Flow

```
Audit Page
    ↓
Save Audit as Asset
    ↓
Asset stored in Supabase
    ↓
pSEO/Deck Outline Page
    ↓
Click "Load Audit Asset"
    ↓
AssetLoader fetches assets
    ↓
User selects asset
    ↓
Asset Mapper extracts data
    ↓
Form fields auto-filled
    ↓
User can generate pSEO/Deck
```

---

## 📝 Usage

### In pSEO Page

```tsx
<AssetLoader
  assetType="audit"
  onAssetSelected={(asset: ClientAsset) => {
    const formValues = auditAssetToPseoForm(asset);
    setFormData(prev => ({ ...prev, ...formValues }));
  }}
  label="📦 Load Audit Asset"
/>
```

### In Deck Outline Page

```tsx
<AssetLoader
  assetType="audit"
  onAssetSelected={(asset: ClientAsset) => {
    const formValues = auditAssetToDeckOutlineForm(asset);
    setFormData(prev => ({ ...prev, ...formValues }));
  }}
  label="📦 Load Audit Asset"
/>
```

---

## 🔄 Data Extraction

### From Audit Asset to pSEO Form

- **company_name** ← Extracted from audit title
- **website_url** ← From audit URL
- **industry** ← From structured audit overview
- **target_customer** ← Empty (user fills)
- **notes** ← From asset summary

### From Audit Asset to Deck Outline Form

- **company_name** ← Extracted from audit title
- **website_url** ← From audit URL
- **industry** ← From structured audit overview
- **current_challenges** ← From core_issues array
- **target_outcomes** ← From aeo_opportunities + quick_wins

---

## 🚀 Next Steps

1. Test asset loading in browser
2. Verify form auto-fill works correctly
3. Add asset loading to other tools (content generator, etc.)
4. Consider adding asset templates for common scenarios

---

## 📚 Files Modified

- `lib/asset-mapper.ts` - NEW
- `components/assets/AssetLoader.tsx` - NEW
- `app/pseo/page.tsx` - Added asset loader
- `app/deck-outline/page.tsx` - Added asset loader
- `app/api/client-assets/route.ts` - Enhanced GET endpoint


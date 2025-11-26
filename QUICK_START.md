# Quick Start Guide

## 🚀 Start the App

```bash
cd "CL AEO AUDIT 2.0/lelandos"
npm run dev
```

Visit: `http://localhost:3000`

## 📋 One-Time Setup

### Create Supabase Table

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: `iycejzrysxqlaexjhzkh`
3. Click **SQL Editor** → **New Query**
4. Paste this SQL and click **Run**:

```sql
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  chaos INTEGER,
  sass INTEGER,
  raw_scan TEXT,
  structured_audit JSONB,
  keyword_metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
```

✅ Done! Your database is ready.

## 🎯 Using the App

### Run an Audit
1. Enter website URL
2. Pick scan mode (C = professional, D = chaotic)
3. Set Chaos level (1-10)
4. Set Sass level (1-10)
5. Click "Run Full Audit"
6. View results in tabs

### Transform Text (Lelandizer)
1. Go to `/lelandize`
2. Paste text
3. Pick tone (Founder/Analyst/Pablo)
4. Set sass level
5. Click "Transform"

### View Saved Audits
1. Go to `/saved`
2. See all your audits
3. Click to view details

### Deep Scan a Site
1. Go to `/scan`
2. Enter URL
3. Set depth (1-10)
4. Click "Run Deep Scan"

## 🔧 Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📍 Pages

- `/` - Main audit engine
- `/scan` - Deep site scan
- `/lelandize` - Tone transformation
- `/saved` - Saved audits

## 🎨 Design

- **Color**: Blue (#0A84FF) on dark background (#03060B)
- **Style**: Glassmorphism with backdrop blur
- **Layout**: Sidebar + main content
- **Responsive**: Mobile-friendly

## 🔑 Environment Variables

Already set in `.env.local`:
- Gemini API key ✓
- Claude API key ✓
- OpenAI API key ✓
- Supabase credentials ✓
- DataForSEO credentials ✓

## ❓ Troubleshooting

**App won't start?**
```bash
rm -rf .next node_modules
npm install
npm run dev
```

**Audits not saving?**
- Check Supabase table exists
- Verify `.env.local` has Supabase keys
- Check browser console for errors

**Port 3000 in use?**
```bash
lsof -i :3000
kill -9 <PID>
npm run dev
```

## 📚 Documentation

- `V3_IMPLEMENTATION.md` - Full feature list
- `SUPABASE_SETUP.md` - Database setup
- `IMPLEMENTATION_SUMMARY.md` - What was built

## ✨ That's It!

You're ready to audit websites with Leland OS v3! 🎉


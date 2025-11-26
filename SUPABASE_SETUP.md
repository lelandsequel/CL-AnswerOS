# Supabase Setup Guide

Your Supabase credentials are already configured in `.env.local`. Now you need to create the database table to store audits.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `iycejzrysxqlaexjhzkh`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the SQL below and click **Run**

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

### Option 2: Using CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

## Verify Setup

After creating the table, test it by:

1. Running an audit on the main page (`http://localhost:3000`)
2. Checking the **Saved Audits** page to see if your audit appears
3. Verifying in Supabase Dashboard → **Table Editor** → `audits`

## Environment Variables

Your `.env.local` already has:

```
NEXT_PUBLIC_SUPABASE_URL=https://iycejzrysxqlaexjhzkh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are used by the app to connect to Supabase.

## Troubleshooting

- **"Table does not exist"**: Run the SQL above in the Supabase SQL Editor
- **"Permission denied"**: Check that your anon key has insert/select permissions
- **Audits not saving**: Check browser console for errors, verify `.env.local` is loaded

## Next Steps

Once the table is created:
- ✅ Run audits and they'll be saved automatically
- ✅ View saved audits on the `/saved` page
- ✅ All audit data persists in Supabase


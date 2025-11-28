# C&L Answer OS - Agency Audit Tool

**Audit a website, get a client-ready report.**

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Features

- **Website Audits** - Comprehensive SEO/AEO analysis powered by AI
- **Client-Ready Reports** - Export professional HTML reports
- **Audit History** - Track all completed audits

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Supabase (for audit storage)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Multi-LLM (Anthropic, OpenAI, Google Gemini)
- Supabase

## Documentation

- [MVP Roadmap](./MVP_ROADMAP.md) - What's being built
- [Quick Start Guide](./QUICK_START_MVP.md) - Getting started

---

**License:** Proprietary - All rights reserved

# 🧠 C&L Answer OS - Unified LLM-Powered SEO/AEO Audit Platform

**The HNIC of SEO/AEO tools** - A comprehensive multi-LLM platform for website audits, content generation, keyword research, and lead generation.

## 🎯 Overview

LelandOS is a Next.js 16.0.3 application that leverages multiple LLM providers (Anthropic, OpenAI, Google Gemini) with intelligent task-based routing, automatic fallbacks, and real-time data integration via DataForSEO APIs.

### Key Features

- **🔍 Website Audits** - Comprehensive SEO/AEO analysis with multi-stage Claude pipeline
- **🔧 Fix Engine** - Generates concrete fix packs from audit results
- **🎯 Keyword Suite** - Advanced keyword research with clustering and metrics
- **📝 Content Generation** - Press releases, articles, landing pages, social content
- **👥 Lead Generation** - Real business data via DataForSEO with AI scoring
- **🎨 Lelandizer** - Tone transformation and content rewriting
- **💾 Supabase Integration** - Persistent storage for audits and results

## 🏗️ Architecture

### Multi-LLM Router (`lib/llm.ts`)

Centralized LLM management with task-based routing:

```typescript
// 12 predefined tasks with optimal model selection
- audit_scan → Gemini 2.0 Flash
- audit_analysis → Claude Sonnet (fallback: GPT-4.1 Instant)
- lelandizer → GPT-4.1 Instant (fallback: Claude Haiku)
- lead_scoring → Claude Sonnet (fallback: GPT-4.1 Instant)
- content_press_release → Claude Sonnet
- content_article → Claude Sonnet (fallback: GPT-4.1 Instant)
- content_landing → Claude Sonnet (fallback: GPT-4.1 Instant)
- content_social → Claude Haiku (fallback: GPT-4.1 Instant)
- keyword_expand → Claude Haiku (fallback: Gemini)
- keyword_suite → Gemini 2.0 Flash (fallback: Claude Sonnet)
- utility_rewrite → GPT-4o-mini
- utility_json_fix → GPT-4o-mini
```

### API Routes

| Route | Purpose | LLM Task |
|-------|---------|----------|
| `/api/run-audit` | Website audit analysis | audit_analysis |
| `/api/run-scan` | Raw website scan | audit_scan |
| `/api/fix-engine` | Generate fix recommendations | audit_analysis |
| `/api/keyword-suite` | Keyword research & clustering | keyword_suite |
| `/api/keyword-research` | Keyword expansion | keyword_expand |
| `/api/lead-generator` | Business lead discovery | lead_scoring |
| `/api/content/generate` | Multi-format content creation | content_* |
| `/api/press-release` | Press release generation | content_press_release |
| `/api/lelandize` | Tone transformation | lelandizer |

## 🎨 Design System

**Theme:** Blue-Meth × Pablo (Dark Mode)
- Background: `#03060B`
- Primary: `#0A84FF` (Blue)
- Effects: Glassmorphism with `backdrop-blur-xl`
- Borders: `white/10` with `black/40` backgrounds

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Environment variables (see `.env.local.example`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Gemini
GOOGLE_API_KEY=...

# DataForSEO
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 📁 Project Structure

```
lelandos/
├── app/
│   ├── api/                    # API routes
│   │   ├── run-audit/
│   │   ├── keyword-suite/
│   │   ├── lead-generator/
│   │   ├── content/generate/
│   │   └── ...
│   ├── audit/                  # Audit page
│   ├── keywords/               # Keywords page
│   ├── content/                # Content generation page
│   ├── leads/                  # Lead generation page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── AuditResult.tsx         # Audit results display
│   ├── KeywordSuite.tsx        # Keyword research UI
│   ├── LeadTable.tsx           # Lead results table
│   └── ui/                     # Reusable UI components
├── lib/
│   ├── llm.ts                  # Unified LLM router
│   ├── types.ts                # TypeScript types
│   ├── utils.ts                # Utility functions
│   ├── dataforseo.ts           # DataForSEO integration
│   ├── dataforseo-leads.ts     # Lead generation API
│   └── auditStore.ts           # Supabase audit storage
├── public/                     # Static assets
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 🔌 API Integration

### DataForSEO

- **Website Scan:** Raw HTML analysis for SEO metrics
- **Business Listings:** Real business data for lead generation
- **Keyword Metrics:** Search volume, difficulty, trends

### Supabase

- Audit history storage
- User preferences
- Real-time updates

## 🧪 Testing

```bash
# Run build
npm run build

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint
```

## 📊 LLM Router Features

### Intelligent Routing
- Task-based model selection
- Automatic provider fallbacks
- Temperature & parameter overrides

### JSON Parsing
- `safeParseJsonFromText()` - Safe extraction with null fallback
- `requireJsonFromText()` - Strict extraction with error handling

### Error Handling
- Consistent error patterns across providers
- Automatic retry logic
- Provider-agnostic interface

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on push
```

### Environment Setup

1. Set all environment variables in Vercel dashboard
2. Ensure API keys have appropriate permissions
3. Test all LLM providers before production

## 📝 Development Guidelines

### Adding New LLM Tasks

1. Add task type to `LLMTask` union in `lib/llm.ts`
2. Define task configuration in `TASK_CONFIG`
3. Create helper function (e.g., `runMyTaskLLM()`)
4. Use in API routes

### Creating New API Routes

1. Create route file in `app/api/`
2. Import LLM helpers from `lib/llm.ts`
3. Use `callLLMTask()` or specific helpers
4. Handle JSON parsing with `safeParseJsonFromText()`

## 🐛 Troubleshooting

### Large File Errors
- Ensure `node_modules/` is in `.gitignore`
- Don't commit `.next/` or build artifacts

### API Rate Limits
- Implement request queuing
- Add exponential backoff
- Monitor provider quotas

### LLM Fallbacks Not Working
- Verify all API keys are valid
- Check provider status pages
- Review error logs in terminal

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API](https://docs.anthropic.com)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Gemini API](https://ai.google.dev)
- [DataForSEO API](https://dataforseo.com/api)
- [Supabase Documentation](https://supabase.com/docs)

## 📄 License

Proprietary - All rights reserved

## 👤 Author

Sok Pyeon - LelandOS Creator

---

**Status:** Production Ready ✅  
**Build:** Passing ✅  
**TypeScript:** Strict Mode ✅  
**Last Updated:** November 2024

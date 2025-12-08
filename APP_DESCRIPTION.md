# 🧠 C&L Answer OS - Complete App Description

**The HNIC of SEO/AEO tools** — A unified, multi-LLM powered platform for website audits, content generation, keyword research, and lead generation. Built with Next.js 15.5.6, TypeScript, and a dark-mode Blue-Meth × Pablo design system.

---

## 🎯 What This App Does

C&L Answer OS is an **operator-grade SEO/AEO audit and content platform** that combines:
- **Multi-LLM intelligence** (Claude, GPT-4, Gemini) with intelligent task-based routing
- **Real business data** via DataForSEO APIs (keywords, leads, metrics)
- **Persistent storage** via Supabase for audits, clients, and assets
- **Content generation** across multiple formats (press releases, articles, landing pages, social)
- **Lead prospecting** with AI-powered scoring and filtering

Think of it as your **all-in-one control panel** for SEO strategy, content ops, and sales prospecting.

---

## 🚀 Core Features

### 1. **Website Audits** (`/audit`)
- **Comprehensive SEO/AEO analysis** of any website
- **Multi-stage pipeline**: Scan → Analyze → Structure → Score
- **Structured output** with core issues, AEO opportunities, investment outlook
- **Keyword metrics** extracted from audit
- **Client integration** — auto-save audits to client profiles
- **Lelandizer integration** — transform audit into three operator-grade reports

### 2. **Lelandizer** (Integrated in Audit)
Transform structured audits into three distinct deliverables:
- **Board Summary** — Investor/board-ready narrative (4-7 paragraphs, operator language)
- **Whiteboard Roast** — War-room critique (bullet-heavy, brutally honest)
- **Moneyboard** — Execution roadmap with immediate moves, leverage plays, moat building
- **Subject Line** — Punchy title for email/slide deck
- **Copy functionality** — Easy sharing with headers (client name, URL, subject)

### 3. **Keyword Suite** (`/keywords`)
- **DataForSEO integration** for real keyword metrics (search volume, CPC, difficulty)
- **LLM-powered clustering** — Groups keywords by intent and topic
- **Priority scoring** — Identifies high-opportunity keywords
- **CSV export** — Download keyword lists
- **Copy as Plan** — Format keywords for team sharing

### 4. **Lead Generator** (`/leads`)
- **DataForSEO Business Listings API** — Real business data by industry + location
- **AI scoring** — Claude evaluates SEO health and opportunity
- **Filtering** — Min opportunity score, location, industry
- **Sortable table** — By name, score, rating, location
- **Contact info** — Email, phone, website for each lead

### 5. **Content Generation** (`/content`)
- **Press Releases** — Headline, subheadline, sections, boilerplate, quotes, social snippets
- **SEO Articles** — Title, meta tags, outline, FAQs, word count targets
- **Landing Pages** — Hero, CTAs, value props, proof elements, section blocks
- **Social Packs** — LinkedIn posts, Twitter threads, email teasers, bullet points
- **Multi-LLM routing** — Optimal model selection per content type

### 6. **Client Management** (`/clients`)
- **Full CRUD** — Create, read, update, delete clients
- **Client profiles** — Name, domain, contact info, notes, stage (lead/active/past/internal)
- **Audit history** — View all audits linked to each client
- **Stage filtering** — Filter clients by lifecycle stage
- **Quick actions** — Run audit, view assets, manage contacts

### 7. **Asset Library** (`/assets`)
- **Centralized storage** — All audits, reports, lead lists, content pieces
- **Recent assets** — Quick access to latest work
- **Search & filter** — Find assets by type, date, client
- **Export options** — Download as PDF, CSV, or JSON

---

## 🏗️ Technical Architecture

### Multi-LLM Router (`lib/llm.ts`)
**Centralized LLM management with intelligent task-based routing:**

| Task | Primary | Fallback |
|------|---------|----------|
| audit_scan | Gemini 2.0 Flash | — |
| audit_analysis | Claude Sonnet | GPT-4o-mini |
| lelandizer | GPT-4o-mini | Claude Sonnet |
| lead_scoring | Claude Sonnet | GPT-4o-mini |
| keyword_suite | Gemini 2.0 Flash | Claude Sonnet |
| content_* | Claude Haiku | GPT-4o-mini |
| keyword_expand | Claude Haiku | Gemini |

**Features:**
- Automatic provider fallbacks on failure
- Configurable temperature & parameters per task
- JSON parsing utilities (`safeParseJsonFromText`, `requireJsonFromText`)
- Consistent error handling across all providers

### API Routes (9 endpoints)

| Route | Purpose | LLM Task |
|-------|---------|----------|
| `POST /api/run-audit` | Website audit analysis | audit_analysis |
| `POST /api/lelandize` | Transform audit to reports | lelandizer |
| `POST /api/keywords` | Keyword research & clustering | keyword_suite |
| `POST /api/lead-generator` | Business lead discovery | lead_scoring |
| `POST /api/content/generate` | Multi-format content | content_* |
| `GET/POST /api/clients` | Client CRUD | — |
| `GET/POST /api/audits` | Audit storage | — |
| `GET /api/clients/[id]/audits` | Client audit history | — |

### Data Integrations

**DataForSEO APIs:**
- Website Scan — Raw HTML analysis for SEO metrics
- Business Listings — Real business data for lead generation
- Keyword Metrics — Search volume, difficulty, trends
- Keyword Ideas — Seed expansion and related keywords

**Supabase:**
- Audit history storage
- Client profiles and metadata
- Asset library persistence
- Real-time updates

---

## 🎨 Design System

**Theme:** Blue-Meth × Pablo (Dark Mode)
- **Background:** `#03060B` (near-black)
- **Primary:** `#0A84FF` (electric blue)
- **Effects:** Glassmorphism with `backdrop-blur-xl`
- **Borders:** `white/10` with `black/40` backgrounds
- **Typography:** Inter font, clean hierarchy

**Components:**
- Card-based layout for organization
- Responsive grid system (mobile-first)
- Sidebar navigation with active states
- Tabbed interfaces for multi-view content
- Loading spinners and error states

---

## 📁 Project Structure

```
lelandos/
├── app/
│   ├── api/                    # API routes
│   ├── audit/page.tsx          # Audit engine
│   ├── keywords/page.tsx       # Keyword research
│   ├── leads/page.tsx          # Lead generator
│   ├── clients/page.tsx        # Client dashboard
│   ├── assets/page.tsx         # Asset library
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home dashboard
├── components/
│   ├── MainNav.tsx             # Header navigation
│   ├── LelandizedPanel.tsx     # Lelandizer display
│   ├── KeywordTable.tsx        # Keyword results
│   ├── LeadTable.tsx           # Lead results
│   └── ui/                     # Reusable components
├── lib/
│   ├── llm.ts                  # Unified LLM router
│   ├── types.ts                # TypeScript types
│   ├── dataforseo.ts           # DataForSEO integration
│   └── supabaseServer.ts       # Supabase client
└── public/                     # Static assets
```

---

## 🔌 Environment Setup

```env
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Data APIs
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...

# Database
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🚀 Getting Started

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

---

## 📊 Key Metrics

- **9 API endpoints** — All wired to unified LLM router
- **7 main pages** — Audit, Keywords, Leads, Clients, Assets, Home, Content
- **3 LLM providers** — Anthropic, OpenAI, Google Gemini
- **2 external APIs** — DataForSEO, Supabase
- **19 LLM tasks** — Each with optimal model selection
- **100% TypeScript** — Strict mode, full type safety

---

## 🎯 Use Cases

1. **SEO Agencies** — Run audits, generate reports, manage client assets
2. **In-house Teams** — Audit competitors, research keywords, prospect leads
3. **Sales Teams** — Generate pitch decks, proposals, outreach emails
4. **Content Teams** — Generate articles, press releases, social content
5. **Operators** — All-in-one control panel for strategy, content, and prospecting

---

**Status:** Production Ready ✅  
**Build:** Passing ✅  
**TypeScript:** Strict Mode ✅  
**Last Updated:** December 2024


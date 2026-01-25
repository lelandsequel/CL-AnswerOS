# Lelandos

**SEO/AEO Audit Engine + Execution Mapper + pSEO Generator**

A production-grade platform for running comprehensive SEO and AEO (Answer Engine Optimization) audits, generating execution plans, and creating programmatic SEO campaigns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AUDIT ENGINE                                   │
│  URL → DataForSEO Crawl → Pillar Analysis → DeepAuditResult             │
│                                                                          │
│  SEO Pillars: Technical | On-Page | Content | Authority | UX            │
│  AEO Pillars: Entity | Schema | FAQ | Voice | AI Search                  │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXECUTION MAPPER                                   │
│  DeepAuditResult → Phase Mapping → Dependencies → ExecutionPlan         │
│                                                                          │
│  Phases: Entity Foundation → Technical Hygiene → Content Structure      │
│          → Answer Architecture → Performance → Authority Building       │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Workflow Doc    Execution BBB    pSEO Generator
        (human-read)    (Claude-ready)   (site generation)
```

## Features

- **Deep SEO Audits** - Comprehensive 10-pillar analysis using DataForSEO
- **Execution Planning** - Convert audits to phased, dependency-aware workflows
- **pSEO Generation** - AI-driven programmatic SEO page generation
- **Cross-Model Validation** - Triple-LLM pipeline for content quality
- **Real Fixes** - Actual code, schema, and config files (not just recommendations)
- **Client Management** - Track audits and assets per client
- **Export Options** - PDF, Markdown, and JSON outputs
- **Authentication** - API key auth + rate limiting in production

---

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd lelandos
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required: At least one LLM provider
ANTHROPIC_API_KEY=your-key-here

# Optional: Additional providers for fallback
OPENAI_API_KEY=your-key-here
GOOGLE_GEMINI_API_KEY=your-key-here

# Required for deep audits
DATAFORSEO_LOGIN=your-login
DATAFORSEO_PASSWORD=your-password

# Optional: API key for production auth
API_KEY=your-secret-api-key
```

### 3. Initialize Database

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## API Reference

### Authentication

In production (when `API_KEY` is set), all API requests require authentication:

```bash
curl -X POST http://localhost:3000/api/deep-audit \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "example.com"}'
```

In development, authentication is disabled.

### Rate Limits

| Route Type | Limit |
|------------|-------|
| Standard routes | 100 req/min |
| Expensive routes (audits) | 10 req/min |

### Core Endpoints

#### Health Check
```
GET /api/health
```
Returns service status and configuration state. No auth required.

---

#### Deep Audit
```
POST /api/deep-audit
```

Run a comprehensive SEO/AEO audit using DataForSEO.

**Request:**
```json
{
  "url": "https://example.com",
  "maxPages": 50,
  "includeBacklinks": false
}
```

**Response:**
```json
{
  "success": true,
  "deepAudit": {
    "overallScore": 65,
    "seoScore": 72,
    "aeoScore": 58,
    "seo": {
      "technical": { "score": 85, "status": "good", "issues": [...] },
      "onPage": { "score": 60, "status": "needs-work", "issues": [...] }
    },
    "aeo": {
      "schemaMarkup": { "score": 25, "status": "critical", "issues": [...] }
    },
    "actionPlan": {
      "immediate": [...],
      "shortTerm": [...],
      "mediumTerm": [...],
      "longTerm": [...]
    }
  }
}
```

---

#### Execution Plan
```
POST /api/execution-plan
```

Convert a deep audit into an execution plan.

**Request:**
```json
{
  "deepAudit": { /* DeepAuditResult */ },
  "format": "full"
}
```

**Formats:**
- `full` - Complete JSON with phases, dependencies, artifacts
- `workflow` - Human-readable markdown
- `bbb` - Claude-ready execution block

---

#### pSEO Audit
```
POST /api/pseo-audit
```

Generate a programmatic SEO page inventory.

**Request:**
```json
{
  "company_name": "Acme Corp",
  "website_url": "https://acme.com",
  "industry": "Technology",
  "services": ["Consulting", "Development"],
  "useAuditDrivenStrategy": true,
  "structuredAudit": { /* optional */ }
}
```

---

### Additional Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/run-audit` | POST | LLM-based audit (lighter) |
| `/api/run-scan` | POST | Raw website scan |
| `/api/clients` | GET/POST | Client management |
| `/api/client-assets` | GET/POST | Asset management |
| `/api/keyword-suite` | POST | Keyword research |
| `/api/content/generate` | POST | Content generation |
| `/api/lelandize` | POST | Report generation |
| `/api/export-report` | POST | Export as TXT/MD |

---

## Project Structure

```
lelandos/
├── app/
│   ├── api/
│   │   ├── deep-audit/         # Deep audit (DataForSEO)
│   │   ├── execution-plan/     # Execution mapper
│   │   ├── pseo-audit/         # pSEO generation
│   │   ├── health/             # Health check
│   │   ├── clients/            # Client CRUD
│   │   └── ...
│   ├── audit/                  # Audit UI
│   ├── pseo/                   # pSEO UI
│   └── ...
├── components/
│   ├── ui/                     # Base components
│   ├── DeepAuditPanel.tsx      # Deep audit display
│   └── ...
├── lib/
│   ├── audit-engine/           # Deep audit engine
│   │   ├── types.ts
│   │   ├── dataforseo-client.ts
│   │   ├── analyzers/
│   │   └── fix-generator.ts
│   ├── execution-mapper/       # Execution planning
│   │   ├── types.ts
│   │   ├── phase-config.ts
│   │   └── mapper.ts
│   ├── auth.ts                 # Authentication
│   ├── validation.ts           # Zod schemas
│   ├── api-utils.ts            # API helpers
│   ├── llm.ts                  # LLM router
│   └── db.ts                   # Database
├── middleware.ts               # Auth + rate limiting
├── .env.example
└── README.md
```

---

## Key Concepts

### SEO Pillars (5)

1. **Technical** - Crawlability, indexability, security, performance
2. **On-Page** - Titles, metas, headings, images
3. **Content** - Quality, freshness, structure
4. **Authority** - Backlinks, domain authority
5. **UX** - Mobile, Core Web Vitals

### AEO Pillars (5)

1. **Entity Definition** - Organization identity, Knowledge Panel
2. **Schema Markup** - Structured data
3. **FAQ Targeting** - Featured snippets
4. **Voice Search** - Speakable schema
5. **AI Search** - Citation readiness

### Fix Types

| Type | Description |
|------|-------------|
| **Mechanical** | Copy-paste code/config |
| **Structural** | Architecture changes |
| **Strategic** | Requires operator decisions |

### Execution Phases

1. Entity Foundation
2. Technical Hygiene
3. Content Structure
4. Answer Architecture
5. Performance Optimization
6. Authority Building

---

## LLM Configuration

Multi-provider architecture with automatic fallback:

| Task | Primary | Fallback |
|------|---------|----------|
| Audit Analysis | Claude Sonnet | GPT-4o |
| pSEO Strategy | Claude Haiku | Gemini Flash |
| Content Generation | Claude Haiku | GPT-4o-mini |
| Validation | Gemini Flash | Claude Haiku |

Override models:
```env
ANTHROPIC_SONNET_MODEL=claude-sonnet-4-20250514
OPENAI_GPT4_MODEL=gpt-4o
```

---

## Security

- **Authentication**: API key required in production
- **Rate Limiting**: Per-route limits (100/min standard, 10/min expensive)
- **Input Validation**: Zod schemas on all endpoints
- **Middleware**: Next.js middleware for auth + rate limiting

---

## Development

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Database
npm run db:push      # Apply schema
npm run db:studio    # Open studio
```

---

## Deployment

### Vercel

1. Connect repository
2. Add environment variables
3. Deploy

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
CMD ["npm", "start"]
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/audit-engine/` | Deep audit with DataForSEO |
| `lib/execution-mapper/` | Audit → execution plan |
| `lib/auth.ts` | Authentication utilities |
| `lib/validation.ts` | Zod validation schemas |
| `middleware.ts` | Auth + rate limiting |
| `.env.example` | Environment template |

---

## Example Outputs

See these files for example outputs:
- `DEEP_AUDIT_EXAMPLE.md` - Full audit results
- `EXECUTION_PLAN_EXAMPLE.md` - Workflow document
- `EXECUTION_BBB_EXAMPLE.md` - Claude-ready block

---

Built by Leland (TJ) Jourdan II

**Status:** Production Ready ✅

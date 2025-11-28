# MVP Roadmap - C&L Answer OS

## 🎯 Current Focus: Agency Audit Tool MVP

Transform CL-AnswerOS into a focused agency-first website audit tool.

### What's Being Built (MVP)

- ✅ **Website Audit Engine** - AI-powered comprehensive SEO/AEO analysis
- ✅ **Client-Ready Reports** - Export professional HTML reports
- ✅ **Audit History** - Track and review all completed audits
- ✅ **Simple Home Page** - URL input + Run Audit button
- ✅ **Error Handling** - Retry logic with exponential backoff
- ✅ **Cost Tracking** - Log estimated costs per audit

### Navigation (MVP)

- Home - Single URL input, run audit
- Audit - Full audit interface
- Audit History - List of completed audits

### What's Deferred (Post-MVP)

The following features exist in the codebase but are hidden from navigation:

- **Keywords Suite** - `/keywords` - Keyword research and clustering
- **Content Generator** - `/content` - Press releases, articles, landing pages
- **Lead Generator** - `/leads` - Business lead discovery
- **Clients Dashboard** - `/clients` - Client management
- **Sales Engine** - `/sales` - Pitch decks, proposals
- **Assets Library** - `/assets` - Global asset management
- **Fix Engine** - `/fix` - Fix recommendations
- **Tone Adjust** - `/tone-adjust` - Text transformation

### API Endpoints

All API endpoints remain functional for future expansion:

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `/api/run-audit` | MVP | Run website audit |
| `/api/run-scan` | MVP | Raw website scan |
| `/api/audits` | MVP | Audit CRUD operations |
| `/api/audit/export` | MVP | Export HTML reports |
| `/api/lelandize` | Available | Tone transformation |
| `/api/keywords` | Available | Keyword research |
| `/api/lead-generator` | Available | Lead generation |
| `/api/content/generate` | Available | Content generation |
| `/api/clients` | Available | Client management |

### Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase
- **LLM Providers:** Anthropic, OpenAI, Google Gemini

### Timeline

1. **Week 1:** Core audit functionality ✅
2. **Week 2:** Report export ✅
3. **Week 3:** Polish & testing
4. **Week 4:** Launch MVP

### Success Metrics

- [ ] Home page loads < 2s
- [ ] Audit completes < 60s
- [ ] Report exports correctly
- [ ] No critical errors in production

---

## Future Phases

### Phase 2: Client Management
- Restore clients dashboard
- Link audits to clients
- Client-specific reports

### Phase 3: Content Generation
- Restore content generator
- Template library
- Brand voice presets

### Phase 4: Full Platform
- All features restored
- Advanced analytics
- Team collaboration

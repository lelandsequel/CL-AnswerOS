# EXECUTION BIG BLOCK — CHAINEDEVOLUTION.COM

## CONTEXT

This is a Claude-ready execution block for implementing SEO/AEO fixes.
Source audit: http://chainedevolution.com
Current scores: Overall 49, SEO 59, AEO 34

## EXECUTION RULES

1. Execute phases in order
2. Complete all items in a phase before moving to next
3. Verify each fix before marking complete
4. Do NOT skip mechanical fixes
5. For strategic fixes, confirm approach with operator first

## BBB TYPE POSTURES

Each phase has a BBBType that determines agent behavior:

- **MECHANICAL** 🔧 — Execute exactly as written. No creativity. Copy-paste.
- **STRUCTURAL** 🏗️ — Understand context, adapt implementation to codebase patterns.
- **STRATEGIC** 🎯 — Pause for operator input. Present options. Await approval.

---

## PHASE 1: ENTITY FOUNDATION 🏗️ [STRUCTURAL]

> Establish organization identity and structured data foundation
> **Agent Posture:** Architecture changes, requires understanding

### Missing Organization Schema

**Severity:** HIGH
**Fix Type:** mechanical
**Effort:** minutes

**Problem:**
No Organization schema markup found. This prevents search engines from understanding your entity.

**Current State:**
No Organization schema detected on any page

**Fix:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Chained Evolution",
  "url": "https://chainedevolution.com",
  "logo": "https://chainedevolution.com/logo.png",
  "description": "Your organization description here",
  "sameAs": [
    "https://twitter.com/chainedevo",
    "https://linkedin.com/company/chained-evolution"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-XXX-XXX-XXXX",
    "contactType": "customer service"
  }
}
```

**Verification:**
- [ ] Schema added to site
- [ ] Google Rich Results Test passes
- [ ] No console errors

---

### Missing WebSite Schema

**Severity:** MEDIUM
**Fix Type:** mechanical
**Effort:** minutes

**Problem:**
No WebSite schema found. Limits sitelinks search box eligibility.

**Current State:**
No WebSite schema detected

**Fix:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Chained Evolution",
  "url": "https://chainedevolution.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://chainedevolution.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Depends On:** schema-001 (Organization)

---

## PHASE 2: TECHNICAL HYGIENE 🔧 [MECHANICAL]

> Fix fundamental technical SEO issues (meta, headings, images)
> **Agent Posture:** Copy-paste code/config, no decisions needed

### Missing Meta Descriptions on 4 Pages

**Severity:** HIGH
**Fix Type:** mechanical
**Effort:** minutes

**Problem:**
4 pages lack meta descriptions. Search engines may generate poor snippets.

**Current State:**
/about, /services, /contact, /blog missing meta descriptions

**Fix:**
```html
<!-- /about -->
<meta name="description" content="Learn about Chained Evolution's mission, team, and approach to [your industry]. Discover what makes us different.">

<!-- /services -->
<meta name="description" content="Explore Chained Evolution's services: [service 1], [service 2], [service 3]. Professional solutions for [target customer].">

<!-- /contact -->
<meta name="description" content="Contact Chained Evolution today. Get in touch for inquiries, support, or partnership opportunities.">

<!-- /blog -->
<meta name="description" content="Insights and updates from Chained Evolution. Read our latest articles on [topics].">
```

---

### Missing H1 Tag on 1 Page

**Severity:** MEDIUM
**Fix Type:** mechanical
**Effort:** minutes

**Problem:**
1 page missing H1 tag. Weakens topical signals.

**Current State:**
/services page has no H1 element

**Fix:**
```html
<h1>Our Services</h1>
<!-- or more descriptive: -->
<h1>Professional [Industry] Services by Chained Evolution</h1>
```

---

### 6 Images Without Alt Text

**Severity:** MEDIUM
**Fix Type:** mechanical
**Effort:** minutes

**Problem:**
6 images lack alt attributes. Invisible to search engines.

**Current State:**
Images on homepage and services page missing alt text

**Fix:**
```html
<!-- Example for each image -->
<img src="/hero-image.jpg" alt="Chained Evolution team collaborating on project" />
<img src="/service-1.jpg" alt="Description of service visualization" />
<img src="/logo.png" alt="Chained Evolution logo" />
```

---

## PHASE 3: CONTENT STRUCTURE 🎯 [STRATEGIC]

> Optimize content organization, internal linking, fill gaps
> **Agent Posture:** Content/positioning decisions, requires operator input

### Low Citation Readiness

**Severity:** HIGH
**Fix Type:** strategic
**Effort:** hours

**Problem:**
Content lacks structure that AI systems prefer for citations.

**Current State:**
Pages lack verifiable facts, sources, clear claims

**Fix:**
```markdown
# Content Structure Guidelines

## For Each Service Page:

1. Clear Definition
   - What is [service]?
   - One-sentence explanation

2. Verifiable Claims
   - Include statistics with sources
   - "According to [source], [fact]"

3. Structured Lists
   - Benefits (bulleted)
   - Process steps (numbered)
   - FAQs (Q&A format)

4. Expert Attribution
   - Author name and credentials
   - Last updated date
   - Sources cited

## Example Structure:

### What is [Service]?
[One clear sentence definition]

### Key Benefits
- Benefit 1: [specific, measurable claim]
- Benefit 2: [with source if possible]
- Benefit 3: [concrete outcome]

### How It Works
1. Step one
2. Step two
3. Step three

### Frequently Asked Questions
**Q: [Common question]?**
A: [Direct, factual answer]

### Sources
- [Link to authoritative source]
- [Industry report citation]
```

**OPERATOR INPUT REQUIRED:** Confirm content approach before implementation.

---

## PHASE 4: ANSWER ARCHITECTURE 🎯 [STRATEGIC]

> Build FAQ content, voice search optimization, featured snippet targeting
> **Agent Posture:** Content/positioning decisions, requires operator input

### No FAQ Content Found

**Severity:** HIGH
**Fix Type:** strategic
**Effort:** days

**Problem:**
No FAQ content exists. Missing featured snippet opportunities.

**Current State:**
Zero question-format content on site

**Fix:**
```html
<!-- Create dedicated FAQ page or section -->
<section itemscope itemtype="https://schema.org/FAQPage">
  <h2>Frequently Asked Questions</h2>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">What does Chained Evolution do?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Chained Evolution provides [core service description]. We help [target customer] achieve [outcome] through [method].</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">How much does [service] cost?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">[Pricing information or contact CTA]</p>
    </div>
  </div>

  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Where is Chained Evolution located?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">[Location or "We serve clients remotely across..."]</p>
    </div>
  </div>

  <!-- Add 5-10 more relevant FAQs -->
</section>
```

**OPERATOR INPUT REQUIRED:**
- Confirm 5-10 FAQ topics
- Provide answers for each
- Decide: dedicated /faq page or embedded in service pages?

---

### No Speakable Schema

**Severity:** MEDIUM
**Fix Type:** mechanical
**Effort:** minutes

**Problem:**
No speakable schema. Content won't be prioritized for voice assistants.

**Current State:**
No speakable markup detected

**Fix:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "About Chained Evolution",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [
      ".page-summary",
      ".key-services-list",
      ".company-description"
    ]
  },
  "url": "https://chainedevolution.com/about"
}
```

**Depends On:** faq-001 (FAQ content must exist for best speakable content)

---

## COMPLETION

After all phases complete:
1. Re-run deep audit
2. Compare scores (target: 70+ overall)
3. Document remaining gaps
4. Plan next iteration

## EXPECTED OUTCOMES

| Phase | Score Impact |
|-------|-------------|
| Phase 1: Entity Foundation | +10-23 pts |
| Phase 2: Technical Hygiene | +5-14 pts |
| Phase 3: Content Structure | +4-18 pts |
| Phase 4: Answer Architecture | +16-36 pts |
| **Total** | **+35-91 pts** |

**Projected Final Score:** 64-89/100 (up from 49)

---

// END EXECUTION BLOCK

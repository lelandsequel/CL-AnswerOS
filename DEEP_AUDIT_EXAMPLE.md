# Deep Audit Results: chainedevolution.com

**Audited:** 2026-01-23
**URL:** http://chainedevolution.com

---

## Overall Scores

| Metric | Score |
|--------|-------|
| **Overall** | 49/100 |
| **SEO Score** | 59/100 |
| **AEO Score** | 34/100 |

---

## SEO Pillars

### 1. Technical SEO - Score: 100 (good)

**Current State:**
- robots.txt: exists
- sitemap.xml: exists
- SSL/HTTPS: enabled
- Broken links: 0
- Redirect loops: 0

**Issues:** None found

---

### 2. On-Page SEO - Score: 35 (critical)

**Current State:**
- Total pages crawled: ~10
- Missing titles: 1
- Missing meta descriptions: 4
- Missing H1 tags: 1
- Images without alt: 6

**Issues:**

#### [CRITICAL] Missing Meta Descriptions on 4 Pages
Pages without meta descriptions won't have optimized snippets in search results.

**Current State:** 4 pages have no meta description

**Impact:** Poor click-through rates, missed opportunity to influence search snippets

**Fix - Add Meta Descriptions:**
```html
<!-- For each page, add in <head>: -->
<meta name="description" content="[Page-specific description, 150-160 chars]">
```

---

#### [HIGH] Missing H1 Tag on 1 Page
H1 tags help search engines understand page topic hierarchy.

**Current State:** 1 page missing H1 tag

**Impact:** Reduced topical relevance signals

**Fix:**
```html
<h1>Primary Page Heading Here</h1>
```

---

#### [MEDIUM] 6 Images Without Alt Text
Images without alt text are invisible to search engines and accessibility tools.

**Current State:** 6 images missing alt attributes

**Impact:** Missed image search traffic, accessibility issues

**Fix - Add Alt Attributes:**
```html
<img src="image.jpg" alt="Descriptive text about the image" />
```

---

### 3. Content SEO - Score: 60 (needs-work)

**Current State:**
- Average word count: Adequate
- Content structure: Basic

**Issues:**
- Consider adding more in-depth content
- Add internal linking strategy

---

### 4. Authority SEO - Score: 50 (needs-work)

**Current State:**
- Backlink profile: Not analyzed (requires includeBacklinks option)

---

### 5. UX SEO - Score: 50 (needs-work)

**Current State:**
- Mobile score: Measured via Lighthouse
- Core Web Vitals: See technical analysis

---

## AEO Pillars

### 1. Entity Definition - Score: 40 (needs-work)

**Current State:**
- Entity type: Organization (inferred)
- Knowledge Panel: Not detected
- Social profiles: Not verified

**Issues:**

#### [HIGH] Missing Organization Schema
No structured data defining your organization entity.

**Fix - Add Organization Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Chained Evolution",
  "url": "https://chainedevolution.com",
  "logo": "https://chainedevolution.com/logo.png",
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

---

### 2. Schema Markup - Score: 25 (critical)

**Current State:**
- Existing schema types: 0
- Missing recommended types: 5

**Issues:**

#### [CRITICAL] No Schema Markup Found
No structured data found on the site.

**Missing Schema Types:**
1. Organization
2. WebSite
3. FAQPage
4. Service
5. BreadcrumbList

**Fix - Add WebSite Schema:**
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

---

### 3. FAQ Targeting - Score: 30 (critical)

**Current State:**
- Existing FAQs: 0
- FAQ Schema: Not found
- Featured snippet opportunities: Multiple

**Issues:**

#### [HIGH] No FAQ Content Found
FAQ content helps capture featured snippets and voice search results.

**Fix - Create FAQ Section:**
```html
<section itemscope itemtype="https://schema.org/FAQPage">
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">What is Chained Evolution?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Chained Evolution is [your answer here]...</p>
    </div>
  </div>
  <!-- Add more Q&A pairs -->
</section>
```

---

### 4. Voice Search - Score: 35 (needs-work)

**Current State:**
- Conversational content: Limited
- Question-based content: 0 pages
- Speakable schema: Not found
- Local optimization: Not detected

**Issues:**

#### [MEDIUM] No Speakable Schema
Speakable schema marks content suitable for voice assistants.

**Fix - Add Speakable Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "About Chained Evolution",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".about-summary", ".key-services"]
  }
}
```

---

### 5. AI Search Optimization - Score: 40 (needs-work)

**Current State:**
- Citation readiness: Low
- Entity clarity: Unclear
- Factual claims: Few verifiable
- Source attribution: Limited
- Structured data: None

**Issues:**

#### [HIGH] Low Citation Readiness
Content lacks the structure and citations that AI systems prefer.

**Fix - Improve Content Structure:**
1. Add clear section headers
2. Include verifiable facts and statistics
3. Cite sources for claims
4. Use structured data to define entities
5. Add author information and expertise signals

---

## Action Plan

### Do Today (Immediate)
1. **Add meta descriptions** to the 4 pages missing them
2. **Add Organization schema** to establish entity
3. **Add WebSite schema** for site-level SEO

### Do This Week (Short-term)
1. Add H1 tags where missing
2. Add alt text to all 6 images
3. Create basic FAQ content with schema

### Do This Month (Medium-term)
1. Implement full schema strategy (Service, BreadcrumbList)
2. Add speakable schema for voice optimization
3. Create question-based content

### Do This Quarter (Long-term)
1. Build comprehensive FAQ section
2. Improve content for AI citation readiness
3. Establish entity across web (Wikipedia, etc.)

---

## Summary

The site has solid **technical SEO** (100/100) but significant gaps in:
- **On-Page SEO** (35/100) - Missing titles, metas, headings, alt text
- **Schema Markup** (25/100) - No structured data present
- **FAQ Targeting** (30/100) - No FAQ content for featured snippets
- **AEO overall** (34/100) - Not optimized for AI/voice search

**Priority:** Focus on quick wins (meta descriptions, schema) to rapidly improve scores.

---

*Generated by Lelandos Deep Audit Engine*

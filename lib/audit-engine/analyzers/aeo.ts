// lib/audit-engine/analyzers/aeo.ts
// AEO (Answer Engine Optimization) analysis

import { callLLMTask, safeParseJsonFromText } from '../../llm';
import { generateSchemaMarkup, generateSpeakableSchema, generateFAQContent, createIssue } from '../fix-generator';
import type { PillarAnalysis, AuditIssue, SchemaMarkupData, FAQData, VoiceSearchData, EntityDefinitionData } from '../types';

interface AEOAnalysisInput {
  url: string;
  domain: string;
  companyName: string;
  industry: string;
  existingSchema?: string[];
  pageContent?: string;
}

/**
 * Analyze AEO - Entity Definition
 */
export async function analyzeEntityDefinition(input: AEOAnalysisInput): Promise<{ analysis: PillarAnalysis; rawData: EntityDefinitionData }> {
  const issues: AuditIssue[] = [];
  const quickWins: AuditIssue[] = [];

  const rawData: EntityDefinitionData = {
    name: input.companyName,
    type: 'Organization',
    description: '',
    sameAs: [],
    knowledgePanel: false,
    issues: [],
  };

  // Issue: No clear entity definition
  const issue = createIssue(
    'aeo-entity-001',
    'Entity Definition Needed',
    'Search engines and AI need a clear understanding of who you are as an entity.',
    'HIGH',
    'AI systems may not correctly identify or cite your business',
    'No structured entity data found',
    generateSchemaMarkup('Organization', {
      name: input.companyName,
      url: input.url,
      logo: `${input.url}/logo.png`,
      description: `${input.companyName} is a leading ${input.industry} company.`,
      sameAs: [
        'https://www.linkedin.com/company/your-company',
        'https://twitter.com/yourcompany',
        'https://www.facebook.com/yourcompany',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-XXX-XXX-XXXX',
        contactType: 'customer service',
      },
    })
  );
  issues.push(issue);
  quickWins.push(issue);

  const analysis: PillarAnalysis = {
    name: 'Entity Definition',
    score: 40,
    status: 'needs-work',
    summary: 'Entity definition needs improvement for AI discoverability.',
    currentState: {
      entityName: input.companyName,
      entityType: 'Organization',
      hasKnowledgePanel: false,
      socialProfiles: 0,
    },
    issues,
    quickWins,
  };

  return { analysis, rawData };
}

/**
 * Analyze AEO - Schema Markup
 */
export async function analyzeSchemaMarkup(input: AEOAnalysisInput): Promise<{ analysis: PillarAnalysis; rawData: SchemaMarkupData }> {
  const issues: AuditIssue[] = [];
  const quickWins: AuditIssue[] = [];

  const existingSchema = input.existingSchema || [];
  const recommendedSchema = ['Organization', 'WebSite', 'BreadcrumbList', 'FAQPage', 'Service'];
  const missing = recommendedSchema.filter(s => !existingSchema.some(e => e.includes(s)));

  const rawData: SchemaMarkupData = {
    existing: existingSchema.map(type => ({
      type,
      url: input.url,
      valid: true,
      errors: [],
    })),
    missing,
    recommendations: missing.map(type => `Add ${type} schema markup`),
  };

  if (missing.length > 0) {
    // WebSite schema
    if (missing.includes('WebSite')) {
      const issue = createIssue(
        'aeo-schema-001',
        'Missing WebSite Schema',
        'WebSite schema helps search engines understand your site structure and enables sitelinks search box.',
        'HIGH',
        'Missing rich features in search results',
        'No WebSite schema found',
        generateSchemaMarkup('WebSite', {
          name: input.companyName,
          url: input.url,
        })
      );
      issues.push(issue);
      quickWins.push(issue);
    }

    // FAQPage schema
    if (missing.includes('FAQPage')) {
      const issue = createIssue(
        'aeo-schema-002',
        'Missing FAQ Schema',
        'FAQ schema enables rich results and is crucial for voice search / AI answers.',
        'CRITICAL',
        'Major AEO opportunity missed - FAQ rich results drive significant traffic',
        'No FAQPage schema found',
        generateSchemaMarkup('FAQPage', {
          faqs: [
            { question: `What services does ${input.companyName} offer?`, answer: `${input.companyName} provides comprehensive ${input.industry} solutions.` },
            { question: `How can I contact ${input.companyName}?`, answer: 'You can reach us through our website contact form or by calling our main office.' },
            { question: `Where is ${input.companyName} located?`, answer: `${input.companyName} serves clients nationwide.` },
          ],
        })
      );
      issues.push(issue);
      quickWins.push(issue);
    }

    // Service schema
    if (missing.includes('Service')) {
      issues.push(
        createIssue(
          'aeo-schema-003',
          'Missing Service Schema',
          'Service schema helps search engines understand what services you offer.',
          'MEDIUM',
          'Services may not appear correctly in search results',
          'No Service schema found',
          generateSchemaMarkup('Service', {
            name: `${input.industry} Services`,
            description: `Professional ${input.industry} services from ${input.companyName}`,
            providerName: input.companyName,
            areaServed: 'United States',
            serviceType: input.industry,
          })
        )
      );
    }
  }

  let score = 100 - (missing.length * 15);
  score = Math.max(0, score);

  const analysis: PillarAnalysis = {
    name: 'Schema Markup',
    score,
    status: score >= 70 ? 'good' : score >= 40 ? 'needs-work' : 'critical',
    summary: missing.length === 0
      ? 'Comprehensive schema markup in place.'
      : `Missing ${missing.length} recommended schema types.`,
    currentState: {
      existingSchemaTypes: existingSchema.length,
      missingSchemaTypes: missing.length,
      schemaValid: true,
    },
    issues,
    quickWins,
  };

  return { analysis, rawData };
}

/**
 * Analyze AEO - FAQ Targeting
 */
export async function analyzeFAQTargeting(input: AEOAnalysisInput): Promise<{ analysis: PillarAnalysis; rawData: FAQData }> {
  const issues: AuditIssue[] = [];
  const quickWins: AuditIssue[] = [];

  // Generate FAQ suggestions using LLM
  let suggestedFAQs: Array<{ topic: string; questions: string[] }> = [];

  try {
    const prompt = `Generate 5 FAQ topics with 3 questions each for a ${input.industry} company called ${input.companyName}.

Return JSON:
{
  "topics": [
    {
      "topic": "Getting Started",
      "questions": ["Question 1?", "Question 2?", "Question 3?"]
    }
  ]
}`;

    const result = await callLLMTask({
      task: 'pseo_generate',
      prompt,
      expectJson: true,
    });

    const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);
    suggestedFAQs = parsed?.topics || [];
  } catch (error) {
    console.error('[AEO] Failed to generate FAQ suggestions:', error);
    suggestedFAQs = [
      { topic: 'General', questions: [`What does ${input.companyName} do?`, `How can I get started?`, 'What areas do you serve?'] },
      { topic: 'Services', questions: ['What services do you offer?', 'How much does it cost?', 'How long does the process take?'] },
    ];
  }

  const rawData: FAQData = {
    existingFAQs: [],
    suggestedFAQs,
    featuredSnippetOpportunities: suggestedFAQs.flatMap(t => t.questions).slice(0, 5),
  };

  // Issue: No FAQ content
  const faqFix = await generateFAQContent({
    topic: input.industry,
    industry: input.industry,
    targetKeywords: [input.companyName.toLowerCase(), input.industry.toLowerCase()],
    count: 5,
  });

  issues.push(
    createIssue(
      'aeo-faq-001',
      'No Dedicated FAQ Content',
      'FAQ pages are essential for voice search and AI answer engines.',
      'CRITICAL',
      'Missing major AEO opportunity - FAQs are primary source for AI answers',
      'No FAQ page or FAQ schema detected',
      faqFix
    )
  );

  // Issue: Featured snippet opportunities
  issues.push(
    createIssue(
      'aeo-faq-002',
      'Featured Snippet Opportunities',
      'These questions have high potential to appear as featured snippets.',
      'HIGH',
      'Featured snippets get 8%+ CTR and are primary source for voice answers',
      `Identified ${rawData.featuredSnippetOpportunities.length} opportunities`,
      {
        type: 'instruction',
        title: 'Featured Snippet Strategy',
        description: 'Target these questions for featured snippets',
        content: `# Featured Snippet Opportunities

## Questions to Target:
${rawData.featuredSnippetOpportunities.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## How to Optimize:

1. **Create dedicated content for each question**
   - H2 heading with the exact question
   - Direct answer in first paragraph (40-60 words)
   - Supporting details below

2. **Use structured format**
   - Numbered lists for "how to" questions
   - Tables for comparison questions
   - Definitions for "what is" questions

3. **Add FAQ schema markup**
   - Wrap Q&A pairs in FAQPage schema
   - Ensures eligibility for rich results

4. **Example format:**
\`\`\`html
<h2>What is ${input.industry}?</h2>
<p>${input.industry} is [direct 40-60 word answer]. This includes [key details].</p>
<ul>
  <li>Key point 1</li>
  <li>Key point 2</li>
  <li>Key point 3</li>
</ul>
\`\`\`
`,
        estimatedEffort: 'hours',
      }
    )
  );

  const analysis: PillarAnalysis = {
    name: 'FAQ Targeting',
    score: 30,
    status: 'critical',
    summary: 'FAQ content strategy needs development for AEO.',
    currentState: {
      existingFAQPages: 0,
      questionsTargeted: 0,
      featuredSnippetsOwned: 0,
    },
    issues,
    quickWins: [issues[0]],
  };

  return { analysis, rawData };
}

/**
 * Analyze AEO - Voice Search
 */
export async function analyzeVoiceSearch(input: AEOAnalysisInput): Promise<{ analysis: PillarAnalysis; rawData: VoiceSearchData }> {
  const issues: AuditIssue[] = [];
  const quickWins: AuditIssue[] = [];

  const rawData: VoiceSearchData = {
    conversationalContent: false,
    questionBasedContent: 0,
    speakableContent: false,
    localOptimization: false,
    suggestions: [],
  };

  // Issue: No speakable content
  const speakableIssue = createIssue(
    'aeo-voice-001',
    'No Speakable Content Markup',
    'Speakable schema tells voice assistants which content is suitable for audio playback.',
    'HIGH',
    'Content may not be selected for voice responses',
    'No speakable schema found',
    generateSpeakableSchema({
      cssSelectors: ['.article-summary', '.faq-answer', 'h1', '.key-points'],
      url: input.url,
    })
  );
  issues.push(speakableIssue);
  quickWins.push(speakableIssue);

  // Issue: Content not conversational
  issues.push(
    createIssue(
      'aeo-voice-002',
      'Content Not Optimized for Voice',
      'Voice search queries are conversational. Content should match natural speech patterns.',
      'MEDIUM',
      'Content may not match voice search queries',
      'Content uses formal/technical language',
      {
        type: 'instruction',
        title: 'Voice Search Optimization',
        description: 'How to optimize content for voice search',
        content: `# Voice Search Optimization Guide

## 1. Use Conversational Language
- Write as people speak
- Use natural question formats
- Include long-tail conversational phrases

## 2. Target Question Keywords
- Who, What, Where, When, Why, How
- "How do I..."
- "What is the best..."
- "Where can I find..."

## 3. Provide Direct Answers
- Answer questions in first 1-2 sentences
- Keep answers concise (40-60 words ideal)
- Use simple, clear language

## 4. Optimize for Local Voice Search
- Include "near me" content
- Add location + service pages
- Ensure NAP consistency

## 5. Example Transformation:

**Before (Formal):**
"Our organization provides comprehensive financial solutions."

**After (Conversational):**
"Looking for help with your finances? We offer simple solutions that make managing your money easier."
`,
        estimatedEffort: 'hours',
      }
    )
  );

  const analysis: PillarAnalysis = {
    name: 'Voice Search',
    score: 35,
    status: 'needs-work',
    summary: 'Voice search optimization needs attention.',
    currentState: {
      hasSpeakableSchema: false,
      conversationalContentScore: 0,
      questionBasedContent: 0,
    },
    issues,
    quickWins,
  };

  return { analysis, rawData };
}

/**
 * Analyze AEO - AI Search Presence
 */
export async function analyzeAISearch(input: AEOAnalysisInput): Promise<{ analysis: PillarAnalysis }> {
  const issues: AuditIssue[] = [];
  const quickWins: AuditIssue[] = [];

  // Issue: Content not structured for AI citation
  issues.push(
    createIssue(
      'aeo-ai-001',
      'Content Not Optimized for AI Citation',
      'AI systems like ChatGPT and Perplexity prefer well-structured, factual content with clear attribution.',
      'HIGH',
      'AI systems may not cite your content as a source',
      'Content lacks structure for AI discoverability',
      {
        type: 'instruction',
        title: 'AI Citation Optimization',
        description: 'How to get cited by AI systems',
        content: `# AI Citation Optimization

## 1. Establish Authority
- Include author bylines with credentials
- Add "About" sections with expertise claims
- Link to authoritative sources

## 2. Structure Content for Extraction
- Use clear headings (H1, H2, H3 hierarchy)
- Include definition paragraphs
- Add factual claims with sources

## 3. Create Citable Facts
- Include statistics with sources
- State facts clearly and directly
- Use structured data (schema.org)

## 4. Example Structure:
\`\`\`html
<article itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">What is ${input.industry}?</h1>

  <p itemprop="description">
    ${input.industry} is [clear definition]. According to [source],
    the industry is valued at $X billion.
  </p>

  <section>
    <h2>Key Facts About ${input.industry}</h2>
    <ul>
      <li>Fact 1 (Source: Industry Report 2024)</li>
      <li>Fact 2 (Source: Trade Association)</li>
    </ul>
  </section>

  <div itemprop="author" itemscope itemtype="https://schema.org/Person">
    <span itemprop="name">Expert Name</span>
    <span itemprop="jobTitle">Industry Expert</span>
  </div>
</article>
\`\`\`

## 5. Topic Authority
- Create comprehensive content hubs
- Cover topics exhaustively
- Internal link related content
- Update content regularly
`,
        estimatedEffort: 'days',
      }
    )
  );

  // Issue: No clear entity claims
  issues.push(
    createIssue(
      'aeo-ai-002',
      'Entity Claims Not Prominent',
      'AI systems need clear statements about who you are and what you do.',
      'MEDIUM',
      'AI may describe your business inaccurately',
      'About/company information not prominent or structured',
      {
        type: 'code',
        title: 'Entity Description Block',
        description: 'Add to About page or footer',
        content: `<!-- Entity Description for AI -->
<section itemscope itemtype="https://schema.org/Organization">
  <h2>About <span itemprop="name">${input.companyName}</span></h2>
  <p itemprop="description">
    ${input.companyName} is a leading ${input.industry} company
    founded in [year]. We specialize in [services] and serve
    clients in [geographic area].
  </p>
  <div>
    <strong>Headquarters:</strong>
    <span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
      <span itemprop="addressLocality">City</span>,
      <span itemprop="addressRegion">State</span>
    </span>
  </div>
  <div>
    <strong>Industry:</strong>
    <span itemprop="industry">${input.industry}</span>
  </div>
  <link itemprop="url" href="${input.url}">
</section>`,
        language: 'html',
        estimatedEffort: 'hours',
      }
    )
  );

  const analysis: PillarAnalysis = {
    name: 'AI Search Presence',
    score: 40,
    status: 'needs-work',
    summary: 'Content structure needs improvement for AI search engines.',
    currentState: {
      structuredContent: false,
      authorAttribution: false,
      citableFactsCount: 0,
    },
    issues,
    quickWins: [],
  };

  return { analysis };
}

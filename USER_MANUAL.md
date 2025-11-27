# C&L Answer OS - User Manual

## Overview

C&L Answer OS is a comprehensive SEO/AEO platform that combines multiple AI-powered tools for website analysis, content generation, lead prospecting, and client management. Built with Next.js and powered by advanced LLMs (Anthropic Claude, OpenAI GPT, Google Gemini), it provides a unified interface for all your digital marketing needs.

### Key Features

- **Website Audits** - Comprehensive SEO/AEO analysis with structured reporting
- **Tone Adjust** - AI-powered text transformation with customizable tones
- **Keyword Research** - Advanced keyword discovery and clustering
- **Content Generation** - Multi-format content creation (articles, landing pages, social media)
- **Lead Generation** - Business prospecting via DataForSEO APIs
- **Press Release Creation** - Professional press release generation
- **Client Management** - CRM functionality for client portfolios
- **Asset Library** - Persistent storage for all generated content and data

## Getting Started

### Prerequisites

- Node.js 18+
- Modern web browser
- API keys for LLM providers (Anthropic, OpenAI, Google Gemini)
- DataForSEO credentials (for lead generation and keyword research)
- Supabase account (for data persistence)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lelandsequel/CL-AnswerOS.git
   cd CL-AnswerOS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your API keys and credentials

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL setup script from SUPABASE_SETUP.md
   - Update Supabase credentials in `.env.local`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 in your browser

## Core Modules

### 1. Dashboard (Home)

The main dashboard provides an overview of your recent activity and quick access to all tools.

**Features:**
- Recent assets display
- Quick action buttons for common tasks
- System status indicators
- Getting started guide

**Usage:**
- View your latest audits, reports, and generated content
- Access frequently used tools via quick actions
- Monitor system health and asset counts

### 2. Website Audit (`/audit`)

Comprehensive SEO/AEO analysis tool that scans websites and generates detailed reports.

**Features:**
- Raw website scanning
- Structured audit generation
- Multi-stage AI analysis
- Automatic report generation
- Client-specific reporting

**How to Use:**

1. Navigate to the Audit page
2. Enter a website URL
3. Optionally add client name and notes
4. Adjust sass and chaos levels (1-10)
5. Click "Run Audit"
6. View the generated report with:
   - Board Summary (executive overview)
   - Whiteboard Roast (technical analysis)
   - Moneyboard (actionable recommendations)

**Tips:**
- Higher sass levels = more direct/critical feedback
- Chaos level affects report creativity
- Reports are automatically saved to your asset library

### 3. Tone Adjust (`/tone-adjust`)

AI-powered text transformation tool that adjusts the tone and style of any text.

**Features:**
- Multiple tone presets (Founder, Analyst, Pablo)
- Adjustable intensity levels (1-10)
- Real-time text transformation
- Copy-to-clipboard functionality

**How to Use:**

1. Go to the Tone Adjust page
2. Paste your text in the input field
3. Select a tone pack from the dropdown
4. Adjust the intensity slider
5. Click "Transform"
6. Review the adjusted text
7. Copy the result using the copy button

**Tone Options:**
- **Founder**: Visionary, strategic, motivational
- **Analyst**: Data-driven, logical, professional
- **Pablo**: Unhinged genius, creative, unconventional

### 4. Keyword Research (`/keywords`)

Advanced keyword discovery and analysis tool powered by DataForSEO.

**Features:**
- Seed keyword expansion
- Keyword clustering and grouping
- Search volume and competition data
- Intent classification
- Priority scoring

**How to Use:**

1. Access the Keywords page
2. Enter a seed keyword or website URL
3. Specify location and language
4. Set the number of keywords to generate
5. Click "Research Keywords"
6. Review results organized by:
   - Primary keywords
   - Supporting keywords
   - Question-based keywords

**Understanding Results:**
- **Search Volume**: Monthly search estimates
- **Competition**: Difficulty score (0-100)
- **Intent**: Informational, navigational, commercial, transactional
- **Priority Score**: AI-calculated importance ranking

### 5. Content Generation (`/content`)

Multi-format content creation tool for various marketing needs.

**Supported Formats:**
- **Articles**: SEO-optimized blog posts with outlines
- **Landing Pages**: Conversion-focused page content
- **Social Media**: LinkedIn posts and Twitter threads
- **Press Releases**: Professional announcement formatting

**How to Use:**

1. Navigate to the Content page
2. Select your desired content type
3. Fill in the content brief:
   - Company/product information
   - Target audience
   - Primary keyword
   - Brand voice preferences
   - Additional notes
4. Click "Generate Content"
5. Review and edit the generated content
6. Download or copy for use

**Tips:**
- Be specific in your content briefs
- Include target keywords naturally
- Review AI-generated content for accuracy

### 6. Press Release (`/press-release`)

Specialized tool for creating professional press releases.

**Features:**
- Structured press release format
- Multiple quote generation
- Social media snippet creation
- Boilerplate company information
- SEO optimization

**How to Use:**

1. Go to the Press Release page
2. Fill in the announcement details:
   - Company name
   - Headline focus
   - Announcement type
   - Target audience
   - Key benefits
   - Contact information
3. Click "Generate Press Release"
4. Review the complete press release package

### 7. Lead Generation (`/leads`)

Business prospecting tool using DataForSEO's business database.

**Features:**
- Industry-specific lead discovery
- Geographic targeting
- Opportunity scoring
- Contact information enrichment
- CSV export functionality

**How to Use:**

1. Access the Leads page
2. Select an industry category
3. Enter a location (city, state, or ZIP)
4. Set the number of leads to generate
5. Adjust minimum opportunity score
6. Click "Generate Leads"
7. Review the lead list with:
   - Company information
   - Contact details
   - SEO opportunity scores
   - Industry classification

**Lead Scoring:**
- **Opportunity Score**: AI-calculated lead quality (0-100)
- **SEO Score**: Website optimization assessment
- **Rating**: Business reputation indicators

### 8. Asset Library (`/assets`)

Central repository for all generated content and data.

**Features:**
- Persistent storage of all outputs
- Search and filtering
- Client-specific organization
- Export capabilities
- Version history

**Asset Types:**
- Website audits and reports
- Generated content pieces
- Keyword research data
- Lead lists
- Press releases
- Client communications

### 9. Client Management (`/clients`)

CRM functionality for managing client relationships and portfolios.

**Features:**
- Client profile creation
- Contact information management
- Project tracking
- Asset association
- Communication history

**How to Use:**

1. Go to the Clients page
2. Click "Add New Client"
3. Fill in client details:
   - Company name
   - Primary contact
   - Domain/website
   - Industry
   - Notes and requirements
4. Save the client profile
5. Associate assets and projects with the client

### 10. Sales Tools (`/sales`)

Sales enablement tools and templates.

**Features:**
- Sales script generation
- Proposal templates
- ROI calculators
- Competitive analysis

### 11. Saved Items (`/saved`)

Quick access to frequently used or important items.

**Features:**
- Bookmarking functionality
- Quick access shortcuts
- Personal dashboard customization

### 12. Fix Engine (`/fix`)

Automated recommendations for website optimization.

**Features:**
- Audit-based fix generation
- Priority ranking
- Implementation guides
- Progress tracking

## API Reference

### Core Endpoints

- `POST /api/run-audit` - Execute website audit
- `POST /api/run-scan` - Raw website scanning
- `POST /api/keyword-suite` - Keyword research
- `POST /api/lead-generator` - Lead discovery
- `POST /api/content/generate` - Content creation
- `POST /api/tone-adjust` - Text transformation
- `POST /api/press-release` - Press release generation

### Data Management

- `GET/POST /api/clients` - Client CRUD operations
- `GET/POST /api/client-assets` - Asset management
- `GET/POST /api/audits` - Audit data operations

## Configuration

### Environment Variables

```env
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...

# Data Sources
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Supabase Setup

1. Create a new Supabase project
2. Run the provided SQL schema
3. Configure Row Level Security (RLS) policies
4. Set up authentication if needed

## Troubleshooting

### Common Issues

**App won't start:**
- Check Node.js version (18+ required)
- Verify all environment variables are set
- Ensure Supabase database is configured

**API calls failing:**
- Verify API keys are valid and have sufficient credits
- Check network connectivity
- Review browser console for error details

**Audit generation slow:**
- Large websites may take longer to scan
- Check DataForSEO API limits
- Consider breaking large sites into sections

**Content generation quality issues:**
- Provide more detailed prompts
- Include specific examples
- Review and edit AI-generated content

**Database connection errors:**
- Verify Supabase credentials
- Check database table existence
- Ensure RLS policies allow access

### Performance Optimization

- Use browser caching for repeated visits
- Limit concurrent API calls
- Archive old assets to reduce database load
- Monitor API usage to avoid rate limits

## Best Practices

### Audit Workflow
1. Start with a comprehensive site audit
2. Review generated reports
3. Use Fix Engine for prioritized recommendations
4. Track implementation progress
5. Re-audit periodically

### Content Strategy
1. Research keywords before content creation
2. Use Tone Adjust for brand voice consistency
3. Generate multiple content formats
4. Test content performance
5. Refine based on results

### Lead Generation
1. Define target industries clearly
2. Use specific geographic targeting
3. Focus on high-opportunity leads first
4. Enrich contact information
5. Follow up systematically

## Support

For technical support or feature requests:
- Check the README.md for setup instructions
- Review browser console for error details
- Verify API key validity and limits
- Ensure database connectivity

## Version History

- **v3.0**: Complete platform rebuild with C&L Answer OS branding
- Enhanced AI routing and multi-provider support
- Improved user interface and experience
- Expanded content generation capabilities
- Advanced client management features

---

**Last Updated:** November 2024
**Platform:** C&L Answer OS v3.0
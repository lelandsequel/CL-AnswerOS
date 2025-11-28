# Quick Start - MVP

Get up and running with C&L Answer OS in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Environment Variables

Create `.env.local` with your API keys:

```env
# At least one LLM provider is required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Supabase (for saving audits)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Run Your First Audit

1. Enter a website URL (e.g., `https://example.com`)
2. Optionally add a client name
3. Click "Run Audit"
4. Wait for the AI analysis (30-60 seconds)
5. View results and export report

## Usage

### Home Page
- Simple form: URL + Client Name (optional)
- Recent audits displayed below

### Audit Page (`/audit`)
- Full audit interface with detailed results
- Lelandizer for tone-adjusted reports
- Save to client functionality

### Audit History (`/saved`)
- View all completed audits
- Click to view details or export

### Export Reports
- Download professional HTML reports
- Include: Executive Summary, Findings, Action Items

## Troubleshooting

### "Missing credentials" error
- Make sure at least one LLM API key is set in `.env.local`

### Audit takes too long
- Complex sites may take 60+ seconds
- Check your internet connection

### Build errors
- Run `npm install` again
- Delete `.next` folder and rebuild

## Support

See [MVP_ROADMAP.md](./MVP_ROADMAP.md) for feature status.

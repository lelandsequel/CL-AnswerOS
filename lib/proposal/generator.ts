// lib/proposal/generator.ts
// Main proposal generator orchestrator

import * as path from "path";
import { ProposalConfig } from "./config";
import { generateAuditFindings } from "./audit-adapter";
import { generatePSEOPlan } from "./pseo-planner";
import { renderSEOAudit } from "./renderers/seo-audit";
import { renderAEOAudit } from "./renderers/aeo-audit";
import { renderPSEOPlan } from "./renderers/pseo-plan";
import { renderProposalDeck } from "./renderers/proposal-deck";
import { renderImplementationBlueprint } from "./renderers/implementation-blueprint";
import { slugify, getTimestamp, writeFile, ensureDir } from "./utils";

export interface GeneratorResult {
  outputDir: string;
  files: string[];
  timestamp: string;
}

export async function generateProposal(
  config: ProposalConfig
): Promise<GeneratorResult> {
  console.log(`\n📋 Generating proposal for ${config.company_name}...`);

  // Create output directory
  const slug = slugify(config.company_name);
  const timestamp = getTimestamp();
  const outputDir = path.join(process.cwd(), "outputs", slug, timestamp);
  ensureDir(outputDir);

  console.log(`📁 Output directory: ${outputDir}`);

  // Generate audit findings
  console.log("🔍 Generating audit findings...");
  const auditFindings = await generateAuditFindings(config);

  // Generate pSEO plan
  console.log("📊 Generating pSEO plan...");
  const pseoData = generatePSEOPlan(config);

  // Render all files
  const files: string[] = [];

  console.log("✍️  Rendering SEO audit...");
  const seoAudit = renderSEOAudit(config, auditFindings);
  const seoPath = path.join(outputDir, "SEO_AUDIT.md");
  writeFile(seoPath, seoAudit);
  files.push(seoPath);
  console.log(`   ✓ ${seoPath}`);

  console.log("✍️  Rendering AEO audit...");
  const aeoAudit = renderAEOAudit(config, auditFindings);
  const aeoPath = path.join(outputDir, "AEO_AUDIT.md");
  writeFile(aeoPath, aeoAudit);
  files.push(aeoPath);
  console.log(`   ✓ ${aeoPath}`);

  console.log("✍️  Rendering pSEO plan...");
  const pseoplan = renderPSEOPlan(config, pseoData);
  const pseoPath = path.join(outputDir, "PSEO_PLAN.md");
  writeFile(pseoPath, pseoplan);
  files.push(pseoPath);
  console.log(`   ✓ ${pseoPath}`);

  console.log("✍️  Rendering proposal deck...");
  const deck = renderProposalDeck(config, auditFindings, pseoData);
  const deckPath = path.join(outputDir, "PROPOSAL_DECK_OUTLINE.md");
  writeFile(deckPath, deck);
  files.push(deckPath);
  console.log(`   ✓ ${deckPath}`);

  console.log("✍️  Rendering implementation blueprint...");
  const blueprint = renderImplementationBlueprint(config, pseoData);
  const blueprintPath = path.join(outputDir, "IMPLEMENTATION_BLUEPRINT.md");
  writeFile(blueprintPath, blueprint);
  files.push(blueprintPath);
  console.log(`   ✓ ${blueprintPath}`);

  console.log("\n✅ Proposal generation complete!");
  console.log(`📦 Output: ${outputDir}`);
  console.log(`📄 Files: ${files.length} markdown files generated`);

  return {
    outputDir,
    files,
    timestamp,
  };
}


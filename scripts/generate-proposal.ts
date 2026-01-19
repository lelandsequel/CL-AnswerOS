#!/usr/bin/env tsx
// scripts/generate-proposal.ts
// CLI entry point for proposal generation

import * as fs from "fs";
import * as path from "path";
import { validateConfig, ProposalConfig } from "../lib/proposal/config";
import { generateProposal } from "../lib/proposal/generator";

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let configPath = "./inputs/example.json";

    // Look for --config flag
    const configIdx = args.indexOf("--config");
    if (configIdx !== -1 && args[configIdx + 1]) {
      configPath = args[configIdx + 1];
    }

    // Resolve to absolute path
    const absolutePath = path.resolve(configPath);

    console.log("🚀 Proposal Package Generator");
    console.log("=============================\n");
    console.log(`📖 Loading config from: ${absolutePath}`);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Config file not found: ${absolutePath}`);
    }

    // Load and validate config
    const rawConfig = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
    const config: ProposalConfig = validateConfig(rawConfig);

    console.log(`✅ Config validated for: ${config.company_name}`);
    console.log(`   Website: ${config.website_url}`);
    console.log(`   Industry: ${config.industry}`);
    console.log("");

    // Generate proposal
    const result = await generateProposal(config);

    console.log("\n🎉 Success!");
    console.log(`📂 Output directory: ${result.outputDir}`);
    console.log("\nGenerated files:");
    result.files.forEach((file) => {
      const size = fs.statSync(file).size;
      console.log(`  - ${path.basename(file)} (${size} bytes)`);
    });

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();


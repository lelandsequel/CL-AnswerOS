#!/usr/bin/env tsx
// scripts/test-proposal-generator.ts
// Smoke test for proposal generator

import * as fs from "fs";
import * as path from "path";
import { validateConfig } from "../lib/proposal/config";
import { generateProposal } from "../lib/proposal/generator";

async function runSmokeTest() {
  console.log("🧪 Proposal Generator Smoke Test");
  console.log("================================\n");

  try {
    // Load example config
    const configPath = path.resolve("./inputs/example.json");
    if (!fs.existsSync(configPath)) {
      throw new Error(`Example config not found: ${configPath}`);
    }

    const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const config = validateConfig(rawConfig);

    console.log(`✓ Config loaded: ${config.company_name}`);

    // Generate proposal
    const result = await generateProposal(config);

    console.log(`\n✓ Proposal generated in: ${result.outputDir}`);

    // Verify all files exist
    const expectedFiles = [
      "SEO_AUDIT.md",
      "AEO_AUDIT.md",
      "PSEO_PLAN.md",
      "PROPOSAL_DECK_OUTLINE.md",
      "IMPLEMENTATION_BLUEPRINT.md",
    ];

    console.log("\n📋 Verifying output files:");
    let allFilesValid = true;

    for (const filename of expectedFiles) {
      const filepath = path.join(result.outputDir, filename);

      if (!fs.existsSync(filepath)) {
        console.log(`  ✗ ${filename} - NOT FOUND`);
        allFilesValid = false;
        continue;
      }

      const content = fs.readFileSync(filepath, "utf-8");
      const size = content.length;

      if (size === 0) {
        console.log(`  ✗ ${filename} - EMPTY`);
        allFilesValid = false;
        continue;
      }

      // Check for markdown content
      if (!content.includes("#")) {
        console.log(`  ✗ ${filename} - NOT MARKDOWN`);
        allFilesValid = false;
        continue;
      }

      console.log(`  ✓ ${filename} (${size} bytes)`);
    }

    if (!allFilesValid) {
      throw new Error("Some files are missing or invalid");
    }

    console.log("\n✅ All tests passed!");
    console.log(`\n📂 Output: ${result.outputDir}`);
    console.log("\nTo view the proposal:");
    console.log(`  cat ${path.join(result.outputDir, "PROPOSAL_DECK_OUTLINE.md")}`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runSmokeTest();


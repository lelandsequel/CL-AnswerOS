import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
  console.log("🔍 Verifying Supabase tables...");

  const tables = ["clients", "audits", "client_assets"];
  let allExist = true;

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      console.error(`❌ Table '${table}' check failed:`, error.message);
      allExist = false;
    } else {
      console.log(`✅ Table '${table}' exists.`);
    }
  }

  if (allExist) {
    console.log("\n🎉 All tables verified successfully!");
  } else {
    console.log("\n⚠️  Some tables are missing. Please run the SQL manually in Supabase Dashboard.");
  }
}

verifyTables();
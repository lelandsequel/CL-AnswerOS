import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for admin tasks

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables.");
  console.error("   Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log("🔧 Setting up Supabase database...");

  try {
    const { error } = await supabase.rpc("exec", {
      sql: `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- 1. Clients Table
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          primary_domain TEXT,
          contact_name TEXT,
          contact_email TEXT,
          notes TEXT,
          stage TEXT DEFAULT 'lead',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

        -- 2. Audits Table (Updated)
        CREATE TABLE IF NOT EXISTS audits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
          url TEXT NOT NULL,
          domain TEXT,
          summary TEXT,
          opportunity_rating TEXT,
          raw_score NUMERIC,
          chaos INTEGER,
          sass INTEGER,
          raw_scan TEXT,
          structured_audit JSONB,
          keyword_metrics JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url);
        CREATE INDEX IF NOT EXISTS idx_audits_client_id ON audits(client_id);
        CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);

        -- 3. Client Assets Table
        CREATE TABLE IF NOT EXISTS client_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT,
          payload JSONB,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_client_assets_client_id ON client_assets(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_assets_type ON client_assets(type);
      `,
    });

    if (error) {
      console.error("❌ Error executing SQL via RPC:", error);
      console.log("\n⚠️  NOTE: The 'exec' RPC function might not exist on your Supabase instance.");
      console.log("   You can run the following SQL manually in the Supabase SQL Editor:");
      console.log("\n   ----------------------------------------------------------------");
      console.log(`
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- 1. Clients Table
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          primary_domain TEXT,
          contact_name TEXT,
          contact_email TEXT,
          notes TEXT,
          stage TEXT DEFAULT 'lead',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

        -- 2. Audits Table
        CREATE TABLE IF NOT EXISTS audits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
          url TEXT NOT NULL,
          domain TEXT,
          summary TEXT,
          opportunity_rating TEXT,
          raw_score NUMERIC,
          chaos INTEGER,
          sass INTEGER,
          raw_scan TEXT,
          structured_audit JSONB,
          keyword_metrics JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url);
        CREATE INDEX IF NOT EXISTS idx_audits_client_id ON audits(client_id);
        CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);

        -- 3. Client Assets Table
        CREATE TABLE IF NOT EXISTS client_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT,
          payload JSONB,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_client_assets_client_id ON client_assets(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_assets_type ON client_assets(type);
      `);
      console.log("   ----------------------------------------------------------------\n");
      return;
    }

    console.log("✅ Database setup complete!");
  } catch (err) {
    console.error("❌ Setup failed:", err);
  }
}

setupDatabase();

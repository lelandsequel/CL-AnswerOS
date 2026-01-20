/**
 * POST /api/demo/create-audit-asset
 * Creates a deterministic demo audit asset and returns redirect URL
 * Idempotent: safe to call multiple times
 */

import { createClient } from '@supabase/supabase-js';
import { getDemoAuditPayload } from '@/lib/demo/demoPayload';
import type { ClientAsset } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // Initialize Supabase with service role (for server-side operations)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get deterministic demo payload
    const demoPayload = getDemoAuditPayload();

    // Create ClientAsset object
    const clientAsset: Omit<ClientAsset, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: null, // Demo asset not tied to a specific client
      type: 'audit',
      title: `Demo Audit – ${demoPayload.structuredFields?.company_name || 'Rockspring Capital'}`,
      summary: 'Deterministic demo audit for one-click demo flow',
      payload: demoPayload,
      tags: ['demo', 'audit'],
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('client_assets')
      .insert([clientAsset])
      .select()
      .single();

    if (error) {
      console.error('Failed to create demo asset:', error);
      return Response.json(
        { error: 'Failed to create demo asset', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        { error: 'No data returned from Supabase' },
        { status: 500 }
      );
    }

    // Return assetId and redirect URL
    return Response.json({
      success: true,
      assetId: data.id,
      clientAsset: data,
      redirect: `/pseo?asset=${data.id}&demo=1`,
    });
  } catch (error) {
    console.error('Error creating demo asset:', error);
    return Response.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}


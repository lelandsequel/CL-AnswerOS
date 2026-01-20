/**
 * POST /api/demo/create-audit-asset
 * Idempotent demo asset creation: reuses existing demo asset if available
 *
 * Flow:
 * 1. Try to find existing demo asset by demo_key
 * 2. If found: return it (reused: true)
 * 3. If not found: create new one (reused: false)
 * 4. Always returns { assetId, redirect, reused, success }
 */

import { createClient } from '@supabase/supabase-js';
import { getDemoAuditPayload, DEMO_KEY } from '@/lib/demo/demoPayload';
import type { ClientAsset } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // Initialize Supabase with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Step 1: Try to find existing demo asset
    const { data: existingAssets, error: lookupError } = await supabase
      .from('client_assets')
      .select('*')
      .eq('type', 'audit')
      .filter('payload->metadata->demo_key', 'eq', DEMO_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!lookupError && existingAssets && existingAssets.length > 0) {
      const existing = existingAssets[0];
      console.log(`[Demo] Reusing existing demo asset: ${existing.id}`);

      return Response.json({
        success: true,
        assetId: existing.id,
        reused: true,
        redirect: `/pseo?asset=${existing.id}&demo=1`,
      });
    }

    // Step 2: No existing asset found, create new one
    console.log('[Demo] Creating new demo asset');
    const demoPayload = getDemoAuditPayload();

    const clientAsset: Omit<ClientAsset, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: null,
      type: 'audit',
      title: `Demo Audit – ${demoPayload.structuredFields?.company_name || 'Rockspring Capital'}`,
      summary: 'Deterministic demo audit for one-click demo flow',
      payload: demoPayload,
      tags: ['demo', 'audit'],
    };

    const { data: newAsset, error: createError } = await supabase
      .from('client_assets')
      .insert([clientAsset])
      .select()
      .single();

    if (createError) {
      console.error('Failed to create demo asset:', createError);
      return Response.json(
        { error: 'Failed to create demo asset', details: createError.message },
        { status: 500 }
      );
    }

    if (!newAsset) {
      return Response.json(
        { error: 'No data returned from Supabase' },
        { status: 500 }
      );
    }

    console.log(`[Demo] Created new demo asset: ${newAsset.id}`);

    return Response.json({
      success: true,
      assetId: newAsset.id,
      reused: false,
      redirect: `/pseo?asset=${newAsset.id}&demo=1`,
    });
  } catch (error) {
    console.error('Error in demo asset creation:', error);
    return Response.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}


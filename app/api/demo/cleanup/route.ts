/**
 * POST /api/demo/cleanup
 * Dev-only endpoint to clean up old demo assets
 * Deletes all demo assets except the newest one
 * 
 * Protected: Only runs in development mode
 * Usage: curl -X POST http://localhost:3000/api/demo/cleanup
 */

import { createClient } from '@supabase/supabase-js';
import { DEMO_KEY } from '@/lib/demo/demoPayload';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      { error: 'Cleanup only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get all demo assets, ordered newest first
    const { data: allDemoAssets, error: fetchError } = await supabase
      .from('client_assets')
      .select('id, created_at')
      .eq('type', 'audit')
      .filter('payload->metadata->demo_key', 'eq', DEMO_KEY)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch demo assets:', fetchError);
      return Response.json(
        { error: 'Failed to fetch demo assets', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!allDemoAssets || allDemoAssets.length <= 1) {
      return Response.json({
        success: true,
        message: 'No cleanup needed (0 or 1 demo asset exists)',
        deleted: 0,
        remaining: allDemoAssets?.length || 0,
      });
    }

    // Keep the newest one, delete the rest
    const toDelete = allDemoAssets.slice(1).map(asset => asset.id);
    
    const { error: deleteError } = await supabase
      .from('client_assets')
      .delete()
      .in('id', toDelete);

    if (deleteError) {
      console.error('Failed to delete demo assets:', deleteError);
      return Response.json(
        { error: 'Failed to delete demo assets', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`[Demo Cleanup] Deleted ${toDelete.length} old demo assets, kept 1`);

    return Response.json({
      success: true,
      message: `Cleaned up ${toDelete.length} old demo assets`,
      deleted: toDelete.length,
      remaining: 1,
    });
  } catch (error) {
    console.error('Error in demo cleanup:', error);
    return Response.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}


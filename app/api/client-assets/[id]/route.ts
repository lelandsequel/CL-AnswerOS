// app/api/client-assets/[id]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// GET /api/client-assets/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('client_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(
        'Supabase GET client_assets/[id] error:',
        error
      );
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error(
      'GET /api/client-assets/[id] error:',
      err
    );
    return NextResponse.json(
      {
        error:
          err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/client-assets/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('client_assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Supabase DELETE client_assets/[id] error:',
        error
      );
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(
      'DELETE /api/client-assets/[id] error:',
      err
    );
    return NextResponse.json(
      {
        error:
          err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}


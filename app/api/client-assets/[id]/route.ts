// app/api/client-assets/[id]/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

// GET /api/client-assets/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
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
    const supabase = getSupabaseServer();
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


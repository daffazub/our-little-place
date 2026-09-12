import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Ping route to prevent Supabase database project from pausing
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const { count, error } = await supabase
      .from('rooms')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      roomsCount: count ?? 0,
    })
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

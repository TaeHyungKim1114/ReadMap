import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

type PersistedUserData = {
  roadmaps: unknown[]
  reviews: unknown[]
  activeRoadmapId: string | null
}

type UserDataRow = {
  user_id: string
  payload: PersistedUserData
  updated_at?: string
}

const TABLE_NAME = 'user_data'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase env is not configured' }, { status: 503 })
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('user_id, payload, updated_at')
      .eq('user_id', userId)
      .maybeSingle<UserDataRow>()

    if (error) {
      console.error('[api/user-data] GET failed', error)
      return NextResponse.json({ error: 'Failed to load user data' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data: data.payload })
  } catch (error) {
    console.error('[api/user-data] GET unexpected error', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId?: string; data?: PersistedUserData }
    const userId = body.userId?.trim()
    const data = body.data

    if (!userId || !data) {
      return NextResponse.json({ error: 'userId and data are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase env is not configured' }, { status: 503 })
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(
        {
          user_id: userId,
          payload: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[api/user-data] POST failed', error)
      return NextResponse.json({ error: 'Failed to save user data' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api/user-data] POST unexpected error', error)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}


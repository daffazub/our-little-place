import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Root page — redirect based on session
// Root page — redirect based on active session
export default async function RootPage() {
  const cookieStore = await cookies()
  const deviceToken = cookieStore.get('olp_device_token')?.value

  if (!deviceToken) {
    redirect('/create')
  }

  // If device token exists, we need to find which room they belong to
  // The actual room lookup happens client-side from localStorage
  redirect('/room/loading')
  let targetRoomId: string | null = null

  try {
    const supabase = await getSupabaseServerClient()
    const { data: member } = await supabase
      .from('members')
      .select('room_id')
      .eq('device_token', deviceToken)
      .maybeSingle()

    if (member?.room_id) {
      targetRoomId = member.room_id
    }
  } catch {
    // Graceful fallback if database is not reachable
  }

  if (targetRoomId) {
    redirect(`/room/${targetRoomId}`)
  } else {
    redirect('/create')
  }
}

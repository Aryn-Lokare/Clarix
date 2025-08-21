import { createClient } from '@supabase/supabase-js'

// This route deletes the current authenticated user and related rows.
// It expects an Authorization: Bearer <access_token> header from the client.
export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: missing Supabase env vars' }), { status: 500 })
    }

    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing bearer token' }), { status: 401 })
    }
    const accessToken = authHeader.replace(/^Bearer\s+/i, '')

    // Validate the token and get the user ID using a public client
    const pub = createClient(supabaseUrl, anonKey)
    const { data: userData, error: userErr } = await pub.auth.getUser(accessToken)
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401 })
    }
    const userId = userData.user.id

    // Use service role client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey)

    // Best-effort delete related rows first (scoped by user)
    await admin.from('diagnoses').delete().eq('user_id', userId)
    await admin.from('profiles').delete().eq('id', userId)

    // Finally delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(userId)
    if (delErr) {
      console.error('Delete user error:', delErr)
      return new Response(JSON.stringify({ error: 'Failed to delete user' }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    console.error('Account delete route error:', e)
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), { status: 500 })
  }
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }
        setEmail(user.email)
        setUserId(user.id)

        // Only super admins can access
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (!profile || profile.role !== 'super_admin') { router.push('/dashboard'); return }
      } catch (e) {
        setError(e.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  async function sendPasswordReset() {
    if (!email) return
    setBusy(true); setError('')
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` })
      if (error) throw error
      alert('Password reset email sent')
    } catch (e) {
      setError(e.message || 'Failed to send reset email')
    } finally { setBusy(false) }
  }

  async function signOutAll() {
    setBusy(true); setError('')
    try {
      await supabase.auth.signOut({ scope: 'global' })
      alert('Signed out from all devices')
    } catch (e) {
      setError(e.message || 'Failed to sign out globally')
    } finally { setBusy(false) }
  }


  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-blue-600 hover:text-blue-700">← Back to Admin</button>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

        <div className="bg-white shadow rounded-md p-4 space-y-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Admin Email</label>
            <input value={email} readOnly className="w-full border rounded-md p-2 text-gray-900" />
          </div>

          <div className="border-t pt-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Account</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={sendPasswordReset} disabled={busy} className="px-4 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-all duration-300 disabled:opacity-50">Change Password</button>
              <button onClick={signOutAll} disabled={busy} className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50">Sign out from all devices</button>
            </div>
          </div>

          {/* Same contact phone editor as user/doctor settings */}
          <div className="border-t pt-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Contact</h2>
            <AdminPhoneEditor />
          </div>

        </div>
      </div>
    </div>
  )
}

function AdminPhoneEditor() {
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('phone').eq('id', user.id).single()
      setPhone(data?.phone || '')
    })()
  }, [])

  async function save() {
    setSaving(true); setStatus('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('profiles').update({ phone }).eq('id', user.id)
      if (error) throw error
      setStatus('Saved')
    } catch (e) {
      setStatus(`Failed to save: ${e.message || e}`)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-600">Phone number (visible to users)</label>
      <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-black rounded-md p-2 text-black bg-white" placeholder="e.g. +1 555-000-0000" />
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        {status && <span className="text-xs text-gray-500">{status}</span>}
      </div>
    </div>
  )
}



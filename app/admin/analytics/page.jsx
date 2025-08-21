'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    (async () => {
      try {
        // Require auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth'); return }

        // Ensure super admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (!profile || profile.role !== 'super_admin') { router.push('/dashboard'); return }

        // Fetch analytics from backend (uses service role, bypassing RLS)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No active session')
        const resp = await fetch('http://localhost:8000/api/admin/analytics', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const payload = await resp.json()
        if (!resp.ok) throw new Error(payload.detail || 'Failed to fetch analytics')
        setAnalytics(payload)

        // Enrich with full user profiles for reliable names
        try {
          const uResp = await fetch('http://localhost:8000/api/admin/users', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (uResp.ok) {
            const usersPayload = await uResp.json()
            if (Array.isArray(usersPayload)) setAllUsers(usersPayload)
          }
        } catch (_) { /* ignore, fallback to analytics.users */ }
      } catch (e) {
        console.error('Failed to load admin analytics:', e)
        setError(e.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const roleCounts = useMemo(() => {
    const users = analytics?.users || []
    return {
      total: users.length,
      user: users.filter(u => u.role === 'user').length,
      doctor: users.filter(u => u.role === 'doctor').length,
      super_admin: users.filter(u => u.role === 'super_admin').length,
    }
  }, [analytics])

  const usersById = useMemo(() => {
    const map = {}
    ;(allUsers.length ? allUsers : (analytics?.users || [])).forEach(u => { map[u.id] = u })
    return map
  }, [analytics, allUsers])

  function displayUser(uOrId) {
    const u = typeof uOrId === 'string' ? usersById[uOrId] : uOrId
    if (!u) return typeof uOrId === 'string' ? uOrId : '—'
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
    return fullName || u.username || u.email || u.id
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-blue-600 hover:text-blue-700">← Back to Admin</button>
            <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
        )}

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Stat title="Total Users" value={roleCounts.total} icon="👤" />
          <Stat title="Doctors" value={roleCounts.doctor} icon="👨‍⚕️" />
          <Stat title="Super Admins" value={roleCounts.super_admin} icon="👑" />
          <Stat title="Regular Users" value={roleCounts.user} icon="📊" />
          <Stat title="Total Analyses" value={analytics?.total_diagnoses ?? 0} icon="🧪" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Diagnoses per user */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analyses by User</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analyses</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analytics?.diagnoses_per_user || {}).map(([uid, count]) => {
                    const u = usersById[uid] || {}
                    return (
                      <tr key={uid}>
                        <td className="px-4 py-2 text-sm text-gray-900">{displayUser(u) }</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{u.role || '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent diagnoses */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses (7 days)</h2>
            <div className="space-y-3">
              {(analytics?.recent_diagnoses || []).length === 0 ? (
                <div className="text-sm text-gray-500">No recent analyses</div>
              ) : (
                (analytics?.recent_diagnoses || []).map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{displayUser(d.user_id)}</div>
                      <div className="text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      d.status === 'completed' ? 'bg-green-100 text-green-800' :
                      d.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      d.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* All diagnoses table */}
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Analyses</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(analytics?.diagnoses || []).map(d => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{d.id.slice(-8)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{displayUser(d.user_id)}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          d.status === 'completed' ? 'bg-green-100 text-green-800' :
                          d.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          d.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className="p-3 bg-gray-100 rounded-lg text-xl">{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}



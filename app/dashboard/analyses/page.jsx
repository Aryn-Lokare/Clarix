'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

export default function AnalysesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)
      await fetchItems(user.id)
      setLoading(false)
    })()
  }, [router])

  async function fetchItems(uid) {
    const { data, error } = await supabase
      .from('diagnoses')
      .select('id, created_at, status, predictions')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (!error) setItems(data || [])
  }

  function primaryFinding(predictions) {
    // Try to read a top label from saved predictions format
    const preds = predictions?.predictions || predictions?.results || []
    if (Array.isArray(preds) && preds.length) {
      const top = [...preds].sort((a,b) => (b.confidence || 0) - (a.confidence || 0))[0]
      return top?.label || '—'
    }
    // fallback if model saved as string
    if (typeof predictions === 'string') return predictions
    return '—'
  }


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-900">All Analyses</h1>
        </div>

        <div className="bg-white shadow rounded-md p-4">
          {items.length === 0 ? (
            <div className="text-gray-500 text-sm">No analyses yet.</div>
          ) : (
            <div className="divide-y">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Analysis #{item.id.slice(-8)}</div>
                    <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                    <div className="text-xs text-gray-700 mt-1">Primary finding: <span className="font-medium">{primaryFinding(item.predictions)}</span></div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

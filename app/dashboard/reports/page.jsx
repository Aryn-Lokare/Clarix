'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

function primaryFinding(predictions) {
  const preds = predictions?.predictions || predictions?.results || []
  if (Array.isArray(preds) && preds.length) {
    const top = [...preds].sort((a,b) => (b.confidence || 0) - (a.confidence || 0))[0]
    return top?.label || '—'
  }
  if (typeof predictions === 'string') return predictions
  return '—'
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      // Fetch user-scoped diagnoses as "reports"
      const { data, error } = await supabase
        .from('diagnoses')
        .select('id, created_at, status, predictions')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) setItems(data || [])
      setLoading(false)
    })()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">Back</Link>
        </div>

        <div className="bg-white shadow rounded-md p-4">
          {items.length === 0 ? (
            <div className="text-gray-500 text-sm">No reports yet.</div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Analysis #{item.id.slice(-8)}</div>
                    <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-700">Primary: <span className="font-medium">{primaryFinding(item.predictions)}</span></span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'completed' ? 'bg-green-100 text-green-800' :
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

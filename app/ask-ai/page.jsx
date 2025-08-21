'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function AskAIPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [doctors, setDoctors] = useState([])
  const [consultOpen, setConsultOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgStatus, setMsgStatus] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof || null)
      if (prof?.role !== 'doctor') {
        const { data, error } = await supabase
          .from('messaging_profiles')
          .select('id, username, email, first_name, last_name, role')
          .eq('role', 'doctor')
        
        // Add phone numbers from profiles if possible
        if (data && data.length > 0) {
          const doctorIds = data.map(d => d.id)
          const { data: phoneData } = await supabase
            .from('profiles')
            .select('id, phone')
            .in('id', doctorIds)
          
          const phoneMap = {}
          if (phoneData) {
            phoneData.forEach(p => { phoneMap[p.id] = p.phone })
          }
          
          const doctorsWithPhone = data.map(doc => ({
            ...doc,
            phone: phoneMap[doc.id] || null,
            displayName: [doc.first_name, doc.last_name].filter(Boolean).join(' ') || doc.username || 'Doctor'
          }))
          setDoctors(doctorsWithPhone)
        } else {
          setDoctors([])
        }
        
        if ((data || []).length === 0 && error) {
          console.warn('Doctor directory query error:', error)
        }
      }
    })()
  }, [router])

  async function ask() {
    setError('')
    if (!question.trim()) return
    setLoading(true)
    try {
      const context = typeof window !== 'undefined' ? localStorage.getItem('last_ai_findings') || '' : ''
      const res = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setAnswer(data.answer)
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function sendConsultation(doctorId) {
    setMsgStatus('')
    if (!msg.trim()) { setMsgStatus('Please enter a short message.'); return }
    const { error } = await supabase.from('messages').insert({
      from_user_id: user.id,
      to_user_id: doctorId,
      content: msg
    })
    if (error) setMsgStatus('Failed to send. Please try again.')
    else {
      setMsgStatus('Sent! The doctor will try to contact you as soon as possible.')
      setMsg('')
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      ask()
    }
  }

  const isDoctor = profile?.role === 'doctor'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2">
              <span className="text-xl">←</span>
              <span className="font-medium">Back</span>
            </Link>
            <span className="text-gray-800 font-semibold">Ask AI</span>
          </div>
          <div className="text-xs text-gray-500">Ctrl/Cmd + Enter to send</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-4 sm:p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your question</label>
          <textarea
            className="w-full border rounded-md p-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            placeholder="Ask about a finding or report..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              onClick={ask}
              disabled={loading}
            >
              {loading ? 'Asking…' : 'Ask'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>

          {answer && (
            <div className="mt-6 bg-gray-50 border rounded-md p-4">
              <div className="text-gray-900 whitespace-pre-wrap">{answer}</div>
            </div>
          )}
        </div>

        {!isDoctor && (
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Consult a doctor</h3>
              <button className="text-sm text-blue-600" onClick={() => setConsultOpen(v => !v)}>
                {consultOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {consultOpen && (
              <div className="mt-4 space-y-4">
                {doctors.length === 0 ? (
                  <div className="text-sm text-gray-500">No doctors are available right now.</div>
                ) : (
                  doctors.map(doc => (
                    <div key={doc.id} className="border rounded-md p-3">
                      <div className="text-sm font-medium text-gray-900">{doc.displayName || doc.username || 'Doctor'}</div>
                      <div className="text-xs text-gray-500">{doc.email}</div>
                      <div className="text-xs text-gray-700">Phone: {doc.phone || '—'}</div>
                      <div className="mt-2">
                        <textarea
                          className="w-full border rounded-md p-2 text-sm"
                          rows={2}
                          placeholder="Write a short message for this doctor..."
                          value={msg}
                          onChange={e => setMsg(e.target.value)}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-green-600 text-white rounded-md" onClick={() => sendConsultation(doc.id)}>
                          Send message
                        </button>
                        {msgStatus && <span className="text-xs text-gray-600">{msgStatus}</span>}
                      </div>
                    </div>
                  ))
                )}
                <div className="text-xs text-gray-500">A doctor will try to contact you as soon as possible.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

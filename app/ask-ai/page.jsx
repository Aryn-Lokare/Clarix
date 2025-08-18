'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AskAIPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth')
      else setUser(user)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ask AI</h1>
        <textarea className="w-full border rounded-md p-3 text-gray-900 placeholder-gray-500" rows={5} placeholder="Ask about a finding or report..." value={question} onChange={e => setQuestion(e.target.value)} />
        <div className="mt-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => setAnswer('This is a placeholder. Hook up your LLM here.')}>Ask</button>
        </div>
        {answer && (
          <div className="mt-6 bg-white shadow rounded-md p-4">
            <div className="text-gray-900 whitespace-pre-wrap">{answer}</div>
          </div>
        )}
      </div>
    </div>
  )
}



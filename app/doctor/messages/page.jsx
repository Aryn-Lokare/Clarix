'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function DoctorMessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [items, setItems] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [profilesById, setProfilesById] = useState({})
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadMessages = useCallback(async (uid) => {
    setError('')
    const { data, error } = await supabase
      .from('messages')
      .select('id, created_at, content, from_user_id, to_user_id')
      .or(`to_user_id.eq.${uid},from_user_id.eq.${uid}`)
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
      setItems([])
    } else {
      setItems(data || [])
      await buildConversations(uid, data || [])
    }
  }, [])

  async function buildConversations(uid, msgs) {
    const map = new Map()
    for (const m of msgs) {
      const other = m.from_user_id === uid ? m.to_user_id : m.from_user_id
      const prev = map.get(other)
      if (!prev || new Date(m.created_at) > new Date(prev.created_at)) map.set(other, m)
    }
    const list = Array.from(map.entries()).map(([otherId, lastMessage]) => ({ otherId, lastMessage }))
    list.sort((a,b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at))

    // Prefetch profiles before rendering list to avoid temporary placeholders
    const otherIds = list.map(c => c.otherId)
    if (otherIds.length) {
      try {
        const { data } = await supabase.from('messaging_profiles').select('id, username, email, first_name, last_name').in('id', otherIds)
        if (Array.isArray(data)) {
          const dict = {}; data.forEach(p => { dict[p.id] = p }); setProfilesById(dict)
        }
      } catch (_) { /* ignore */ }
    }

    setConversations(list)
    if (!activeId && list.length) setActiveId(list[0].otherId)
  }

  const activeMessages = items
    .filter(m => activeId && (m.from_user_id === activeId || m.to_user_id === activeId))
    .sort((a,b) => new Date(a.created_at) - new Date(b.created_at))

  function displayName(id) {
    const p = profilesById[id]
    // Prefer user-friendly name. If profile isn't available, use a neutral fallback.
    if (!p) return 'Unknown user'
    const full = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
    return full || p.username || p.email || 'User'
  }

  async function sendMessage() {
    if (!activeId || !inputText.trim()) return
    setSending(true)
    try {
      const text = inputText.trim()
      setInputText('')
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('messages').insert({
        from_user_id: user.id,
        to_user_id: activeId,
        content: text,
      })
      if (error) throw error
      await loadMessages(user.id)
    } catch (e) {
      alert(e.message || 'Failed to send')
    } finally { setSending(false) }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      if (prof?.role !== 'doctor') { router.push('/dashboard'); return }
      await loadMessages(user.id)
      setLoading(false)
    })()
  }, [router, loadMessages])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="px-3 py-2 text-sm rounded-md bg-black text-white hover:bg-gray-900">Back</button>
            <button onClick={() => profile?.id && loadMessages(profile.id)} className="px-3 py-2 text-sm rounded-md bg-black text-white hover:bg-gray-900">Refresh</button>
          </div>
        </div>
        {error && (
          <div className="mb-3 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
        )}
        {items.length === 0 ? (
          <div className="bg-white shadow rounded-md p-4 text-sm text-gray-500">No messages yet.</div>
        ) : (
          <div className="bg-white shadow rounded-lg grid grid-cols-1 md:grid-cols-3" style={{minHeight: '480px'}}>
            <div className="border-r p-3 md:col-span-1">
              <div className="text-xs text-gray-500 mb-2">Conversations</div>
              <div className="space-y-1">
                {conversations.map(c => (
                  <button key={c.otherId} onClick={() => setActiveId(c.otherId)} className={`w-full text-left px-3 py-2 rounded-md border ${activeId === c.otherId ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}>
                    <div className="text-sm font-medium text-gray-900 truncate">{displayName(c.otherId)}</div>
                    <div className="text-xs text-gray-500 truncate">{c.lastMessage.content}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col">
              <div className="border-b p-3">
                <div className="text-sm text-black font-medium">Chat with</div>
                <div className="text-lg font-semibold text-gray-900">{activeId ? displayName(activeId) : '—'}</div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
                {activeMessages.map(m => {
                  const isMine = m.from_user_id === profile?.id
                  return (
                    <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 ${isMine ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white border text-black'}`}>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      <div className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
              <div className="p-3 border-t flex items-center gap-2 bg-white">
                <input value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }} className="flex-1 border border-black rounded-md px-3 py-2 text-sm text-black placeholder-gray-600 bg-white" placeholder="Type a message" />
                <button onClick={sendMessage} disabled={sending || !activeId} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

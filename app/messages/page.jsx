'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function UserMessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [myId, setMyId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [profilesById, setProfilesById] = useState({})
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setMyId(user.id)
      const { data, error } = await supabase
        .from('messages')
        .select('id, created_at, content, from_user_id, to_user_id')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      if (error) console.warn('Load messages error', error)
      setItems(data || [])
      buildConversations(user.id, data || [])
      setLoading(false)
    })()
  }, [router])

  function buildConversations(uid, msgs) {
    const map = new Map()
    for (const m of msgs) {
      const other = m.from_user_id === uid ? m.to_user_id : m.from_user_id
      const prev = map.get(other)
      if (!prev || new Date(m.created_at) > new Date(prev.created_at)) map.set(other, m)
    }
    const list = Array.from(map.entries()).map(([otherId, lastMessage]) => ({ otherId, lastMessage }))
    list.sort((a,b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at))
    setConversations(list)
    if (!activeId && list.length) setActiveId(list[0].otherId)

    // Try to fetch counterpart profiles for display
    const otherIds = list.map(c => c.otherId)
    if (otherIds.length) {
      supabase.from('messaging_profiles').select('id, username, email, first_name, last_name')
        .in('id', otherIds)
        .then(({ data }) => {
          if (Array.isArray(data)) {
            const dict = {}
            data.forEach(p => { dict[p.id] = p })
            setProfilesById(dict)
          }
        })
        .catch(() => {})
    }
  }

  const activeMessages = items
    .filter(m => activeId && (m.from_user_id === activeId || m.to_user_id === activeId))
    .sort((a,b) => new Date(a.created_at) - new Date(b.created_at))

  function displayName(id) {
    const p = profilesById[id]
    // Avoid showing raw UUIDs; prefer human-friendly fields
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
      // reload messages
      const { data } = await supabase
        .from('messages')
        .select('id, created_at, content, from_user_id, to_user_id')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      setItems(data || [])
      buildConversations(user.id, data || [])
    } catch (e) {
      alert(e.message || 'Failed to send')
    } finally { setSending(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="px-3 py-2 text-sm rounded-md bg-black text-white hover:bg-gray-900">Back</button>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="bg-white shadow rounded-md p-4 text-sm text-gray-500">No messages yet. Use Consult a doctor on Ask AI.</div>
        ) : (
          <div className="bg-white shadow rounded-lg grid grid-cols-1 md:grid-cols-3" style={{minHeight: '480px'}}>
            {/* Sidebar */}
            <div className="border-r p-3 md:col-span-1">
              <div className="text-xs text-gray-500 mb-2">Conversations</div>
              <div className="space-y-1">
                {conversations.map(c => (
                  <button
                    key={c.otherId}
                    onClick={() => setActiveId(c.otherId)}
                    className={`w-full text-left px-3 py-2 rounded-md border ${activeId === c.otherId ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-transparent'}`}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">{displayName(c.otherId)}</div>
                    <div className="text-xs text-gray-500 truncate">{c.lastMessage.content}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat pane */}
            <div className="md:col-span-2 flex flex-col">
              <div className="border-b p-3">
                <div className="text-sm text-black font-medium">Chat with</div>
                <div className="text-lg font-semibold text-gray-900">{activeId ? displayName(activeId) : '—'}</div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
                {activeMessages.map(m => {
                  const isMine = m.from_user_id === myId
                  return (
                    <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 ${isMine ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white border text-black'}`}>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      <div className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
              <div className="p-3 border-t flex items-center gap-2 bg-white">
                <input
                  value={inputText}
                  onChange={e=>setInputText(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }}
                  className="flex-1 border border-black rounded-md px-3 py-2 text-sm text-black placeholder-gray-600 bg-white"
                  placeholder="Type a message"
                />
                <button onClick={sendMessage} disabled={sending || !activeId} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

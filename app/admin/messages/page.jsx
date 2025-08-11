'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function MessagesPage() {
  const [allMessages, setAllMessages] = useState([]) // Store all messages
  const [filteredMessages, setFilteredMessages] = useState([]) // Store filtered messages
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'super_admin') {
        router.push('/dashboard')
        return
      }

      setUser(user)
      await loadAllMessages()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth')
    }
  }

  // Load all messages without filtering
  const loadAllMessages = async () => {
    try {
      console.log('🔍 Loading all messages...')
      
      // First check if table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('contact_messages')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.error('❌ Table check failed:', tableError)
        if (tableError.code === '42P01') {
          console.error('Table "contact_messages" does not exist')
          setError('Contact messages table not found. Please run the database setup script.')
        } else {
          setError(`Database error: ${tableError.message}`)
        }
        setAllMessages([])
        setFilteredMessages([])
        setLoading(false)
        return
      }
      
      console.log('✅ Table exists, loading all messages...')
      
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Query error:', error)
        throw error
      }
      
      console.log('✅ All messages loaded:', data?.length || 0)
      setAllMessages(data || [])
      applyFilter(data || [], filter)
    } catch (error) {
      console.error('❌ Error loading messages:', error)
      setError(`Failed to load messages: ${error.message}`)
      setAllMessages([])
      setFilteredMessages([])
    } finally {
      setLoading(false)
    }
  }

  // Apply filter to messages
  const applyFilter = (messages, currentFilter) => {
    if (currentFilter === 'all') {
      setFilteredMessages(messages)
    } else {
      const filtered = messages.filter(m => m.status === currentFilter)
      setFilteredMessages(filtered)
    }
  }

  // Update filter and apply it
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    applyFilter(allMessages, newFilter)
  }

  // Refresh messages (useful for manual refresh)
  const refreshMessages = async () => {
    setLoading(true)
    await loadAllMessages()
  }

  useEffect(() => {
    if (user) {
      loadAllMessages()
    }
  }, [user])

  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          status: newStatus,
          responded_at: newStatus === 'responded' ? new Date().toISOString() : null,
          responded_by: newStatus === 'responded' ? user.id : null
        })
        .eq('id', messageId)

      if (error) throw error
      
      // Update the message in both arrays
      const updatedMessages = allMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: newStatus, responded_at: newStatus === 'responded' ? new Date().toISOString() : null, responded_by: newStatus === 'responded' ? user.id : null }
          : msg
      )
      
      setAllMessages(updatedMessages)
      applyFilter(updatedMessages, filter)
      
      // Update selected message if it's the one being updated
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage({...selectedMessage, status: newStatus, responded_at: newStatus === 'responded' ? new Date().toISOString() : null, responded_by: newStatus === 'responded' ? user.id : null})
      }
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800'
      case 'read': return 'bg-yellow-100 text-yellow-800'
      case 'responded': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInquiryTypeColor = (type) => {
    switch (type) {
      case 'sales': return 'bg-blue-100 text-blue-800'
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'demo': return 'bg-green-100 text-green-800'
      case 'integration': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Admin
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshMessages}
                className="text-gray-600 hover:text-gray-800 p-1 rounded-md hover:bg-gray-100"
                title="Refresh messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">{allMessages.length} total messages</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Messages List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Messages</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setError(null)
                          refreshMessages()
                        }}
                        className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All', count: allMessages.length },
                  { key: 'unread', label: 'Unread', count: allMessages.filter(m => m.status === 'unread').length },
                  { key: 'read', label: 'Read', count: allMessages.filter(m => m.status === 'read').length },
                  { key: 'responded', label: 'Responded', count: allMessages.filter(m => m.status === 'responded').length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center shadow-sm border">
                  <p className="text-gray-500">No messages found</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`bg-white rounded-lg p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                      selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{message.name}</h3>
                        <p className="text-sm text-gray-600">{message.email}</p>
                        {message.organization && (
                          <p className="text-sm text-gray-500">{message.organization}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInquiryTypeColor(message.inquiry_type)}`}>
                          {message.inquiry_type}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 line-clamp-2 mb-3">{message.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Details */}
          <div className="lg:col-span-1">
            {selectedMessage ? (
              <div className="bg-white rounded-lg p-6 shadow-sm border sticky top-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Message Details</h3>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <p className="text-gray-900">{selectedMessage.name}</p>
                    <p className="text-gray-600 text-sm">{selectedMessage.email}</p>
                  </div>

                  {selectedMessage.organization && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Organization:</label>
                      <p className="text-gray-900">{selectedMessage.organization}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">Inquiry Type:</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getInquiryTypeColor(selectedMessage.inquiry_type)}`}>
                      {selectedMessage.inquiry_type}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <div className="mt-2 space-y-2">
                      {['unread', 'read', 'responded', 'archived'].map(status => (
                        <button
                          key={status}
                          onClick={() => updateMessageStatus(selectedMessage.id, status)}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMessage.status === status
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Message:</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Received:</label>
                    <p className="text-gray-600">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                  </div>

                  {selectedMessage.responded_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Responded:</label>
                      <p className="text-gray-600">{new Date(selectedMessage.responded_at).toLocaleString()}</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="border-t pt-4 mt-6">
                    <label className="text-sm font-medium text-gray-700">Quick Actions:</label>
                    <div className="mt-2 space-y-2">
                      <a
                        href={`mailto:${selectedMessage.email}?subject=Re: Your inquiry about Clarix`}
                        className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Reply via Email
                      </a>
                      <button
                        onClick={() => updateMessageStatus(selectedMessage.id, 'responded')}
                        className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark as Responded
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <p className="text-gray-500 text-center">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

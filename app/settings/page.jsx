'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth')
      else {
        setUser(user)
        setEmail(user.email)
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
        <div className="bg-white shadow rounded-md p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input value={email} readOnly className="w-full border rounded-md p-2 text-gray-900" />
          </div>
          <div className="text-sm text-gray-500">More settings to come.</div>
        </div>
      </div>
    </div>
  )
}



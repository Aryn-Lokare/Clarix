import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCTA() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/auth')
    }
  }

  const handleStartTrial = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/auth')
    }
  }

  const handleBookDemo = () => {
    // Scroll to contact form or go to contact page with demo pre-selected
    router.push('/contact')
    
    // Optional: Set demo as default inquiry type
    setTimeout(() => {
      const inquirySelect = document.querySelector('select[name="inquiryType"]')
      if (inquirySelect) {
        inquirySelect.value = 'demo'
        inquirySelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, 500)
  }

  const handleScheduleDemo = () => {
    handleBookDemo()
  }

  const handleContactUs = () => {
    router.push('/contact')
  }

  const handleLearnMore = () => {
    router.push('/features')
  }

  const handleHowItWorks = () => {
    router.push('/how-it-works')
  }

  return {
    user,
    loading,
    handleGetStarted,
    handleStartTrial,
    handleBookDemo,
    handleScheduleDemo,
    handleContactUs,
    handleLearnMore,
    handleHowItWorks
  }
}

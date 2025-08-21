'use client'

import { useState, useEffect } from 'react'
import { supabase, USER_ROLES } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [signupRole, setSignupRole] = useState(USER_ROLES.USER)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const pending = searchParams?.get('pending')
    if (pending) {
      setError('Your doctor account is awaiting super admin approval.')
    }
  }, [searchParams])

  async function sendResetFromAuth() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (!email) throw new Error('Enter your email above first')
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` })
      if (error) throw error
      setSuccess('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // Login - Handle all user types (user, doctor, super_admin)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Check if profile exists, if not create it
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If profile doesn't exist, create it
        if (profileError && profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
            id: data.user.id,
            email: data.user.email,
            role: 'user',
            username: data.user.user_metadata?.username || null
          })
           .select()
           .single()

          if (createError) {
            throw new Error('Failed to create user profile')
          }
          profile = newProfile
        } else if (profileError) {
          throw profileError
        }

        // Ensure username is set if missing but provided in metadata
        try {
          if ((profile && !profile.username) && data.user.user_metadata?.username) {
            await supabase
              .from('profiles')
              .update({ username: data.user.user_metadata.username })
              .eq('id', data.user.id)
          }
        } catch {}

        // Block unapproved doctors
        if (profile.role === USER_ROLES.DOCTOR && !profile.approved) {
          await supabase.auth.signOut()
          throw new Error('Your doctor account is awaiting approval from a super admin.')
        }

        // Redirect based on role
        if (profile.role === USER_ROLES.SUPER_ADMIN) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        // Signup - allow selecting role (user or doctor)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: signupRole,
              username,
            },
            emailRedirectTo: `${siteUrl}/auth?verified=1`
          }
        })

        if (error) throw error

        if (data.user) {
          // Check if user is confirmed (in development, users are auto-confirmed)
          if (data.user.email_confirmed_at || data.session) {
            // Create profile immediately for confirmed users
            try {
              const approved = signupRole !== USER_ROLES.DOCTOR
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: data.user.id,
                  email: data.user.email,
                  role: signupRole,
                  username,
                  approved
                })
              if (profileError && profileError.code !== '23505') {
                console.error('Profile creation error:', profileError)
              }
            } catch (err) {
              console.error('Profile creation failed:', err)
            }

            setSuccess('Account created successfully! You can now sign in.')
          } else {
            setSuccess('Account created! Check your email for the confirmation link.')
          }
          setEmail('')
          setPassword('')
          setUsername('')
          setSignupRole(USER_ROLES.USER)
        }
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }


  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${(i * 5.5) % 100}%`,
              top: `${(i * 4.8) % 100}%`,
              animationDelay: `${(i * 0.15) % 3}s`,
              animationDuration: `${3 + (i * 0.1) % 2}s`
            }}
          >
            <div className="w-1 h-1 bg-white rounded-full opacity-30"></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          {/* Logo with glow effect */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-75"></div>
              <div className="relative bg-white rounded-full p-4">
                <svg className="w-12 h-12 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                  <path d="M2 17L12 22L22 17" />
                  <path d="M2 12L12 17L22 12" />
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2 tracking-tight">
            Clarix
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Future'}
          </h2>
          <p className="text-gray-300">
            {isLogin ? "Sign in to your account" : "Create your account to get started"}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-lg py-8 px-6 shadow-2xl rounded-2xl border border-white/20">
          {/* Toggle Switch with improved design */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-full p-1 flex border border-white/10">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform ${
                  isLogin 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform ${
                  !isLogin 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleAuth}>
            {/* Role selection (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Select Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setSignupRole(USER_ROLES.USER)} className={`px-4 py-3 rounded-lg border ${signupRole===USER_ROLES.USER? 'border-blue-400 bg-blue-500/20 text-white':'border-white/20 text-gray-300 hover:bg-white/10'}`}>
                    User
                  </button>
                  <button type="button" onClick={() => setSignupRole(USER_ROLES.DOCTOR)} className={`px-4 py-3 rounded-lg border ${signupRole===USER_ROLES.DOCTOR? 'border-purple-400 bg-purple-500/20 text-white':'border-white/20 text-gray-300 hover:bg-white/10'}`}>
                    Doctor
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-300">Doctor accounts require super admin approval before first login.</p>
              </div>
            )}
            {/* Removed signup welcome box */}

            {/* Username (signup only) */}
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-300"
                    placeholder="Choose a username"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-300"
                  placeholder="Enter your password"
                />
              </div>
              {isLogin && (
                <div className="mt-2 text-right">
                  <button type="button" onClick={sendResetFromAuth} className="text-sm text-blue-300 hover:text-blue-200 underline">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-lg backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-green-300 text-sm font-medium">{success}</div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-lg backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-red-300 text-sm font-medium">{error}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white font-bold py-4 px-4 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  <span className="text-lg">Processing...</span>
                </div>
              ) : (
                <span className="text-lg">
                  {isLogin ? '🚀 Sign In' : '✨ Create Account'}
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold text-blue-400 hover:text-blue-300 underline transition-colors duration-200"
              >
                {isLogin ? 'Sign up now' : 'Sign in instead'}
              </button>
            </p>
          </div>

          {/* Additional info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [diagnoses, setDiagnoses] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [showPrediction, setShowPrediction] = useState(false)
  const [diagError, setDiagError] = useState('')
  const router = useRouter()
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    age: '',
    sex: '',
    date: '',
    time: ''
  })

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

      setUser(user)
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      // Fallback if profile not readable due to RLS
      const resolvedProfile = profile || {
        role: 'user',
        email: user.email,
        first_name: user.user_metadata?.first_name || null,
      }
      setProfile(resolvedProfile)
      // Load user's diagnoses
      await loadDiagnoses(user.id)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }
  const loadDiagnoses = async (userId) => {
    try {
      setDiagError('')
      // Load latest 10 for the Recent Analyses list
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        setDiagnoses([])
        setStats({ total: 0, pending: 0, completed: 0, failed: 0 })
        setDiagError(error.message || 'Failed to load recent diagnoses')
        return
      }

      setDiagnoses(data || [])

      // Fetch accurate counters (not limited by 10)
      const [totalQ, pendingQ, completedQ, failedQ] = await Promise.all([
        supabase.from('diagnoses').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('diagnoses').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
        supabase.from('diagnoses').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
        supabase.from('diagnoses').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'failed'),
      ])

      if (totalQ.error || pendingQ.error || completedQ.error || failedQ.error) {
        setStats({ total: 0, pending: 0, completed: 0, failed: 0 })
        const msg = totalQ.error?.message || pendingQ.error?.message || completedQ.error?.message || failedQ.error?.message || 'Failed to load diagnosis counts'
        setDiagError(msg)
        return
      }

      setStats({
        total: totalQ.count || 0,
        pending: pendingQ.count || 0,
        completed: completedQ.count || 0,
        failed: failedQ.count || 0,
      })
    } catch (error) {
      console.error('Error loading diagnoses:', error)
      setDiagError(error?.message || 'Unknown error loading diagnoses')
    }
}

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setShowPrediction(false)
      setPrediction(null)
    }
  }

  const handlePatientDetailsChange = (event) => {
    const { name, value } = event.target
    setPatientDetails(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      // Get current session for authentication with refresh
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          throw new Error('Authentication failed. Please sign in again.')
        }
        if (!refreshedSession) {
          throw new Error('No active session')
        }
        session = refreshedSession
      }
      if (!session) {
        throw new Error('No active session')
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Send file to AI backend
      const response = await fetch('http://localhost:8000/api/ai/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      setPrediction(result)
      setShowPrediction(true)

      // Save diagnosis to database
      await saveDiagnosis(result)

    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const saveDiagnosis = async (result) => {
    try {
      const { error } = await supabase
        .from('diagnoses')
        .insert({
          user_id: user.id,
          image_path: selectedFile.name, // Changed from image_name to image_path
          predictions: result,
          status: 'completed'
        })

      if (error) throw error

      // Reload diagnoses to update stats
      await loadDiagnoses(user.id)
    } catch (error) {
      console.error('Error saving diagnosis:', JSON.stringify(error, null, 2))
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const buildReportHtml = (imgUrl) => {
    const preds = (prediction?.predictions || []).map(p => `<tr><td style="padding:8px;border:1px solid #e5e7eb;">${p.label}</td><td style="padding:8px;border:1px solid #e5e7eb;">${(p.confidence*100).toFixed(1)}%</td></tr>`).join('');
    const date = new Date().toLocaleString();
    const heatmapHtml = prediction.heatmap ? `<div class="section">
          <h2 style="font-size:18px;margin:0 0 6px 0">Heatmap</h2>
          <img src="data:image/jpeg;base64,${prediction.heatmap}" alt="Heatmap" />
        </div>` : '';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Clarix Report</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#111827;}
        .container{max-width:800px;margin:24px auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px}
        h1{font-size:24px;margin:0 0 8px 0}
        .muted{color:#6b7280}
        .section{margin-top:16px}
        img{max-width:100%;border:1px solid #e5e7eb;border-radius:8px}
        table{border-collapse:collapse;width:100%;margin-top:8px}
        .disclaimer{margin-top:24px;padding:12px;background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#991b1b;}
      </style>
    </head><body>
      <div class="container">
        <h1>Patient Analysis Report</h1>
        <div class="muted">Generated: ${date}</div>
        <div class="section">
          <h2 style="font-size:18px;margin:0 0 6px 0">Patient Info</h2>
          <div>Name: ${patientDetails.name}</div>
          <div>Age: ${patientDetails.age}</div>
          <div>Sex: ${patientDetails.sex}</div>
          <div>Date: ${patientDetails.date}</div>
          <div>Time: ${patientDetails.time}</div>
        </div>
        <div class="section">
          <h2 style="font-size:18px;margin:0 0 6px 0">Uploaded Image</h2>
          ${imgUrl ? `<img src="${imgUrl}" alt="Uploaded image" />` : '<div class="muted">Image preview unavailable</div>'}
        </div>
        ${heatmapHtml}
        <div class="section">
          <h2 style="font-size:18px;margin:0 0 6px 0">AI Analysis Results</h2>
          ${preds ? `<table><thead><tr><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f9fafb">Finding</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f9fafb">Confidence</th></tr></thead><tbody>${preds}</tbody></table>` : '<div class="muted">No predictions available</div>'}
        </div>
        <div class="disclaimer">
          <strong>Disclaimer:</strong> The report is AI generated, please consult with the doctors for safety reasons.
        </div>
      </div>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
    </body></html>`;
  }

  const generateReport = () => {
    if (!prediction) {
      alert('Run an analysis first to generate a report.');
      return;
    }
    const imgUrl = selectedFile ? URL.createObjectURL(selectedFile) : '';
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(buildReportHtml(imgUrl));
      w.document.close();
      w.focus();
    } else {
      alert('Popup blocked. Please allow popups for this site to generate the report.');
    }
  }

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-analysis':
        document.getElementById('file-input').click()
        break
      case 'view-reports':
        router.push('/dashboard/reports')
        break
      case 'ask-ai':
        router.push('/ask-ai')
        break
      case 'settings':
        router.push('/settings')
        break
      default:
        break
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Clarix</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {profile?.role === 'doctor' ? 'Doctor' : 
                 profile?.role === 'super_admin' ? 'Super Admin' : 'User'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{profile?.email || user?.email}</span>
              {/* Messages button */}
              <button
                onClick={() => {
                  if (profile?.role === 'doctor') router.push('/doctor/messages')
                  else router.push('/messages')
                }}
                title={profile?.role === 'doctor' ? 'Doctor Inbox' : 'Messages'}
                className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </button>
              {profile?.role === 'super_admin' && (
                <button 
                  onClick={() => router.push('/admin')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Admin Panel
                </button>
              )}
              <button 
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        {diagError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">{diagError}</div>
        )}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.first_name || 'User'}!
          </h2>
          <p className="text-blue-100 text-lg">
            Upload medical images to get AI-powered diagnostic insights instantly.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">New Analysis</h3>
              
              {/* Patient Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Patient Name"
                  value={patientDetails.name}
                  onChange={handlePatientDetailsChange}
                  className="p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  name="age"
                  placeholder="Patient Age"
                  value={patientDetails.age}
                  onChange={handlePatientDetailsChange}
                  className="p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="sex"
                  placeholder="Patient Sex"
                  value={patientDetails.sex}
                  onChange={handlePatientDetailsChange}
                  className="p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  name="date"
                  placeholder="Date"
                  value={patientDetails.date}
                  onChange={handlePatientDetailsChange}
                  className="p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="time"
                  name="time"
                  placeholder="Time"
                  value={patientDetails.time}
                  onChange={handlePatientDetailsChange}
                  className="p-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Hidden file input */}
              <input
                id="file-input"
                type="file"
                accept=".dicom,.dcm,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              <div 
                onClick={() => document.getElementById('file-input').click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
              >
                {selectedFile ? (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg text-gray-900 mb-2">File Selected: {selectedFile.name}</p>
                    <p className="text-sm text-gray-500 mb-4">Ready for AI analysis</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleFileUpload(); }}
                      disabled={uploading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {uploading ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-lg text-gray-600 mb-2">Upload X-ray or MRI Image</p>
                    <p className="text-sm text-gray-500 mb-4">Supports DICOM, JPG, PNG formats up to 10MB</p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Choose File
                    </button>
                  </>
                )}
              </div>

              {/* AI Prediction Results */}
              {showPrediction && prediction && (
                <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">AI Analysis Results</h4>
                  <div className="space-y-2">
                    {prediction.predictions && prediction.predictions.map((pred, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-medium text-gray-900">{pred.label}</span>
                        <span className="text-blue-600 font-semibold">{(pred.confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-blue-700 mt-3">
                    Analysis completed successfully! Results have been saved to your history.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>✓ HIPAA Compliant</span>
                  <span>✓ End-to-end Encrypted</span>
                  <span>✓ AI-Powered Analysis</span>
                </div>
                <button
                  onClick={generateReport}
                  disabled={!prediction}
                  className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
                  title={prediction ? 'Generate printable report' : 'Run an analysis first'}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h3>
            <div className="space-y-4">
              {diagnoses.length > 0 ? (
                diagnoses.slice(0, 5).map((diagnosis) => (
                  <div key={diagnosis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Analysis #{diagnosis.id.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(diagnosis.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      diagnosis.status === 'completed' ? 'bg-green-100 text-green-800' :
                      diagnosis.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      diagnosis.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {diagnosis.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No analyses yet</p>
                  <p className="text-xs text-gray-400 mt-1">Upload your first image to get started</p>
                </div>
              )}
            </div>
            {diagnoses.length > 5 && (
              <button
                onClick={() => router.push('/dashboard/analyses')}
                className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
              >
                View All Analyses
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => handleQuickAction('new-analysis')}
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left cursor-pointer"
            >
              <div className="p-2 bg-blue-600 rounded-lg mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">New Analysis</p>
                <p className="text-sm text-gray-600">Upload image</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction('view-reports')}
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left cursor-pointer"
            >
              <div className="p-2 bg-green-600 rounded-lg mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Reports</p>
                <p className="text-sm text-gray-600">All analyses</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction('ask-ai')}
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left cursor-pointer"
            >
              <div className="p-2 bg-purple-600 rounded-lg mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Ask AI</p>
                <p className="text-sm text-gray-600">Get insights</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction('settings')}
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
            >
              <div className="p-2 bg-gray-600 rounded-lg mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Settings</p>
                <p className="text-sm text-gray-600">Preferences</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
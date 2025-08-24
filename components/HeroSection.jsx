'use client'

import Link from 'next/link';
import { useCTA } from '../hooks/useCTA';

export default function HeroSection() {
  const { user, loading, handleGetStarted, handleBookDemo } = useCTA();

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Main heading */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-4 font-satoshi font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Clarity in every scan.
            </span>
          </h1>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 font-satoshi font-bold ">
            Powered by AI
          </h2>
        </div>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          Upload X-ray and MRI images to get AI-based diagnosis, view explainable heatmaps, 
          and generate structured radiology reports instantly. Revolutionizing medical imaging 
          with advanced artificial intelligence.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 font-satoshi font-bold">
          <button 
            onClick={handleGetStarted}
            disabled={loading}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                user ? 'Go to Dashboard →' : 'Get Started →'
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <button 
            onClick={handleBookDemo}
            disabled={loading}
            className="px-8 py-4 bg-transparent text-blue-600 font-semibold border-2 border-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-satoshi"
          >
            {user ? 'Book Demo' : 'Book Demo →'}
          </button>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
            <p className="text-gray-600 text-sm">Advanced algorithms detect conditions with high accuracy</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Visual Insights</h3>
            <p className="text-gray-600 text-sm">Explainable heatmaps show areas of concern</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Reports</h3>
            <p className="text-gray-600 text-sm">Auto-generated structured radiology reports</p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Trusted by medical professionals worldwide</p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">AI-Powered</div>
            <div className="text-2xl font-bold text-gray-400">HIPAA Ready</div>
            <div className="text-2xl font-bold text-gray-400">24/7 Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client'

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCTA } from '../hooks/useCTA';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { user, handleContactUs, handleBookDemo } = useCTA();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || subscribing) return;
    
    setSubscribing(true);
    
    try {
      // Simulate subscription (in a real app, you'd call your newsletter API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4 text-green-400">clarix</h3>
            <p className="text-gray-300 mb-6 max-w-sm">
              Advanced AI-powered medical imaging analysis platform designed to enhance 
              diagnostic accuracy and streamline radiology workflows.
            </p>
            <div className="flex space-x-2">
              <button 
                onClick={handleContactUs}
                suppressHydrationWarning={true}
                className="bg-transparent border border-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm"
              >
                Contact Sales
              </button>
              <button 
                onClick={handleBookDemo}
                suppressHydrationWarning={true}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
              >
                Book Demo
              </button>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/documentation" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
              <li><Link href="/integrations" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/news" className="text-gray-400 hover:text-white transition-colors">News</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link href="/community" className="text-gray-400 hover:text-white transition-colors">Community</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 pt-8 mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">Stay updated</h4>
              <p className="text-gray-400 text-sm">Get the latest news and updates about Clarix</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                required
                disabled={subscribing || subscribed}
                suppressHydrationWarning={true}
                className="bg-gray-800 border border-gray-700 rounded-l-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 flex-1 md:w-64 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={subscribing || subscribed || !email}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-r-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ...
                  </div>
                ) : subscribed ? (
                  '✓ Subscribed'
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Clarix. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

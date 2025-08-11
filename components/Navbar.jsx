'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profile);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-satoshi font-bold text-3xl text-gray-800">
          <Link href="/">
            clarix
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6 font-poppins font-medium">
          <Link href="/features" className="text-gray-600 hover:text-blue-500">Features</Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-blue-500">How it works</Link>
          <Link href="/contact" className="text-gray-600 hover:text-blue-500">Contact</Link>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                {profile?.email} ({profile?.role})
              </span>
              <Link 
                href="/dashboard"
                className="text-blue-600 hover:text-blue-700 font-medium py-2 px-4 border border-blue-600 rounded-lg hover:bg-blue-50 transition duration-300"
              >
                Dashboard
              </Link>
              {profile?.role === 'super_admin' && (
                <Link 
                  href="/admin"
                  className="text-purple-600 hover:text-purple-700 font-medium py-2 px-4 border border-purple-600 rounded-lg hover:bg-purple-50 transition duration-300"
                >
                  Admin
                </Link>
              )}
              <button 
                onClick={handleSignOut}
                className="bg-red-500 text-white font-medium py-1.5 px-3 text-sm rounded-md hover:bg-red-600 transition duration-300"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link 
              href="/auth"
              className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

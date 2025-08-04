import React from 'react';
import Link from 'next/link';

const Navbar = () => {
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
        <div>
          <button className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition duration-300">
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

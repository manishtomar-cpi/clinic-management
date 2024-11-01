// src/app/components/Common/Navbar.js

"use client";

import React from "react";
import Link from "next/link";
import { FaClinicMedical } from "react-icons/fa";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-primary to-secondary shadow-lg fixed w-full z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" legacyBehavior>
          <a className="flex items-center space-x-2">
            <FaClinicMedical className="text-accent text-3xl" />
            <span className="text-white text-2xl font-bold">ClinicEase</span>
          </a>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" legacyBehavior>
            <a className="text-white hover:text-accent transition-colors">Home</a>
          </Link>
          <Link href="/user-guide" legacyBehavior>
            <a className="text-white hover:text-accent transition-colors">User Guide</a>
          </Link>
          <Link href="/features" legacyBehavior>
            <a className="text-white hover:text-accent transition-colors">Features</a>
          </Link>
          <Link href="/contact" legacyBehavior>
            <a className="text-white hover:text-accent transition-colors">Contact</a>
          </Link>
        </div>

        {/* Authentication Buttons */}
        <div className="hidden md:flex space-x-4">
          <Link href="/login" legacyBehavior>
            <a className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">Login</a>
          </Link>
          <Link href="/signup" legacyBehavior>
            <a className="bg-accent text-primary px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors">Sign Up</a>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          {/* Implement mobile menu toggle if needed */}
          <button className="text-white focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

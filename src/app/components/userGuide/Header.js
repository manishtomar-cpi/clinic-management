// src/app/components/userGuide/Header.js

"use client";

import React from 'react';
import { FaHome, FaHeartbeat } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const Header = () => {
  const router = useRouter();

  const handleBackHomeClick = () => {
    router.push('/');
  };

  return (
    <header className="bg-gradient-to-r from-teal-500 via-green-500 to-blue-500 text-white py-6 shadow-lg">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Back to Home */}
        <motion.div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleBackHomeClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaHome className="text-3xl" />
          <span className="text-xl font-semibold">Back to Home</span>
        </motion.div>

        {/* Title */}
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <FaHeartbeat className="text-4xl animate-pulse" />
          <span className="text-3xl font-bold">ClinicEase User Guide</span>
        </motion.div>

        {/* Placeholder for alignment */}
        <div></div>
      </div>
    </header>
  );
};

export default Header;

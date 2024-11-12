// File: src/components/PatientSidebar.jsx

'use client';

import React, { useState } from 'react';
import {
  FaHome,
  FaHeart,
  FaSignOutAlt,
} from 'react-icons/fa';
import { FiMenu, FiX, FiMessageSquare } from 'react-icons/fi';
import { signOut } from 'next-auth/react';
import { showToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

const PatientSidebar = ({ selectedMenuItem, onMenuItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      icon: <FaHome color="#FF6347" />,
      key: 'dashboard',
    },
    {
      name: 'Chat with Doctor',
      icon: <FiMessageSquare color="#1E90FF" />,
      key: 'chat',
    },
  ];

  const handleMenuItemClick = (key) => {
    setIsOpen(false);
    if (onMenuItemClick) {
      onMenuItemClick(key);
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out without redirecting
      await signOut({ redirect: false });
      router.push('/patient-login'); // Manually redirect
      showToast('You have successfully logged out!', 'success');
    } catch (error) {
      console.error('Logout Error:', error);
      showToast('Error logging out. Please try again.', 'error');
    }
  };

  return (
    <>
      {/* Mobile Navbar */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 shadow w-full fixed top-0 z-50">
        <h1 className={`text-xl font-bold text-indigo-600 ${isOpen ? 'hidden' : 'block'}`}>
          ClinicEase
        </h1>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40">
        {/* Sidebar Header */}
        <div className="flex items-center justify-start h-20 bg-gradient-to-r from-pink-500 to-purple-600 pl-4">
          <FaHeart size={32} color="white" />
          <span className="ml-2 text-white text-xl font-bold">ClinicEase</span>
        </div>
        {/* Sidebar Menu */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleMenuItemClick(item.key)}
              className={`flex items-center p-2 text-base font-medium rounded-lg transition-colors w-full ${
                selectedMenuItem === item.key
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="ml-3">{item.name}</span>
            </motion.button>
          ))}
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            className="flex items-center p-2 text-base font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white transition-colors w-full mt-4"
            whileHover={{ scale: 1.05 }}
          >
            <FaSignOutAlt size={20} color="#FF4500" />
            <span className="ml-3">Logout</span>
          </motion.button>
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-start h-20 bg-gradient-to-r from-pink-500 to-purple-600 pl-4">
                <FaHeart size={32} color="white" />
                <span className="ml-2 text-white text-xl font-bold">ClinicEase</span>
              </div>
              {/* Sidebar Menu */}
              <nav className="flex-1 px-2 py-4 space-y-1">
                {menuItems.map((item, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleMenuItemClick(item.key)}
                    className={`flex items-center p-2 text-base font-medium rounded-lg transition-colors w-full ${
                      selectedMenuItem === item.key
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="ml-3">{item.name}</span>
                  </motion.button>
                ))}
                {/* Logout Button */}
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center p-2 text-base font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white transition-colors w-full mt-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <FaSignOutAlt size={20} color="#FF4500" />
                  <span className="ml-3">Logout</span>
                </motion.button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PatientSidebar;

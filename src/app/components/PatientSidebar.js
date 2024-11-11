// PatientSidebar.jsx
'use client';

import React, { useState } from 'react';
import {
  FaHome,
  FaCalendarCheck,
  FaHeart,
  FaSignOutAlt,
} from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { showToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

const PatientSidebar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      icon: <FaHome color="#FF6347" />,
      component: 'Dashboard',
    },
    {
      name: 'My Appointments',
      icon: <FaCalendarCheck color="#32CD32" />,
      component: 'MyAppointments',
    },
    {
      name: 'Health Records',
      icon: <FaHeart color="#1E90FF" />,
      component: 'HealthRecords',
    },
  ];

  const handleMenuItemClick = (component) => {
    setIsOpen(false);
    if (component === 'Logout') {
      handleLogout();
    } else {
      router.push(`/patient-dashboard/${component.toLowerCase()}`);
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
      <div className="md:hidden flex items-center justify-between bg-white p-4 shadow w-full fixed top-0 z-40">
        <h1 className="text-xl font-bold text-indigo-600">ClinicEase</h1>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30">
        <div className="flex items-center justify-center h-20 bg-gradient-to-r from-pink-500 to-purple-600">
          <FaHeart size={32} color="white" />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleMenuItemClick(item.component)}
              className="flex items-center p-2 text-base font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white transition-colors w-full focus:outline-none"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="ml-3">{item.name}</span>
            </motion.button>
          ))}
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            className="flex items-center p-2 text-base font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white transition-colors w-full mt-4 focus:outline-none"
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
            className="md:hidden fixed inset-0 bg-white z-30 transform transition-transform duration-200 ease-in-out"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-center h-20 bg-gradient-to-r from-pink-500 to-purple-600">
                <FaHeart size={32} color="white" />
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1">
                {menuItems.map((item, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleMenuItemClick(item.component)}
                    className="flex items-center p-2 text-base font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white transition-colors w-full focus:outline-none"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="ml-3">{item.name}</span>
                  </motion.button>
                ))}
                {/* Logout Button */}
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center p-2 text-base font-medium text-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white transition-colors w-full mt-4 focus:outline-none"
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

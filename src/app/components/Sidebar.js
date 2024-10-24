// src/components/Sidebar.js

import React, { useState } from 'react';
import {
  FaUserPlus,
  FaSearch,
  FaUserEdit,
  FaMoneyBillAlt,
  FaHome,
  FaChartBar,
  FaCalendarPlus,
  FaCalendarCheck,
} from 'react-icons/fa';
import { FiCalendar, FiAlertCircle, FiClipboard } from 'react-icons/fi';

const Sidebar = ({ onMenuItemClick, activeItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      component: 'Dashboard',
      icon: <FaChartBar className="text-indigo-500" />,
    },
    {
      name: 'Ongoing Patients',
      component: 'OngoingPatients',
      icon: <FiClipboard className="text-blue-500" />,
    },
    {
      name: 'Appointments Today',
      component: 'AppointmentsToday',
      icon: <FiCalendar className="text-green-500" />,
    },
    {
      name: 'Appointments This Week',
      component: 'AppointmentsThisWeek',
      icon: <FaCalendarCheck className="text-purple-500" />,
    },
    {
      name: 'Missed Appointments',
      component: 'MissedAppointments',
      icon: <FiAlertCircle className="text-red-500" />,
    },
    {
      name: 'Add Patient',
      component: 'AddPatient',
      icon: <FaUserPlus className="text-red-500" />,
    },
    {
      name: 'Add Visit',
      component: 'AddVisit',
      icon: <FaCalendarPlus className="text-sky-500" />,
    },
    {
      name: 'Search Patient',
      component: 'SearchPatient',
      icon: <FaSearch className="text-blue-500" />,
    },
    {
      name: 'Update Profile',
      component: 'UpdateProfile',
      icon: <FaUserEdit className="text-green-500" />,
    },
    {
      name: 'Patients with Balance',
      component: 'PatientBalance',
      icon: <FaMoneyBillAlt className="text-yellow-500" />,
    },
  ];

  return (
    <>
      {/* Mobile Navbar */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 shadow w-full fixed top-0 z-40">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button onClick={() => setIsOpen(!isOpen)}>
          <svg
            className="h-6 w-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`bg-white text-gray-800 w-64 space-y-2 py-7 px-2 absolute inset-y-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition duration-200 ease-in-out shadow-lg z-50`}
        style={{ flexShrink: 0 }}
      >
        <nav className="flex flex-col h-full">
          {/* Remove the extra close button here */}
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                onMenuItemClick(item.component);
                setIsOpen(false);
              }}
              className={`flex items-center w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200 ${
                activeItem === item.component
                  ? 'bg-gradient-to-r from-blue-500 to-teal-400 text-white'
                  : ''
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </button>
          ))}

          {/* Home and Logout Buttons */}
          <div className="mt-auto">
            <button
              onClick={() => {
                onMenuItemClick('Home');
                setIsOpen(false);
              }}
              className={`flex items-center w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200 ${
                activeItem === 'Home'
                  ? 'bg-gradient-to-r from-blue-500 to-teal-400 text-white'
                  : ''
              }`}
            >
              <FaHome className="text-blue-500" />
              <span className="ml-3">Home</span>
            </button>

            <button
              onClick={() => {
                onMenuItemClick('Logout');
                setIsOpen(false);
              }}
              className="flex items-center w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200 mt-2"
            >
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7"
                />
              </svg>
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;

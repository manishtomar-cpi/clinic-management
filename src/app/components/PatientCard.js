// src/app/components/PatientCard.js

import React from 'react';
import { motion } from 'framer-motion';
import {
  FaMobileAlt,
  FaMapMarkerAlt,
  FaEnvelope,
  FaClinicMedical,
  FaCalendarAlt,
  FaArrowRight,
} from 'react-icons/fa';

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return 'N/A';
  const [day, month, year] = dateStr.split('-').map(Number);
  return `${day}-${month}-${year}`;
};

const PatientCard = ({ patient }) => {
  const {
    name,
    address,
    mobileNumber,
    email,
    treatmentStatus,
    lastVisit,
    nextVisit,
  } = patient;

  // Determine color based on treatment status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'ongoing':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'on hold':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-1 rounded-lg shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-lg p-6 relative h-full flex flex-col">
        {/* Treatment Status Badge */}
        <span
          className={`absolute top-4 right-4 px-3 py-1 text-xs font-semibold text-white rounded-full ${getStatusColor(
            treatmentStatus
          )}`}
        >
          {treatmentStatus}
        </span>

        {/* Patient Name */}
        <h3 className="text-2xl font-bold text-purple-700 mb-4">{name}</h3>

        {/* Patient Information */}
        <div className="flex-1">
          {/* Address */}
          <div className="flex items-center mb-3">
            <FaMapMarkerAlt className="text-purple-500 mr-2" />
            <span className="text-gray-700">{address}</span>
          </div>

          {/* Mobile Number */}
          <div className="flex items-center mb-3">
            <FaMobileAlt className="text-purple-500 mr-2" />
            <span className="text-gray-700">{mobileNumber}</span>
          </div>

          {/* Email */}
          <div className="flex items-center mb-3">
            <FaEnvelope className="text-purple-500 mr-2" />
            <span className="text-gray-700">{email}</span>
          </div>

          {/* Last Visit */}
          <div className="flex items-center mb-3">
            <FaCalendarAlt className="text-purple-500 mr-2" />
            <span className="text-gray-700">
              <strong>Last Visit:</strong>{' '}
              {lastVisit
                ? `${formatDateForDisplay(lastVisit.date)} at ${lastVisit.time}`
                : 'N/A'}
            </span>
          </div>

          {/* Last Visit Status */}
          {lastVisit && (
            <div className="flex items-center mb-3">
              <FaArrowRight className="text-purple-500 mr-2" />
              <span className="text-gray-700">
                <strong>Last Visit Status:</strong> {lastVisit.status}
              </span>
            </div>
          )}

          {/* Next Visit */}
          <div className="flex items-center mb-3">
            <FaCalendarAlt className="text-purple-500 mr-2" />
            <span className="text-gray-700">
              <strong>Next Visit:</strong>{' '}
              {nextVisit
                ? `${formatDateForDisplay(nextVisit.date)} at ${nextVisit.time}`
                : 'N/A'}
            </span>
          </div>

          {/* Next Visit Status */}
          {nextVisit && (
            <div className="flex items-center">
              <FaArrowRight className="text-purple-500 mr-2" />
              <span className="text-gray-700">
                <strong>Next Visit Status:</strong> {nextVisit.status}
              </span>
            </div>
          )}
        </div>

        {/* Optional: Action Buttons */}
        {/* Uncomment and customize if you have actions like Edit/Delete */}
        {/* <div className="mt-4 flex space-x-2">
          <button className="flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
            Edit
          </button>
          <button className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div> */}
      </div>
    </motion.div>
  );
};

export default PatientCard;

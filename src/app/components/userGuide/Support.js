// src/app/components/userGuide/Support.js

"use client";

import React from 'react';
import { FaEnvelope, FaPhone, FaComments } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Support = () => {
  return (
    <section id="support" className="mb-16 bg-gradient-to-r from-purple-50 to-purple-100 py-12 rounded-lg shadow-inner">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <FaComments className="text-4xl text-purple-500 mr-4" />
          <h2 className="text-3xl font-semibold text-purple-700">Support and Contact Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email Support */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaEnvelope className="text-3xl text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Reach out to us anytime via email.</p>
            <a href="mailto:support@clinicapp.com" className="text-teal-500 hover:underline">
              {/* support@clinicapp.com */}
            </a>
          </motion.div>
          {/* Phone Support */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPhone className="text-3xl text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Call us for immediate assistance.</p>
            <a href="tel:+18001234567" className="text-teal-500 hover:underline">
              {/* +1 (800) 123-4567 */}
            </a>
          </motion.div>
          {/* Live Chat Support */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaComments className="text-3xl text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat with us in real-time during business hours.</p>
            {/* <button className="bg-teal-500 text-white py-2 px-4 rounded-full hover:bg-teal-600 transition-colors">
              Start Chat
            </button> */}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Support;

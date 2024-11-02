// src/app/components/Home/HowItWorksSection.js

"use client";

import React from "react";
import {
  FaSignInAlt,
  FaTachometerAlt,
  FaClipboardList,
  FaUserCheck,
  FaLock,
} from "react-icons/fa";
import { motion } from "framer-motion";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: <FaSignInAlt className="text-teal-500 text-5xl mb-4" />,
      title: "Sign Up / Login",
      description:
        "Create an account or log in to access your personalized dashboard.",
    },
    {
      icon: <FaTachometerAlt className="text-green-500 text-5xl mb-4" />,
      title: "Access Dashboard",
      description:
        "View your clinic's performance metrics and manage operations efficiently.",
    },
    {
      icon: <FaClipboardList className="text-blue-500 text-5xl mb-4" />,
      title: "Manage Appointments",
      description:
        "Schedule, view, and organize appointments to streamline patient flow.",
    },
    {
      icon: <FaUserCheck className="text-indigo-500 text-5xl mb-4" />,
      title: "Update Records",
      description:
        "Maintain up-to-date patient records with comprehensive details and treatment plans.",
    },
    {
      icon: <FaLock className="text-red-500 text-5xl mb-4" />,
      title: "Secure Data",
      description:
        "Ensure all patient and clinic data is encrypted and securely stored.",
    },
  ];

  return (
    <section className="bg-gradient-to-r from-purple-50 to-purple-100 py-12 rounded-lg shadow-inner overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center text-teal-700 mb-12"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 border-l-2 border-teal-300 z-0"></div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`flex flex-col md:flex-row items-center ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
                initial={{
                  opacity: 0,
                  x: index % 2 === 0 ? -100 : 100,
                }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                {/* Icon Container */}
                <div className="w-full md:w-1/2 flex justify-center relative z-10">
                  <div className="bg-white p-4 rounded-full shadow-lg">
                    {step.icon}
                  </div>
                </div>

                {/* Connector (Only visible on medium and larger screens) */}
                <div className="hidden md:block w-1/2 px-4">
                  <div className="h-full flex items-center">
                    <div className="w-full border-t border-teal-300"></div>
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2 mt-4 md:mt-0 relative z-10">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-2xl font-semibold text-teal-700 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

// src/app/components/Home/HeroSection.js

"use client";

import React from "react";
import {
  FaClinicMedical,
  FaHeartbeat,
  FaStethoscope,
  FaArrowRight,
} from "react-icons/fa";
import { motion } from "framer-motion";

const HeroSection = ({
  handleUserGuideClick,
  handleSignupClick,
  handleLoginClick,
  status,
}) => {
  return (
    <section className="relative bg-gradient-to-br from-teal-500 to-blue-600 text-white overflow-hidden">
      <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col-reverse md:flex-row items-center">
        {/* Text Content */}
        <div className="md:w-1/2">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Welcome to <span className="text-yellow-300">ClinicEase</span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            A comprehensive solution for doctors to streamline clinic operations and enhance patient care.
          </motion.p>
          {/* Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <button
              onClick={handleUserGuideClick}
              className="flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-gray-800 py-3 px-6 rounded-lg text-lg font-medium transition duration-300 shadow-lg transform hover:scale-105"
            >
              <FaArrowRight className="mr-2" />
              User Guide
            </button>
            <button
              onClick={handleSignupClick}
              className="flex items-center justify-center bg-white hover:bg-gray-100 text-teal-600 py-3 px-6 rounded-lg text-lg font-medium transition duration-300 shadow-lg transform hover:scale-105"
            >
              Get Started
            </button>
            <button
              onClick={handleLoginClick}
              className="flex items-center justify-center border border-white hover:bg-white hover:text-teal-600 text-lg font-medium py-3 px-6 rounded-lg transition duration-300 shadow-lg transform hover:scale-105"
            >
              {status === "authenticated" ? "Dashboard" : "Login"}
            </button>
          </motion.div>
        </div>
        {/* Image or Illustration */}
        <div className="md:w-1/2 flex justify-center md:justify-end mb-10 md:mb-0">
          <motion.div
            className="relative"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <FaClinicMedical className="text-white text-9xl" />
            {/* Decorative Medical Icons */}
            <FaHeartbeat className="absolute top-0 left-0 text-red-500 text-4xl animate-pulse" />
            <FaStethoscope className="absolute bottom-0 right-0 text-green-500 text-4xl animate-pulse" />
          </motion.div>
        </div>
      </div>
      {/* Decorative Background Circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob md:w-48 md:h-48"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 md:w-48 md:h-48"></div>
      <style jsx>{`
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes blob {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .absolute.top-10.left-10 {
            width: 24px;
            height: 24px;
          }
          .absolute.bottom-20.right-10 {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;

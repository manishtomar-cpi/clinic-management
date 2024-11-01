// src/app/components/Common/Footer.js

"use client";

import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaClinicMedical,
} from "react-icons/fa";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-r from-teal-500 to-blue-600 text-white py-8 overflow-hidden">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        {/* Logo or Brand Name */}
        <div className="flex items-center mb-4 md:mb-0">
          <FaClinicMedical className="text-yellow-300 text-3xl mr-2" />
          <span className="text-xl font-bold">ClinicEase</span>
        </div>
        {/* Links */}
        <div className="flex space-x-6 mb-4 md:mb-0">
          <a href="#features" className="hover:text-yellow-300 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-yellow-300 transition-colors">
            How It Works
          </a>
          <a href="#user-guide" className="hover:text-yellow-300 transition-colors">
            User Guide
          </a>
          <a href="#contact" className="hover:text-yellow-300 transition-colors">
            Contact
          </a>
        </div>
        {/* Social Icons */}
        <div className="flex space-x-4">
          <motion.a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-yellow-300 transition-colors"
            whileHover={{ scale: 1.2 }}
          >
            <FaFacebookF />
          </motion.a>
          <motion.a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-yellow-300 transition-colors"
            whileHover={{ scale: 1.2 }}
          >
            <FaTwitter />
          </motion.a>
          <motion.a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-yellow-300 transition-colors"
            whileHover={{ scale: 1.2 }}
          >
            <FaLinkedinIn />
          </motion.a>
          <motion.a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-yellow-300 transition-colors"
            whileHover={{ scale: 1.2 }}
          >
            <FaInstagram />
          </motion.a>
        </div>
      </div>

      {/* Decorative Background Circles */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob md:w-32 md:h-32"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 md:w-32 md:h-32"></div>

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
          .absolute.top-0.left-0,
          .absolute.bottom-0.right-0 {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

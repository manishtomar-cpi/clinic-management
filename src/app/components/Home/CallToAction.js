// src/app/components/Home/CallToAction.js

"use client";

import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

const CallToAction = ({ handleSignupClick, status }) => {
  return (
    <section className="relative bg-gradient-to-br from-teal-500 to-teal-700 text-white py-16 rounded-lg shadow-2xl overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob md:w-32 md:h-32"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 md:w-32 md:h-32"></div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h2
          className="text-4xl md:text-5xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Ready to Transform Your Clinic?
        </motion.h2>
        <motion.p
          className="text-lg md:text-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Sign up today and take the first step towards a more efficient practice.
        </motion.p>
        <motion.button
          onClick={handleSignupClick}
          className="flex items-center justify-center bg-white text-teal-700 py-3 px-8 rounded-full text-lg font-medium shadow-lg hover:bg-gray-100 transition duration-300"
          whileHover={{ scale: 1.05, backgroundColor: "#f0fdfa" }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started Now <FaArrowRight className="ml-2" />
        </motion.button>
      </div>

      {/* Animation Styles */}
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
    </section>
  );
};

export default CallToAction;

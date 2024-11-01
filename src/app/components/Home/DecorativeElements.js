// src/app/components/Home/DecorativeElements.js

"use client";

import React from "react";
import { motion } from "framer-motion";

const DecorativeElements = () => {
  return (
    <>
      {/* Floating Medical Icons */}
      <motion.div
        className="absolute top-5 left-5 text-purple-200 text-3xl animate-bounce"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {/* Cross Icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v8m4-4H8"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-5 right-5 text-blue-200 text-3xl animate-bounce"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {/* Heartbeat Icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 13.5V6a2 2 0 012-2h3.28a2 2 0 011.964 1.75L10 6l.342 2.997A2 2 0 0112.28 10H16a2 2 0 012 2v7.5M9 21h6"
          />
        </svg>
      </motion.div>

      {/* Additional Decorative Elements (Optional) */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-200 text-3xl animate-bounce"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {/* Medical Kit Icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v12m6-6H6"
          />
        </svg>
      </motion.div>
    </>
  );
};

export default DecorativeElements;

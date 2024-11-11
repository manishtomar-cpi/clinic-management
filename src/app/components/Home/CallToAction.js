// src/app/components/Home/CallToAction.js

"use client";

import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import Cloud from "./Cloud"; // Ensure correct import path

const CallToAction = ({ handleSignupClick, status }) => {
  const shouldReduceMotion = useReducedMotion();

  // Variants for the container
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  // Variants for the heading
  const headingVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  // Variants for the paragraph
  const paragraphVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.3, ease: "easeOut" } },
  };

  // Variants for the button
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, delay: 0.6, ease: "easeOut" } },
    hover: {
      scale: 1.05,
      boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
      transition: {
        duration: 0.3,
      },
    },
    tap: { scale: 0.95 },
  };

  // Cloud animation variants
  const cloudVariants = {
    float: {
      y: [0, -10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    drift: {
      x: ["-100%", "100%"],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  return (
    <section className="relative bg-gradient-to-br from-teal-500 to-teal-700 text-white py-16 rounded-lg shadow-2xl overflow-hidden">
      {/* Decorative Clouds */}
      {!shouldReduceMotion && (
        <>
          {/* Cloud 1 */}
          <Cloud
            className="absolute top-5 left-[-10%] w-24 h-16 opacity-30 z-0"
            gradientId="cloudGradient1"
            variants={cloudVariants}
            initial="float"
            animate="float"
            transition={{
              y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            }}
          />

          {/* Cloud 2 */}
          <Cloud
            className="absolute top-20 right-[-15%] w-32 h-20 opacity-40 z-0"
            gradientId="cloudGradient2"
            variants={cloudVariants}
            initial="float"
            animate="float"
            transition={{
              y: { repeat: Infinity, duration: 8, ease: "easeInOut" },
              x: { repeat: Infinity, duration: 20, ease: "linear" },
            }}
          />

          {/* Cloud 3 */}
          <Cloud
            className="absolute bottom-10 left-[-20%] w-28 h-18 opacity-25 z-0"
            gradientId="cloudGradient3"
            variants={cloudVariants}
            initial="float"
            animate="float"
            transition={{
              y: { repeat: Infinity, duration: 7, ease: "easeInOut" },
              x: { repeat: Infinity, duration: 25, ease: "linear" },
            }}
          />

          {/* Cloud 4 */}
          <Cloud
            className="absolute bottom-5 right-[-25%] w-20 h-14 opacity-35 z-0"
            gradientId="cloudGradient4"
            variants={cloudVariants}
            initial="float"
            animate="float"
            transition={{
              y: { repeat: Infinity, duration: 5, ease: "easeInOut" },
              x: { repeat: Infinity, duration: 18, ease: "linear" },
            }}
          />
        </>
      )}

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4"
            variants={headingVariants}
          >
            Ready to Transform Your Clinic?
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl mb-8"
            variants={paragraphVariants}
          >
            Sign up today and take the first step towards a more efficient practice.
          </motion.p>
          <motion.button
            onClick={handleSignupClick}
            className="flex items-center justify-center bg-white text-teal-700 py-3 px-8 rounded-full text-lg font-medium shadow-lg hover:bg-gray-100 transition duration-300"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Get Started Now <FaArrowRight className="ml-2" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;

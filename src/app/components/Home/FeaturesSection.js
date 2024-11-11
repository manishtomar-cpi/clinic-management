// src/app/components/Home/FeaturesSection.js

"use client";

import React from "react";
import {
  FaUserMd,
  FaNotesMedical,
  FaCalendarCheck,
  FaSearch,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import { motion } from "framer-motion";

const FeaturesSection = () => {
  const features = [
    {
      icon: <FaUsers className="text-teal-500 text-6xl mb-4" />,
      title: "Multi-Clinic Management",
      description:
        "Manage multiple clinics seamlessly, track performances, and coordinate across locations.",
    },
    {
      icon: <FaUserMd className="text-green-500 text-6xl mb-4" />,
      title: "Patient Records",
      description:
        "Maintain comprehensive patient profiles with medical history, treatments, and visit summaries.",
    },
    {
      icon: <FaCalendarCheck className="text-purple-500 text-6xl mb-4" />,
      title: "Appointment Scheduling",
      description:
        "Efficiently schedule appointments, send reminders, and reduce no-shows with ease.",
    },
    {
      icon: <FaNotesMedical className="text-red-500 text-6xl mb-4" />,
      title: "Visit Documentation",
      description:
        "Document patient visits thoroughly with notes, prescriptions, and follow-up plans.",
    },
    {
      icon: <FaSearch className="text-indigo-500 text-6xl mb-4" />,
      title: "Advanced Search",
      description:
        "Quickly find patient records, appointments, and clinic data with powerful search tools.",
    },
    {
      icon: <FaShieldAlt className="text-yellow-500 text-6xl mb-4" />,
      title: "Data Security",
      description:
        "Protect patient data with advanced encryption and secure storage.",
    },
  ];

  // Define variants for the container
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // Define variants for each feature item
  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      },
    },
  };

  // Define hover animation
  const hoverAnimation = {
    scale: 1.05,
    rotate: [0, 2, -2, 0], // Slight rotation for a playful effect
    boxShadow: "0px 15px 25px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 300,
    },
  };

  // Define icon animation
  const iconVariants = {
    rest: { rotate: 0 },
    hover: { rotate: 360, transition: { duration: 1, ease: "linear" } },
  };

  return (
    <section className="bg-gradient-to-b from-gray-50 to-gray-100 py-12 rounded-lg shadow-inner">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center text-teal-700 mb-12"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          Key Features
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={hoverAnimation}
            >
              <motion.div
                variants={iconVariants}
                initial="rest"
                whileHover="hover"
                className="mb-4"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-semibold mb-2 text-teal-700">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

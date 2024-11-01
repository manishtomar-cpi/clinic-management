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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-2"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              {feature.icon}
              <h3 className="text-2xl font-semibold mb-2 text-teal-700">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

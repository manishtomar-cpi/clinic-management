// src/app/components/userGuide/Section.js

"use client";

import React from 'react';
import { motion } from 'framer-motion';

const Section = ({ id, title, icon, children, background }) => {
  return (
    <section id={id} className={`mb-16 bg-gradient-to-r ${background} p-8 rounded-lg shadow-md`}>
      <div className="flex items-center mb-6">
        {icon}
        <motion.h2
          className="text-3xl font-semibold text-gray-800"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h2>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
      >
        {children}
      </motion.div>
    </section>
  );
};

export default Section;

// src/app/components/userGuide/TableOfContents.js

import React from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const TableOfContents = ({ items }) => {
  return (
    <section
      id="table-of-contents"
      className="mb-16 bg-gradient-to-b from-teal-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8 rounded-lg shadow-inner"
    >
      <h2 className="text-3xl sm:text-4xl font-semibold mb-8 text-center text-teal-700">
        Table of Contents
      </h2>
      <motion.ul
        className="list-none space-y-6 max-w-3xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {items.map((item, index) => (
          <motion.li
            key={index}
            className="flex items-center justify-center sm:justify-start"
            variants={{
              hidden: { opacity: 0, x: -50 },
              visible: { opacity: 1, x: 0 },
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <a
              href={item.link}
              className="flex items-center w-full max-w-md bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg px-4 py-3 rounded-lg shadow-md hover:bg-opacity-100 transition-all duration-300 transform hover:scale-105"
            >
              <FaChevronRight className="text-teal-500 text-lg mr-3 flex-shrink-0" />
              <span className="text-lg font-medium text-teal-700">{item.title}</span>
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
};

export default TableOfContents;

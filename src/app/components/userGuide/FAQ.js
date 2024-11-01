// src/app/components/userGuide/FAQ.js

"use client";

import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Determine whether to show all FAQs or just the top 6
  const isSearching = searchTerm.trim() !== '';

  // Filter FAQs based on search term
  const filteredData = data.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If not searching, display only the top 6 FAQs
  const displayedData = isSearching ? filteredData : data.slice(0, 6);

  return (
    <section id="faq" className="mb-16 bg-gradient-to-b from-gray-100 to-gray-200 py-12 rounded-lg shadow-inner">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <FiChevronDown className="text-4xl text-teal-500 mr-4" />
          <h2 className="text-3xl font-semibold">Frequently Asked Questions (FAQ)</h2>
        </div>
        {/* Search Bar */}
        <div className="relative mb-6 max-w-md mx-auto">
          <FiSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            className="w-full pl-10 pr-4 py-2 border border-teal-300 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Guidance Message */}
        {/* {!isSearching && (
          <p className="text-center text-gray-500 mb-6">
            Here are some of the most frequently asked questions. Use the search bar above to find more specific information.
          </p>
        )} */}
        {/* FAQs */}
        <div className="space-y-4">
          {displayedData.length > 0 ? (
            displayedData.map((faq, index) => (
              <div key={index} className="border-b border-gray-300 pb-4">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="text-xl font-medium text-teal-700">{faq.question}</span>
                  {activeIndex === index ? (
                    <FiChevronUp className="text-teal-500 text-2xl" />
                  ) : (
                    <FiChevronDown className="text-teal-500 text-2xl" />
                  )}
                </button>
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mt-2"
                    >
                      <p className="text-lg text-gray-700" dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No FAQs match your search.</p>
          )}
        </div>
        {/* Show More Indicator */}
        {/* {!isSearching && data.length > 6 && (
          <p className="text-center text-gray-500 mt-4">
            Only the top 6 FAQs are displayed. Use the search bar to find more answers.
          </p>
        )} */}
      </div>
    </section>
  );
};

export default FAQ;

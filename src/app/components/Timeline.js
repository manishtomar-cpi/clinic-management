// src/app/components/Timeline.js

import React from 'react';
import { FiCheckCircle, FiClock } from 'react-icons/fi';
import { FaTimesCircle } from 'react-icons/fa';

const Timeline = ({ visits, onViewDetails }) => {
  return (
    <div className="relative">
      {/* Central Line for Desktop */}
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full border-l-4 border-blue-300 hidden md:block"></div>

      <div className="space-y-12">
        {visits.map((visit, index) => {
          const isLeft = index % 2 === 0;

          return (
            <div
              key={visit.id}
              className={`flex flex-col md:flex-row items-center justify-between md:justify-start ${
                isLeft ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Timeline Marker */}
              <div className="flex justify-center items-center w-12 h-12 rounded-full z-10 shadow-md transition-transform transform hover:scale-110 duration-300">
                {visit.visitStatus.toLowerCase() === 'missed' ? (
                  <FaTimesCircle className="text-red-500 text-2xl" />
                ) : visit.visitStatus.toLowerCase() === 'completed' ? (
                  <FiCheckCircle className="text-green-500 text-2xl" />
                ) : (
                  <FiClock className="text-yellow-500 text-2xl" />
                )}
              </div>

              {/* Connector Line */}
              <div className="hidden md:block w-1/2 h-0.5 bg-blue-300"></div>

              {/* Visit Content */}
              <div
                className={`mt-4 md:mt-0 md:w-1/2 p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800 transition-transform transform hover:scale-105 duration-300`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">
                      {visit.visitReason}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {visit.disease}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-center sm:text-left">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {visit.visitDate} at {visit.visitTime}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium
                      ${
                        visit.visitStatus.toLowerCase() === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : visit.visitStatus.toLowerCase() === 'missed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      } mr-4`}
                  >
                    {visit.visitStatus.charAt(0).toUpperCase() +
                      visit.visitStatus.slice(1)}
                  </span>
                  {/* Missed Count Bubble */}
                  {visit.visitStatus.toLowerCase() === 'missed' && (
                    <div className="relative group">
                      <div className="flex items-center space-x-1 cursor-pointer">
                        {[...Array(visit.missedCount)].map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse"
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                        hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                        Missed on {visit.visitDate} at {visit.visitTime}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => onViewDetails(visit)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                      rounded-md hover:from-pink-500 hover:to-purple-500 transition-colors duration-300"
                    aria-label="View Visit Details"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;

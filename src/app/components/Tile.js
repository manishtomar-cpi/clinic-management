
import React from 'react';
import { motion } from 'framer-motion';

const Tile = ({ title, count, icon, onClick, color, description }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 1 }}
      onClick={onClick}
      className={`relative bg-white rounded-lg shadow p-6 cursor-pointer overflow-hidden  border-t-4 ${color}`}
    >
      {/* Decorative Circle */}
      <motion.div
        className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-gray-100 opacity-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      ></motion.div>

      {/* Content */}
      <div className="relative flex items-center">
        <div className="text-5xl">{icon}</div>
        <div className="ml-4">
          <p className="text-xl font-semibold">{title}</p>
          <motion.p
            className="text-3xl font-bold"
            animate={{ opacity: [0, 1], y: [-10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {count}
          </motion.p>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default Tile;

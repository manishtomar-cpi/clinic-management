// src/app/components/Home/Cloud.js

import React from "react";
import { motion } from "framer-motion";

const Cloud = ({ className, gradientId, ...props }) => (
  <motion.svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 44"
    fill="none"
    {...props}
  >
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4FD1C5" />
        <stop offset="1" stopColor="#805AD5" />
      </linearGradient>
    </defs>
    <path
      d="M48 24H44a12 12 0 00-23.82-4.14A10 10 0 005 34h43a8 8 0 000-16z"
      fill={`url(#${gradientId})`}
    />
  </motion.svg>
);

export default Cloud;

// src/app/components/MedicalSpinner.js

'use client';

import React from 'react';
import { FaHeartbeat } from 'react-icons/fa';

const MedicalSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <FaHeartbeat className="animate-pulse text-red-500 text-6xl" aria-label="Loading" />
    </div>
  );
};

export default MedicalSpinner;

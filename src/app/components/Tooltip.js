// src/components/Tooltip.js

import { FaInfoCircle } from 'react-icons/fa';

const Tooltip = ({ message }) => (
  <div className="ml-2 relative group">
    <FaInfoCircle className="text-gray-500" />
    <div className="absolute bottom-full mb-2 w-48 p-2 bg-gray-700 text-white text-xs rounded hidden group-hover:block">
      {message}
    </div>
  </div>
);

export default Tooltip;

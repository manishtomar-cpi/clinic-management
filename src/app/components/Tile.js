import React from 'react';


const Tile = ({ title, count, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-lg shadow p-6 cursor-pointer overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-lg"
    >
      {/* Decorative Circle */}
      <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-blue-100 opacity-20"></div>

      {/* Content */}
      <div className="relative flex items-center">
        <div className="text-4xl">{icon}</div>
        <div className="ml-4">
          <p className="text-xl font-semibold">{title}</p>
          <p className="text-3xl font-bold">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default Tile;

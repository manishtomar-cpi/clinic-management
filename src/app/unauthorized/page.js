// pages/unauthorized.js

import Link from 'next/link';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-red-500 mb-4">Unauthorized Access</h1>
      <p className="text-lg mb-6">
        You do not have permission to view this page.
      </p>
      <Link href="/" className="text-blue-600 hover:underline">
        Go back to Home
      </Link>
    </div>
  );
};

export default Unauthorized;

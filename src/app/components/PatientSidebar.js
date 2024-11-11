import React from 'react';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { showToast } from './Toast'; // Ensure this utility exists

const PatientSidebar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      showToast('You have successfully logged out!', 'success');
    } catch (error) {
      console.error('Logout Error:', error);
      showToast('Error logging out. Please try again.', 'error');
    }
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col bg-white w-64 h-full shadow-lg fixed">
        <div className="flex items-center justify-center h-20 shadow-md">
          <h1 className="text-2xl font-bold text-indigo-600">HealthConnect</h1>
        </div>
        <nav className="flex-1">
          <button
            onClick={handleHomeClick}
            className="flex items-center py-4 px-6 text-gray-700 hover:bg-gray-200 w-full"
          >
            <FaHome className="text-lg" />
            <span className="ml-3">Home</span>
          </button>
        </nav>
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="flex items-center py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 w-full"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden flex fixed top-0 left-0 w-full bg-white shadow-lg z-50">
        <nav className="flex justify-between items-center p-4 w-full">
          <h1 className="text-xl font-bold text-indigo-600">HealthConnect</h1>
          <button
            onClick={handleLogout}
            className="flex items-center bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            <FaSignOutAlt />
            <span className="ml-2">Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default PatientSidebar;

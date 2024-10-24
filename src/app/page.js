"use client";
import React from 'react';
import {
  FaUserMd,
  FaNotesMedical,
  FaCalendarCheck,
  FaSearch,
  FaClinicMedical,
  FaUsers,
  FaShieldAlt, // New icon for Data Security
} from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLoginClick = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleSignupClick = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-blue-600 to-teal-400 text-white overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center">
          {/* Text Content */}
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fadeInDown">
              Welcome to MedFlow
            </h1>
            <p className="text-lg md:text-2xl mb-6 animate-fadeInUp">
              A comprehensive solution for doctors to streamline clinic operations and enhance patient care.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleSignupClick}
                className="bg-white text-blue-600 py-3 px-6 rounded-lg text-lg font-medium hover:bg-gray-100 transition duration-300 shadow-lg animate-fadeInLeft"
              >
                Get Started
              </button>
              <button
                onClick={handleLoginClick}
                className="bg-transparent border border-white py-3 px-6 rounded-lg text-lg font-medium hover:bg-white hover:text-blue-600 transition duration-300 shadow-lg animate-fadeInRight"
              >
                {status === 'authenticated' ? 'Dashboard' : 'Login'}
              </button>
            </div>
          </div>
          {/* Image or Illustration */}
          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center md:justify-end">
            <FaClinicMedical className="text-white text-9xl animate-float" />
          </div>
        </div>
        {/* Decorative Background Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        {/* Introduction Section */}
        <section className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
            Empowering Clinics Across the Globe
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Join a community of doctors transforming patient care with efficient clinic management.
          </p>
        </section>

        {/* Features Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
            <FaUsers className="text-blue-500 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Multi-Clinic Management
            </h3>
            <p className="mt-2 text-gray-600 text-center">
              Manage multiple clinics seamlessly, track performances, and coordinate across locations.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
            <FaUserMd className="text-green-500 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Patient Records
            </h3>
            <p className="mt-2 text-gray-600 text-center">
              Maintain comprehensive patient profiles with medical history, treatments, and visit summaries.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
            <FaCalendarCheck className="text-purple-500 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Appointment Scheduling
            </h3>
            <p className="mt-2 text-gray-600 text-center">
              Efficiently schedule appointments, send reminders, and reduce no-shows with ease.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
            <FaNotesMedical className="text-red-500 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Visit Documentation
            </h3>
            <p className="mt-2 text-gray-600 text-center">
              Document patient visits thoroughly with notes, prescriptions, and follow-up plans.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
            <FaSearch className="text-indigo-500 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Advanced Search
            </h3>
            <p className="mt-2 text-gray-600 text-center">
              Quickly find patient records, appointments, and clinic data with powerful search tools.
            </p>
          </div>

          {/* Feature 6 - Data Security */}
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
            <FaShieldAlt className="text-yellow-500 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Data Security
            </h3>
            <p className="mt-2 text-gray-600 text-center">
              Protect patient data with advanced encryption and secure storage.
            </p>
          </div>
        </div>
      </main>

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 to-teal-400 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Clinic?
          </h2>
          <p className="text-lg md:text-xl mb-8">
            Sign up today and take the first step towards a more efficient practice.
          </p>
          <button
            onClick={handleSignupClick}
            className="bg-white text-blue-600 py-3 px-8 rounded-lg text-lg font-medium hover:bg-gray-100 transition duration-300 shadow-lg"
          >
            {status === 'authenticated' ? 'Go to Dashboard' : 'Get Started Now'}
          </button>
        </div>
      </section>

      {/* Animation Styles */}
      <style jsx>{`
        /* Animations */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInDown {
          animation: fadeInDown 1s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        @keyframes float {
          0% {
            transform: translatey(0px);
          }
          50% {
            transform: translatey(-20px);
          }
          100% {
            transform: translatey(0px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes blob {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default Home;

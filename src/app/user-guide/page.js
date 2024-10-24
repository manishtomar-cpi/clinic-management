"use client";
import React from 'react';
import {
  FaUserPlus,
  FaSignInAlt,
  FaTachometerAlt,
  FaCalendarCheck,
  FaUsers,
  FaNotesMedical,
  FaSearch,
  FaShieldAlt,
  FaClinicMedical,
  FaUserTag,
  FaHome,
  FaLock,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const UserGuide = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleGetStartedClick = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/signup');
    }
  };

  const handleBackHomeClick = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 to-indigo-500 text-white overflow-hidden">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleBackHomeClick}>
            <FaHome className="text-white text-2xl" />
            <span className="text-xl font-semibold">Back to Home</span>
          </div>
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
          {/* Text Content */}
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fadeInDown">
              Welcome to ClinicEase User Guide
            </h1>
            <p className="text-lg md:text-2xl mb-6 animate-fadeInUp">
              Learn how to make the most of ClinicEase with this comprehensive guide.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleGetStartedClick}
                className="bg-white text-purple-600 py-3 px-6 rounded-lg text-lg font-medium hover:bg-gray-100 transition duration-300 shadow-lg animate-fadeInLeft"
              >
                {status === 'authenticated' ? 'Go to Dashboard' : 'Get Started Now'}
              </button>
            </div>
          </div>
          {/* Image or Illustration */}
          <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center md:justify-end">
            <FaClinicMedical className="text-white text-9xl animate-float" />
          </div>
        </div>
        {/* Decorative Background Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </section>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        {/* Introduction Section */}
        <section className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 animate-fadeInDown">
            Getting Started with ClinicEase
          </h2>
          <p className="text-lg md:text-xl text-gray-600 animate-fadeInUp">
            Follow these simple steps to streamline your clinic operations.
          </p>
        </section>

        {/* Step-by-Step Guide */}
        <div className="space-y-16">
          {/* Steps */}
          {[
            {
              title: 'Step 1: Sign Up with a Unique Username',
              icon: <FaUserPlus className="inline-block text-green-500 mr-2" />,
              imageIcon: <FaUserTag className="text-green-500 text-9xl animate-bounce" />,
              description: [
                'Create your account by choosing a unique username. Usernames must be at least 6 characters and can include letters, digits, underscores, and periods.',
                'This unique username will be your identity on ClinicEase, ensuring secure and personalized access to your dashboard.',
              ],
            },
            {
              title: 'Step 2: Login Securely',
              icon: <FaSignInAlt className="inline-block text-blue-500 mr-2" />,
              imageIcon: <FaLock className="text-blue-500 text-9xl animate-pulse" />,
              description: [
                'Access your account using your unique username and password. Our platform ensures your credentials are encrypted and securely stored.',
                'Forgot your password? Don\'t worry, we have secure recovery options to help you regain access.',
              ],
            },
            {
              title: 'Step 3: Explore Your Dashboard',
              icon: <FaTachometerAlt className="inline-block text-purple-500 mr-2" />,
              imageIcon: <FaTachometerAlt className="text-purple-500 text-9xl animate-spin-slow" />,
              description: [
                'Get an overview of your clinic\'s performance. Access key metrics, recent activities, and quick links to important features.',
                'Customize your dashboard to display the information that matters most to you.',
              ],
            },
            {
              title: 'Step 4: Manage Appointments',
              icon: <FaCalendarCheck className="inline-block text-teal-500 mr-2" />,
              imageIcon: <FaCalendarCheck className="text-teal-500 text-9xl animate-wiggle" />,
              description: [
                'Schedule, view, and manage appointments effortlessly. Our intuitive calendar helps you keep track of your daily, weekly, and monthly schedules.',
                'Send automated reminders to patients to reduce no-shows.',
              ],
            },
            {
              title: 'Step 5: Maintain Patient Records',
              icon: <FaUsers className="inline-block text-orange-500 mr-2" />,
              imageIcon: <FaUsers className="text-orange-500 text-9xl animate-bounce" />,
              description: [
                'Keep comprehensive records of your patients, including medical history, treatments, and visit summaries.',
                'All patient data is securely encrypted to protect their privacy.',
              ],
            },
            {
              title: 'Step 6: Document Visits',
              icon: <FaNotesMedical className="inline-block text-red-500 mr-2" />,
              imageIcon: <FaNotesMedical className="text-red-500 text-9xl animate-pulse" />,
              description: [
                'Record detailed notes, prescriptions, and follow-up plans for each patient visit.',
                'Easily access past visit records to provide consistent and informed care.',
              ],
            },
            {
              title: 'Step 7: Utilize Advanced Search',
              icon: <FaSearch className="inline-block text-indigo-500 mr-2" />,
              imageIcon: <FaSearch className="text-indigo-500 text-9xl animate-spin" />,
              description: [
                'Quickly find patient records, appointments, and other data using our powerful search tools.',
                'Filter results by date, patient name, or specific keywords to find exactly what you need.',
              ],
            },
            {
              title: 'Step 8: Ensure Data Security',
              icon: <FaShieldAlt className="inline-block text-yellow-500 mr-2" />,
              imageIcon: <FaShieldAlt className="text-yellow-500 text-9xl animate-pulse" />,
              description: [
                'ClinicEase prioritizes the security of your data with advanced encryption and secure storage solutions.',
                'Rest assured that all sensitive information is protected and complies with industry standards.',
              ],
            },
          ].map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'
              } items-center md:space-x-8`}
            >
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  {step.icon}
                  {step.title}
                </h3>
                {step.description.map((desc, idx) => (
                  <p key={idx} className="text-gray-600 mb-4">
                    {desc}
                  </p>
                ))}
              </div>
              <div className="flex-1 mt-8 md:mt-0 flex justify-center">
                {step.imageIcon}
              </div>
            </div>
          ))}
        </div>
      </main>
   {/* Call to Action */}
   <section className="bg-gradient-to-br from-purple-600 to-indigo-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl mb-8">
            Sign up today and experience seamless clinic management with ClinicEase.
          </p>
          <button
            onClick={handleGetStartedClick}
            className="bg-white text-purple-600 py-3 px-8 rounded-lg text-lg font-medium hover:bg-gray-100 transition duration-300 shadow-lg"
          >
            {status === 'authenticated' ? 'Go to Dashboard' : 'Get Started Now'}
          </button>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} ClinicEase. All rights reserved.</p>
        </div>
      </footer> */}

      {/* Animation Styles */}
      <style jsx>{`
        /* Animation styles */
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInDown { animation: fadeInDown 1s ease-out forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out forwards; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-bounce { animation: bounce 2s infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 2s linear infinite; }
        .animate-spin-slow { animation: spin 5s linear infinite; }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 8s infinite; }
      `}</style>
    </div>
  );
};

export default UserGuide;

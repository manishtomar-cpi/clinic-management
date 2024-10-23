"use client";
import React, { useState } from 'react';
import { FaUserMd, FaClinicMedical, FaLock, FaUser, FaHeartbeat, FaEye, FaEyeSlash } from 'react-icons/fa';
import { showToast } from '../components/Toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    doctorName: '',
    clinicName: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Make a POST request to the signup API
      const response = await axios.post('/api/signup', formData);

      if (response.status === 201) {
        showToast('Signup successful!', 'success');
        router.push('/dashboard'); // Redirect to dashboard after signup
      } else {
        showToast('Signup failed! Please try again.', 'error');
      }
    } catch (error) {
      showToast('Signup failed! Please try again.', 'error');
      console.error('Signup Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Left Side */}
      <div className="flex-1 bg-gradient-to-br from-blue-600 to-teal-400 text-white flex flex-col justify-center items-center p-8">
        <FaClinicMedical className="text-8xl mb-6 animate-bounce" />
        <h2 className="text-4xl font-bold mb-4">Welcome to Clinic Management</h2>
        <p className="text-lg md:text-xl text-center">
          Manage your clinic efficiently. Register today and get started with managing appointments, patients, and visits effortlessly.
        </p>
      </div>

      {/* Right Side (Signup Form) */}
      <div className="flex-1 flex justify-center items-center p-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-8 w-full max-w-lg"
        >
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            Doctor Signup
          </h2>

          {/* Doctor Username */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Doctor Username
            </label>
            <div className="flex items-center bg-gray-100 p-2 rounded">
              <FaUser className="text-blue-500 mr-2" />
              <input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Doctor Name */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="doctorName">
              Doctor Name
            </label>
            <div className="flex items-center bg-gray-100 p-2 rounded">
              <FaUserMd className="text-green-500 mr-2" />
              <input
                type="text"
                name="doctorName"
                id="doctorName"
                value={formData.doctorName}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Clinic Name */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clinicName">
              Clinic Name
            </label>
            <div className="flex items-center bg-gray-100 p-2 rounded">
              <FaClinicMedical className="text-teal-500 mr-2" />
              <input
                type="text"
                name="clinicName"
                id="clinicName"
                value={formData.clinicName}
                onChange={handleInputChange}
                placeholder="Enter your clinic name"
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <div className="flex items-center bg-gray-100 p-2 rounded relative">
              <FaLock className="text-red-500 mr-2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center bg-gradient-to-br from-blue-600 to-teal-400 text-white py-3 rounded-full font-medium transition duration-300 shadow-lg ${
              isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:bg-gradient-to-br hover:from-blue-500 hover:to-teal-300'
            }`}
          >
            {isSubmitting ? (
              <FaHeartbeat className="animate-pulse text-xl mr-2" />
            ) : (
              <FaUserMd className="text-xl mr-2" />
            )}
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
          </button>

          {/* Links for Already Signed Up and Back to Home */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already signed up?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </p>
            <p className="mt-2 text-gray-600">
              <Link href="/" className="text-blue-600 hover:underline">
                Back to Home
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

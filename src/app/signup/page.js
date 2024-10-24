// src/pages/signup.js

"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUserMd,
  FaClinicMedical,
  FaLock,
  FaUser,
  FaHeartbeat,
  FaEye,
  FaEyeSlash,
  FaQuestionCircle,
  FaSpinner,
  FaCheck,
  FaMapMarkerAlt,
  FaTimes,
} from 'react-icons/fa';
import { showToast } from '../components/Toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import debounce from 'lodash.debounce';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    doctorName: '',
    clinicName: '',
    password: '',
    clinicLocation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const router = useRouter();

  const validateUsername = (username) => {
    // Username must be at least 6 characters and can include letters, digits, underscores, and periods
    const usernamePattern = /^[a-zA-Z0-9._]{6,}$/;
    if (!usernamePattern.test(username)) {
      return 'Username must be at least 6 characters and can include letters, digits, underscores, and periods.';
    }
    return '';
  };

  const debouncedCheckUsername = useCallback(
    debounce(async (username) => {
      if (usernameError) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const response = await axios.get(`/api/users/check-username?username=${username}`);
        if (response.data.available) {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        showToast('Error checking username. Please try again.', 'error');
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 500),
    [usernameError]
  );

  useEffect(() => {
    // Cleanup function to cancel debounce on unmount
    return () => {
      debouncedCheckUsername.cancel();
    };
  }, [debouncedCheckUsername]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Password validation
    if (name === 'password') {
      validatePassword(value);
    }

    // Username validation
    if (name === 'username') {
      const error = validateUsername(value);
      setUsernameError(error);
      setUsernameAvailable(null); // Reset availability
      if (!error) {
        debouncedCheckUsername(value);
      }
    }
  };

  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordPattern.test(password)) {
      setPasswordError('Password must be at least 8 characters, include one uppercase letter, and one special character.');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }

    if (usernameError) {
      showToast(usernameError, 'error');
      return;
    }

    if (usernameAvailable === false || usernameAvailable === null) {
      showToast('Please choose a valid and available username.', 'error');
      return;
    }

    if (!formData.clinicLocation.trim()) {
      showToast('Please enter your clinic location.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Make a POST request to the signup API
      const response = await axios.post('/api/users/signup', formData);

      if (response.status === 201) {
        showToast('Signup successful!', 'success');
        router.push('/dashboard'); // Redirect to dashboard after signup
      } else {
        showToast('Signup failed! Please try again.', 'error');
      }
    } catch (error) {
      // Check if the error is due to username already taken
      if (error.response && error.response.status === 409) {
        showToast('Username is already taken. Please choose a different username.', 'error');
      } else {
        showToast('Signup failed! Please try again.', 'error');
      }
      console.error('Signup Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const togglePasswordInfo = () => {
    setShowPasswordInfo((prev) => !prev);
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
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8 w-full max-w-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Doctor Signup</h2>

          {/* Doctor Username */}
          <div className="mb-4 relative">
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
              {checkingUsername && (
                <FaSpinner className="animate-spin text-gray-500 ml-2" />
              )}
              {!checkingUsername && usernameAvailable && (
                <FaCheck className="text-green-500 ml-2" />
              )}
              {!checkingUsername && usernameAvailable === false && (
                <FaTimes className="text-red-500 ml-2" />
              )}
            </div>
            {usernameError && (
              <p className="text-red-500 text-xs mt-1">{usernameError}</p>
            )}
            {!usernameError && usernameAvailable === false && (
              <p className="text-red-500 text-xs mt-1">Username is already taken.</p>
            )}
            {!usernameError && usernameAvailable && (
              <p className="text-green-500 text-xs mt-1">Username is available!</p>
            )}
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

          {/* Clinic Location (Simple Input Field) */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clinicLocation">
              Clinic Location
            </label>
            <div className="flex items-center bg-gray-100 p-2 rounded">
              <FaMapMarkerAlt className="text-red-500 mr-2" />
              <input
                type="text"
                name="clinicLocation"
                id="clinicLocation"
                value={formData.clinicLocation}
                onChange={handleInputChange}
                placeholder="Enter your clinic location"
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6 relative">
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
                className="absolute right-10 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                type="button"
                onClick={togglePasswordInfo}
                className="absolute right-2 text-gray-600 hover:text-gray-800"
              >
                <FaQuestionCircle />
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-xs mt-1">{passwordError}</p>
            )}
            {showPasswordInfo && (
              <p className="text-gray-500 text-xs mt-2">
                Password must be at least 8 characters, include one uppercase letter, and one special character.
              </p>
            )}
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center bg-gradient-to-br from-blue-600 to-teal-400 text-white py-3 rounded-lg font-medium transition duration-300 shadow-lg ${
              isSubmitting
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-gradient-to-br hover:from-blue-500 hover:to-teal-300'
            }`}
          >
            {isSubmitting ? (
              <FaSpinner className="animate-spin text-xl mr-2" />
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

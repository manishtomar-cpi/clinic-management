"use client";
import React, { useState, useEffect } from 'react';
import { FaUserMd, FaLock, FaEye, FaEyeSlash, FaHeartbeat } from 'react-icons/fa';
import { showToast } from '../components/Toast';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Sign in using NextAuth's signIn function
      const result = await signIn('credentials', {
        redirect: false,
        username: formData.username,
        password: formData.password,
      });

      if (result?.error) {
        showToast('Login failed! Please check your credentials.', 'error');
        setIsSubmitting(false);
      } else {
        showToast('Login successful!', 'success');
        setIsSubmitting(false);
        router.push('/dashboard'); // Redirect to dashboard after successful login
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      <div className="flex-1 bg-gradient-to-br from-blue-600 to-teal-400 text-white flex flex-col justify-center items-center p-8">
        <FaUserMd className="text-8xl mb-6 animate-bounce" />
        <h2 className="text-4xl font-bold mb-4">Welcome Back, Doctor!</h2>
        <p className="text-lg md:text-xl text-center">
          Access your clinic dashboard and manage appointments, patients, and visits with ease.
        </p>
      </div>

      <div className="flex-1 flex justify-center items-center p-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8 w-full max-w-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            Doctor Login
          </h2>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <div className="flex items-center bg-gray-100 p-2 rounded">
              <FaUserMd className="text-blue-500 mr-2" />
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
            {isSubmitting ? 'Logging In...' : 'Login'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Not registered yet?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign Up
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

export default Login;

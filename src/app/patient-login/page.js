'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaHeartbeat,
  FaTimes,
  FaEnvelope,
  FaSpinner,
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import debounce from 'lodash.debounce';

const PatientLogin = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States for Forgot Password Modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotUsernameError, setForgotUsernameError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Enter Username, Step 2: Enter OTP, Step 3: Enter New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');

  // Show/hide password states for forgot password modal
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Ref for closing modal when clicking outside
  const modalRef = useRef();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      if (session.user.role === 'patient') {
        router.push('/patient-dashboard');
      }
      // If the user is a doctor, you might want to redirect them elsewhere or allow them to continue
      // For example:
      // if (session.user.role === 'doctor') {
      //   toast.info('You are already logged in as a doctor.');
      // }
    }
  }, [status, session, router]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        resetForgotPassword();
      }
    };

    if (showForgotPassword) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showForgotPassword]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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
        toast.error('Login failed! Please check your credentials.');
        setIsSubmitting(false);
      } else {
        toast.success('Login successful!');
        setIsSubmitting(false);
        router.push('/patient-dashboard'); // Redirect to patient dashboard after successful login
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Debounced function to verify username and send OTP
  const debouncedSendOtp = useRef(
    debounce(async (username) => {
      if (!username) {
        setForgotUsernameError('Please enter your username.');
        return;
      }

      setIsSendingOtp(true);
      setForgotUsernameError('');

      try {
        // Verify username and get email
        const verifyResponse = await axios.get(
          `/api/users/verify-username?username=${encodeURIComponent(username)}`
        );

        if (verifyResponse.status === 200 && verifyResponse.data.email) {
          // Send OTP to the fetched email
          const sendOtpResponse = await axios.post('/api/auth/send-otp', {
            email: verifyResponse.data.email,
          });

          if (sendOtpResponse.status === 200) {
            toast.success('OTP has been sent to your email.');
            setStep(2);
          } else {
            toast.error('Failed to send OTP. Please try again.');
          }
        } else {
          setForgotUsernameError('Username not found.');
        }
      } catch (error) {
        console.error('Error in sending OTP:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setForgotUsernameError(error.response.data.message);
        } else {
          setForgotUsernameError('An error occurred. Please try again.');
        }
      } finally {
        setIsSendingOtp(false);
      }
    }, 500)
  ).current;

  const handleForgotUsernameChange = (e) => {
    setForgotUsername(e.target.value);
    setForgotUsernameError('');
    // Fetch email when username changes with debounce
    debouncedSendOtp(e.target.value.trim());
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    debouncedSendOtp(forgotUsername.trim());
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    setOtpError('');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      setOtpError('Please enter the OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const verifyOtpResponse = await axios.post('/api/auth/verify-otp-resetpassword', {
        username: forgotUsername.trim(),
        otp: otp.trim(),
      });

      if (verifyOtpResponse.status === 200 && verifyOtpResponse.data.verified) {
        toast.success('OTP verified! Please set your new password.');
        setStep(3);
      } else {
        setOtpError('Invalid or expired OTP.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setOtpError(error.response.data.message);
      } else {
        setOtpError('An error occurred. Please try again.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    setNewPasswordError('');
  };

  const handleConfirmNewPasswordChange = (e) => {
    setConfirmNewPassword(e.target.value);
    setConfirmNewPasswordError('');
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const toggleConfirmNewPasswordVisibility = () => {
    setShowConfirmNewPassword((prev) => !prev);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate new password
    const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    let valid = true;

    if (!newPassword) {
      setNewPasswordError('Please enter a new password.');
      valid = false;
    } else if (!passwordPattern.test(newPassword)) {
      setNewPasswordError(
        'Password must be at least 8 characters, include one uppercase letter, and one special character.'
      );
      valid = false;
    }

    if (!confirmNewPassword) {
      setConfirmNewPasswordError('Please confirm your new password.');
      valid = false;
    } else if (newPassword !== confirmNewPassword) {
      setConfirmNewPasswordError('Passwords do not match.');
      valid = false;
    }

    if (!valid) return;

    setIsVerifyingOtp(true);

    try {
      const resetPasswordResponse = await axios.post('/api/auth/reset-password', {
        username: forgotUsername.trim(),
        newPassword: newPassword.trim(),
      });

      if (resetPasswordResponse.status === 200 && resetPasswordResponse.data.success) {
        toast.success('Password has been reset successfully. You can now log in with your new password.');
        resetForgotPassword();
      } else {
        setNewPasswordError('Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setNewPasswordError(error.response.data.message);
      } else {
        setNewPasswordError('An error occurred. Please try again.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotUsername('');
    setForgotUsernameError('');
    setOtp('');
    setOtpError('');
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPasswordError('');
    setConfirmNewPasswordError('');
    setStep(1);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

      {/* Left Side - Static Image */}
      <div className="hidden md:flex fixed top-0 left-0 w-1/2 h-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex-col justify-center items-center p-8">
        {/* Creative Content */}
        <div className="text-center animate__animated animate__fadeInLeft">
          <FaHeartbeat className="text-8xl mb-6 animate-bounce" />
          <h2 className="text-4xl font-bold mb-4">Welcome to HealthConnect</h2>
          <p className="text-lg md:text-xl">
            Access your health records, schedule appointments, and manage your wellness journey seamlessly.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 ml-0 md:ml-[50%] h-full overflow-y-auto flex justify-center items-center p-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8 w-full max-w-lg">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            Patient Login
          </h2>

          {/* Username Field */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
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

          {/* Password Field */}
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center bg-gradient-to-br from-pink-500 to-purple-600 text-white py-3 rounded-lg font-medium transition duration-300 shadow-lg ${
              isSubmitting
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-gradient-to-br hover:from-pink-600 hover:to-purple-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin text-xl mr-2" />
                Logging In...
              </>
            ) : (
              <>
                <FaHeartbeat className="text-xl mr-2" />
                Login
              </>
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="mt-4 text-right">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              Forgot Password?
            </button>
          </div>

          {/* Navigation Links */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              <Link href="/" className="text-blue-600 hover:underline">
                Back to Home
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6 relative animate__animated animate__fadeInDown"
          >
            <button
              onClick={resetForgotPassword}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
              aria-label="Close Modal"
            >
              <FaTimes size={20} />
            </button>

            {step === 1 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                  Forgot Password
                </h2>
                <p className="text-gray-600 mb-4 text-center">
                  Enter your username below and we'll send you an OTP to reset your password.
                </p>
                <form onSubmit={handleForgotPasswordSubmit}>
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="forgotUsername"
                    >
                      Username
                    </label>
                    <div className="flex items-center bg-gray-100 p-2 rounded">
                      <FaUser className="text-blue-500 mr-2" />
                      <input
                        type="text"
                        name="forgotUsername"
                        id="forgotUsername"
                        value={forgotUsername}
                        onChange={handleForgotUsernameChange}
                        placeholder="Enter your username"
                        required
                        className="bg-gray-100 focus:outline-none w-full"
                      />
                    </div>
                    {forgotUsernameError && (
                      <p className="text-red-500 text-xs mt-1">{forgotUsernameError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className={`w-full flex justify-center items-center bg-gradient-to-br from-pink-500 to-purple-600 text-white py-2 rounded-lg font-medium transition duration-300 shadow-lg ${
                      isSendingOtp
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-gradient-to-br hover:from-pink-600 hover:to-purple-700'
                    }`}
                  >
                    {isSendingOtp ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <FaEnvelope className="text-xl mr-2" />
                        Send OTP
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                  Enter OTP
                </h2>
                <p className="text-gray-600 mb-4 text-center">
                  Enter the OTP sent to your email to verify your identity.
                </p>
                <form onSubmit={handleVerifyOtp}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otp">
                      OTP
                    </label>
                    <div className="flex items-center bg-gray-100 p-2 rounded">
                      <FaEnvelope className="text-purple-500 mr-2" />
                      <input
                        type="text"
                        name="otp"
                        id="otp"
                        value={otp}
                        onChange={handleOtpChange}
                        placeholder="Enter the OTP"
                        required
                        className="bg-gray-100 focus:outline-none w-full"
                        maxLength={6}
                      />
                    </div>
                    {otpError && (
                      <p className="text-red-500 text-xs mt-1">{otpError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className={`w-full flex justify-center items-center bg-gradient-to-br from-pink-500 to-purple-600 text-white py-2 rounded-lg font-medium transition duration-300 shadow-lg ${
                      isVerifyingOtp
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-gradient-to-br hover:from-pink-600 hover:to-purple-700'
                    }`}
                  >
                    {isVerifyingOtp ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <FaEnvelope className="text-xl mr-2" />
                        Verify OTP
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                  Reset Password
                </h2>
                <p className="text-gray-600 mb-4 text-center">
                  Enter your new password below.
                </p>
                <form onSubmit={handleResetPassword}>
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="newPassword"
                    >
                      New Password
                    </label>
                    <div className="flex items-center bg-gray-100 p-2 rounded relative">
                      <FaLock className="text-red-500 mr-2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        id="newPassword"
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        placeholder="Enter your new password"
                        required
                        className="bg-gray-100 focus:outline-none w-full"
                      />
                      <button
                        type="button"
                        onClick={toggleNewPasswordVisibility}
                        className="absolute right-2 text-gray-600 hover:text-gray-800"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {newPasswordError && (
                      <p className="text-red-500 text-xs mt-1">{newPasswordError}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="confirmNewPassword"
                    >
                      Confirm New Password
                    </label>
                    <div className="flex items-center bg-gray-100 p-2 rounded relative">
                      <FaLock className="text-red-500 mr-2" />
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        name="confirmNewPassword"
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={handleConfirmNewPasswordChange}
                        placeholder="Confirm your new password"
                        required
                        className="bg-gray-100 focus:outline-none w-full"
                      />
                      <button
                        type="button"
                        onClick={toggleConfirmNewPasswordVisibility}
                        className="absolute right-2 text-gray-600 hover:text-gray-800"
                        aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {confirmNewPasswordError && (
                      <p className="text-red-500 text-xs mt-1">{confirmNewPasswordError}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className={`w-full flex justify-center items-center bg-gradient-to-br from-pink-500 to-purple-600 text-white py-2 rounded-lg font-medium transition duration-300 shadow-lg ${
                      isVerifyingOtp
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:bg-gradient-to-br hover:from-pink-600 hover:to-purple-700'
                    }`}
                  >
                    {isVerifyingOtp ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <FaLock className="text-xl mr-2" />
                        Reset Password
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLogin;

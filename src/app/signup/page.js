
"use client"; 

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaUserMd,
  FaClinicMedical,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaQuestionCircle,
  FaSpinner,
  FaCheck,
  FaMapMarkerAlt,
  FaTimes,
  FaEnvelope,
  FaCheckCircle,
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import debounce from 'lodash.debounce';
import 'animate.css'; // If using Animate.css for animations

// Custom OTP Input Component
const CustomOtpInput = ({ length, value, onChange, error }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputsRef = useRef([]);

  useEffect(() => {
    // Update parent value when OTP changes
    onChange(otp.join(''));
  }, [otp, onChange]);

  const handleChange = (element, index) => {
    const val = element.value;
    if (/[^0-9]/.test(val)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Move focus to next input if not the last
    if (val && index < length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d+$/.test(pasteData)) {
      const pasteOtp = pasteData.slice(0, length).split('');
      const newOtp = [...otp];
      pasteOtp.forEach((digit, idx) => {
        newOtp[idx] = digit;
        if (inputsRef.current[idx]) {
          inputsRef.current[idx].value = digit;
        }
      });
      setOtp(newOtp);
      if (pasteOtp.length < length) {
        inputsRef.current[pasteOtp.length].focus();
      }
    }
  };

  return (
    <div className="flex justify-center" onPaste={handlePaste}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          name={`otp-${index}`}
          maxLength="1"
          value={otp[index]}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          ref={(el) => (inputsRef.current[index] = el)}
          className={`w-12 h-12 mx-1 text-center border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          aria-label={`OTP Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    doctorName: '',
    clinicName: '',
    email: '',
    password: '',
    confirmPassword: '',
    clinicLocation: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For Confirm Password
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(900); // 15 minutes in seconds

  const router = useRouter();

  // Validate Username
  const validateUsername = (username) => {
    const usernamePattern = /^[a-zA-Z0-9._]{6,}$/;
    if (!usernamePattern.test(username)) {
      return 'Username must be at least 6 characters and can include letters, digits, underscores, and periods.';
    }
    return '';
  };

  // Debounced Username Availability Check
  const debouncedCheckUsername = useCallback(
    debounce(async (username) => {
      if (usernameError) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const response = await axios.get(`/api/users/check-username?username=${username}`);
        // Assuming the API returns { available: true } for available usernames
        if (response.data.available) {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        toast.error('Error checking username. Please try again.');
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 500),
    [usernameError]
  );

  useEffect(() => {
    return () => {
      debouncedCheckUsername.cancel();
    };
  }, [debouncedCheckUsername]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Password Validation
    if (name === 'password') {
      validatePassword(value);
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
      } else {
        setConfirmPasswordError('');
      }
    }

    // Confirm Password Validation
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setConfirmPasswordError('Passwords do not match.');
      } else {
        setConfirmPasswordError('');
      }
    }

    // Username Validation
    if (name === 'username') {
      const error = validateUsername(value);
      setUsernameError(error);
      setUsernameAvailable(null); // Reset availability
      if (!error) {
        debouncedCheckUsername(value);
      }
    }

    // Email Validation (Basic)
    if (name === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailPattern.test(value)) {
        setEmailVerified(false);
        setOtpSent(false);
        setOtpValue('');
        setOtpError('Please enter a valid email address.');
      } else {
        setOtpError('');
      }
    }
  };

  // Validate Password
  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordPattern.test(password)) {
      setPasswordError('Password must be at least 8 characters, include one uppercase letter, and one special character.');
    } else {
      setPasswordError('');
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    const { email } = formData;
    if (!email) {
      setOtpError('Please enter your email.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setOtpError('Please enter a valid email address.');
      return;
    }
    setOtpError('');
    try {
      const response = await axios.post('/api/auth/send-otp', { email });
      if (response.status === 200) {
        toast.success('OTP sent to your email.');
        setOtpSent(true);
        setTimer(900); // Reset timer to 15 minutes
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Error sending OTP. Please try again.');
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits.');
      return;
    }
    setVerifyingOtp(true);
    try {
      const response = await axios.post('/api/auth/verify-otp', { email: formData.email, otp });
      if (response.status === 200 && response.data.verified) {
        toast.success('Email verified successfully!');
        setEmailVerified(true);
        setTimer(0); // Stop the timer
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError('Error verifying OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side Validations
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (confirmPasswordError) {
      toast.error(confirmPasswordError);
      return;
    }

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    if (usernameAvailable === false) {
      toast.error('Username is already taken.');
      return;
    }

    if (usernameAvailable === null) {
      toast.error('Please choose a valid and available username.');
      return;
    }

    if (!formData.clinicLocation.trim()) {
      toast.error('Please enter your clinic location.');
      return;
    }

    if (!emailVerified) {
      toast.error('Please verify your email.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Make a POST request to the signup API
      const response = await axios.post('/api/users/signup', {
        username: formData.username,
        doctorName: formData.doctorName,
        clinicName: formData.clinicName,
        email: formData.email,
        password: formData.password,
        clinicLocation: formData.clinicLocation,
      });

      if (response.status === 201) {
        toast.success('Signup successful!');
        router.push('/login'); // Redirect to login after signup
      } else {
        toast.error('Signup failed! Please try again.');
      }
    } catch (error) {
      // Check if the error is due to username or email already taken
      if (error.response && error.response.status === 409) {
        toast.error(error.response.data.message || 'Username or Email is already taken.');
      } else if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message || 'Signup failed! Please try again.');
      } else {
        toast.error('Signup failed! Please try again.');
      }
      console.error('Signup Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Toggle Confirm Password Visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  // Timer Effect for OTP Expiry
  useEffect(() => {
    let interval = null;
    if (otpSent && !emailVerified && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setOtpError('OTP has expired. Please request a new one.');
            setOtpSent(false);
            setOtpValue('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, emailVerified, timer]);

  return (
    <div className="min-h-screen flex">
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

      {/* Left Side - Static Image */}
      <div className="hidden md:flex fixed top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-600 to-teal-400 text-white flex-col justify-center items-center p-8">
        {/* Creative Content */}
        <div className="text-center animate__animated animate__fadeInLeft">
          <FaClinicMedical className="text-8xl mb-6 animate-bounce" />
          <h2 className="text-4xl font-bold mb-4">Welcome to Clinic Management</h2>
          <p className="text-lg md:text-xl">
            Manage your clinic efficiently. Register today and get started with managing appointments, patients, and visits effortlessly.
          </p>
        </div>
      </div>

      {/* Right Side - Scrollable Signup Form */}
      <div className="w-full md:w-1/2 ml-0 md:ml-[50%] h-full overflow-y-auto flex justify-center items-center p-8">
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

          {/* Clinic Location */}
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

         {/* Email Verification Section */}
<div className="mb-4 relative">
  {/* Always-Visible Blinking Message */}
  <div
    className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded relative animate-pulse"
  >
    <p className="text-sm">
      <strong>Verification Required:</strong> A verified email is required for signup. If your email isn't verified via AWS, please{' '}
      <button
        onClick={() => window.location.href = '/support'}
        className="text-blue-500 underline focus:outline-none"
      >
        contact support
      </button>{' '}
      to get your email verified. Once your email is verified, you can proceed to use the ClinicEase app.
    </p>
  </div>

  {/* Email Input Field */}
  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
    Email Address
  </label>
  <div className="flex items-center bg-gray-100 p-2 rounded">
    <FaEnvelope className="text-purple-500 mr-2" />
    <input
      type="email"
      name="email"
      id="email"
      value={formData.email}
      onChange={handleInputChange}
      placeholder="Enter your email"
      required
      className="bg-gray-100 focus:outline-none w-full"
    />
    {!otpSent && (
      <button
        type="button"
        onClick={handleSendOtp}
        className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        Verify
      </button>
    )}
    {otpSent && emailVerified && (
      <FaCheckCircle className="text-green-500 ml-2" title="Email Verified" />
    )}
  </div>

  {/* Display OTP error if any */}
  {otpError && (
    <p className="text-red-500 text-xs mt-1">{otpError}</p>
  )}

  {/* OTP Input Section */}
  {otpSent && !emailVerified && (
    <div className="mt-2">
      <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="otp">
        Enter OTP
      </label>
      <div className="flex flex-col items-center">
        <CustomOtpInput
          length={6} // 6-digit OTP
          value={otp}
          onChange={setOtpValue}
          error={otpError}
        />
        <button
          type="button"
          onClick={handleVerifyOtp}
          className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
          disabled={verifyingOtp}
        >
          {verifyingOtp ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaCheck />
          )}
          Verify
        </button>
      </div>
      {/* Countdown Timer */}
      {timer > 0 && (
        <p className="text-gray-600 text-xs mt-1">
          OTP expires in: {Math.floor(timer / 60)}:{('0' + (timer % 60)).slice(-2)}
        </p>
      )}
      {/* Expiry Message */}
      {timer === 0 && (
        <p className="text-red-500 text-xs mt-1">OTP has expired. Please request a new one.</p>
      )}
      {emailVerified && (
        <p className="text-green-500 text-xs mt-1">Email verified!</p>
      )}
      {/* General OTP Error */}
      {otpError && otpError !== 'Email not verified. Please verify your email through support.' && (
        <p className="text-red-500 text-xs mt-1">{otpError}</p>
      )}
    </div>
  )}
</div>


          {/* Password */}
          <div className="mb-4 relative">
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
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordInfo((prev) => !prev)}
                className="absolute right-2 text-gray-600 hover:text-gray-800"
                aria-label="Toggle password info"
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

          {/* Confirm Password */}
          <div className="mb-6 relative">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="flex items-center bg-gray-100 p-2 rounded relative">
              <FaLock className="text-red-500 mr-2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-10 text-gray-600 hover:text-gray-800"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
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

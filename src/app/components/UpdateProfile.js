// /src/app/components/UpdateProfile.js

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaUserMd,
  FaClinicMedical,
  FaLock,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaQuestionCircle,
  FaSpinner,
  FaCheckCircle,
  FaEdit,
  FaTimesCircle,
  FaEnvelope,
  FaCheck,
  FaPaperPlane,
  FaMapMarkerAlt 
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import debounce from "lodash.debounce";
import { useSession } from "next-auth/react";

// Custom OTP Input Component
const CustomOtpInput = ({ length, value, onChange, error }) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    // Update parent value when OTP changes
    onChange(otp.join(""));
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
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d+$/.test(pasteData)) {
      const pasteOtp = pasteData.slice(0, length).split("");
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
            error ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          aria-label={`OTP Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

const UpdateProfile = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    doctorName: "",
    clinicName: "",
    email: "",
    password: "",
    confirmPassword: "",
    clinicLocation: "",
  });

  const [originalEmail, setOriginalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false); // **Added**

  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [emailVerified, setEmailVerified] = useState(true); // Assume email is verified initially
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(900); // 15 minutes in seconds

  // Field Editing States
  const [editFields, setEditFields] = useState({
    username: false,
    doctorName: false,
    clinicName: false,
    email: false,
    clinicLocation: false,
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated") {
        try {
          const response = await axios.get("/api/auth/dashboard/users/profile");
          if (response.status === 200) {
            const userData = response.data;
            setFormData({
              username: userData.username || "",
              doctorName: userData.name || "",
              clinicName: userData.clinicName || "",
              email: userData.email || "",
              password: "",
              confirmPassword: "",
              clinicLocation: userData.clinicLocation || "",
            });
            setOriginalEmail(userData.email || "");
          } else {
            toast.error("Failed to load user data.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Error fetching user data. Please try again.");
        }
      } else {
        router.push("/login");
      }
    };

    fetchUserData();
  }, [status, session, router]);

  // Validate Username
  const validateUsername = (username) => {
    const usernamePattern = /^[a-zA-Z0-9._]{6,}$/;
    if (!usernamePattern.test(username)) {
      return "Username must be at least 6 characters and can include letters, digits, underscores, and periods.";
    }
    return "";
  };

  // Debounced Username Availability Check
  const debouncedCheckUsername = useCallback(
    debounce(async (username) => {
      if (usernameError) {
        setUsernameAvailable(null);
        return;
      }
      if (username === formData.username) {
        setUsernameAvailable(true);
        return;
      }
      setCheckingUsername(true);
      try {
        const response = await axios.get(
          `/api/auth/dashboard/users/check-username?username=${username}`
        );
        if (response.data.available) {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
        }
      } catch (error) {
        console.error("Error checking username:", error);
        toast.error("Error checking username. Please try again.");
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 500),
    [usernameError, formData.username]
  );

  useEffect(() => {
    return () => {
      debouncedCheckUsername.cancel();
    };
  }, [debouncedCheckUsername]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Email change logic
    if (name === "email") {
      if (value !== originalEmail) {
        setEmailVerified(false);
        setOtpSent(false);
        setOtpValue("");
        setTimer(0);
      } else {
        setEmailVerified(true);
        setOtpError("");
      }
    }

    setFormData({ ...formData, [name]: value });

    // Password Validation
    if (name === "password") {
      if (value) {
        validatePassword(value);
      } else {
        setPasswordError("");
      }

      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
      } else {
        setConfirmPasswordError("");
      }
    }

    // Confirm Password Validation
    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setConfirmPasswordError("Passwords do not match.");
      } else {
        setConfirmPasswordError("");
      }
    }

    // Username Validation
    if (name === "username") {
      const error = validateUsername(value);
      setUsernameError(error);
      setUsernameAvailable(null);
      if (!error) {
        debouncedCheckUsername(value);
      }
    }
  };

  // Validate Password
  const validatePassword = (password) => {
    // Password must be at least 8 characters, include one uppercase letter, and one special character
    const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordPattern.test(password)) {
      setPasswordError(
        "Password must be at least 8 characters, include one uppercase letter, and one special character."
      );
    } else {
      setPasswordError("");
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    const { email } = formData;
    if (!email) {
      setOtpError("Please enter your email.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setOtpError("Please enter a valid email address.");
      return;
    }
    setOtpError("");
    try {
      const response = await axios.post("/api/auth/dashboard/users/send-otp", {
        email,
      });
      if (response.status === 200) {
        toast.success("OTP sent to your email.");
        setOtpSent(true);
        setTimer(900); // Reset timer to 15 minutes
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP. Please try again.");
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits.");
      return;
    }
    setVerifyingOtp(true);
    try {
      const response = await axios.post("/api/auth/dashboard/users/verify-otp", {
        email: formData.email,
        otp,
      });
      if (response.status === 200 && response.data.verified) {
        toast.success("Email verified successfully!");
        setEmailVerified(true);
        setTimer(0); // Stop the timer
      } else {
        setOtpError("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpError("Error verifying OTP. Please try again.");
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
      toast.error("Username is already taken.");
      return;
    }

    if (usernameAvailable === null && !usernameError) {
      toast.error("Please choose a valid and available username.");
      return;
    }

    if (!formData.clinicLocation.trim()) {
      toast.error("Please enter your clinic location.");
      return;
    }

    if (!emailVerified) {
      toast.error("Please verify your new email.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data to send (only include fields that are being edited)
      const updateData = {};

      Object.keys(editFields).forEach((field) => {
        if (editFields[field] && formData[field]) {
          updateData[field] = formData[field];
        }
      });

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await axios.put("/api/auth/dashboard/users/profile", updateData);

      if (response.status === 200) {
        toast.success("Profile updated successfully!");
        router.refresh(); // Refresh the session and data
      } else {
        toast.error("Update failed! Please try again.");
      }
    } catch (error) {
      // Handle specific error statuses if needed
      if (error.response && error.response.status === 409) {
        toast.error(error.response.data.message || "Username or Email is already taken.");
      } else if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message || "Update failed! Please try again.");
      } else {
        toast.error("Update failed! Please try again.");
      }
      console.error("Update Error:", error);
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
            setOtpError("OTP has expired. Please request a new one.");
            setOtpSent(false);
            setOtpValue("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, emailVerified, timer]);

  // Handle Field Edit Toggle
  const handleEditToggle = (field) => {
    setEditFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

      {/* Update Profile Form */}
      <div className="w-full h-full overflow-y-auto flex justify-center items-center p-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-8 w-full max-w-2xl"
        >
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
            Update Profile
          </h2>

          {/* Username */}
          <div className="mb-4 relative">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
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
                disabled={!editFields.username}
                required
                className={`bg-gray-100 focus:outline-none w-full ${
                  usernameError ? "border border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => handleEditToggle("username")}
                className="ml-2 text-gray-600 hover:text-gray-800"
                aria-label="Edit Username"
              >
                {editFields.username ? <FaTimesCircle /> : <FaEdit />}
              </button>
            </div>
            {editFields.username && (
              <>
                {usernameError && (
                  <p className="text-red-500 text-xs mt-1">{usernameError}</p>
                )}
                {!usernameError && usernameAvailable === false && (
                  <p className="text-red-500 text-xs mt-1">
                    Username is already taken.
                  </p>
                )}
                {!usernameError && usernameAvailable && (
                  <p className="text-green-500 text-xs mt-1">
                    Username is available!
                  </p>
                )}
              </>
            )}
          </div>

          {/* Doctor Name */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="doctorName"
            >
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
                disabled={!editFields.doctorName}
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => handleEditToggle("doctorName")}
                className="ml-2 text-gray-600 hover:text-gray-800"
                aria-label="Edit Doctor Name"
              >
                {editFields.doctorName ? <FaTimesCircle /> : <FaEdit />}
              </button>
            </div>
          </div>

          {/* Clinic Name */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="clinicName"
            >
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
                disabled={!editFields.clinicName}
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => handleEditToggle("clinicName")}
                className="ml-2 text-gray-600 hover:text-gray-800"
                aria-label="Edit Clinic Name"
              >
                {editFields.clinicName ? <FaTimesCircle /> : <FaEdit />}
              </button>
            </div>
          </div>

          {/* Clinic Location */}
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="clinicLocation"
            >
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
                disabled={!editFields.clinicLocation}
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => handleEditToggle("clinicLocation")}
                className="ml-2 text-gray-600 hover:text-gray-800"
                aria-label="Edit Clinic Location"
              >
                {editFields.clinicLocation ? <FaTimesCircle /> : <FaEdit />}
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="mb-4 relative">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
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
                disabled={!editFields.email}
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => handleEditToggle("email")}
                className="ml-2 text-gray-600 hover:text-gray-800"
                aria-label="Edit Email"
              >
                {editFields.email ? <FaTimesCircle /> : <FaEdit />}
              </button>
            </div>
            {editFields.email && (
              <>
                {otpError && (
                  <p className="text-red-500 text-xs mt-1">{otpError}</p>
                )}
                {otpSent && !emailVerified && (
                  <div className="mt-2">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-1"
                      htmlFor="otp"
                    >
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
                          <FaSpinner className="animate-spin text-xl mr-2" />
                        ) : (
                          <FaCheck />
                        )}
                        Verify
                      </button>
                    </div>
                    {/* Countdown Timer */}
                    {otpSent && !emailVerified && timer > 0 && (
                      <p className="text-gray-600 text-xs mt-1">
                        OTP expires in: {Math.floor(timer / 60)}:
                        {("0" + (timer % 60)).slice(-2)}
                      </p>
                    )}
                    {/* Expiry Message */}
                    {otpSent && !emailVerified && timer === 0 && (
                      <p className="text-red-500 text-xs mt-1">
                        OTP has expired. Please request a new one.
                      </p>
                    )}
                    {emailVerified && (
                      <p className="text-green-500 text-xs mt-1">
                        Email verified!
                      </p>
                    )}
                    {otpError && (
                      <p className="text-red-500 text-xs mt-1">{otpError}</p>
                    )}
                  </div>
                )}
                {!otpSent && !emailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                  >
                    {checkingUsername ? (
                      <FaSpinner className="animate-spin text-xl mr-2" />
                    ) : (
                      <FaPaperPlane className="text-xl mr-2" />
                    )}
                    Send OTP
                  </button>
                )}
                {emailVerified && (
                  <p className="text-green-500 text-xs mt-1">Email verified!</p>
                )}
              </>
            )}
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              New Password (Leave blank to keep current password)
            </label>
            <div
              className={`flex items-center bg-gray-100 p-2 rounded relative ${
                passwordError ? "border border-red-500" : ""
              }`}
            >
              <FaLock className="text-red-500 mr-2" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password"
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
                Password must be at least 8 characters, include one uppercase
                letter, and one special character.
              </p>
            )}
          </div>

          {/* Confirm Password */}
          {formData.password.length > 0 && (
            <div className="mb-6 relative">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="confirmPassword"
              >
                Confirm New Password
              </label>
              <div
                className={`flex items-center bg-gray-100 p-2 rounded relative ${
                  confirmPasswordError ? "border border-red-500" : ""
                }`}
              >
                <FaLock className="text-red-500 mr-2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter new password"
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
                <p className="text-red-500 text-xs mt-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center bg-gradient-to-br from-blue-600 to-teal-400 text-white py-3 rounded-lg font-medium transition duration-300 shadow-lg ${
              isSubmitting
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gradient-to-br hover:from-blue-500 hover:to-teal-300"
            }`}
          >
            {isSubmitting ? (
              <FaSpinner className="animate-spin text-xl mr-2" />
            ) : (
              <FaCheckCircle className="text-xl mr-2" />
            )}
            {isSubmitting ? "Updating..." : "Update Profile"}
          </button>

          {/* Back to Dashboard */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:underline"
              >
                Back to Dashboard
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;

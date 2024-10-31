
"use client";
import React, { useState } from "react";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaHeartbeat,
} from "react-icons/fa";
import { showToast } from "./Toast";
import { useSession } from "next-auth/react";
import { db } from "../../db"; // Adjust path to Firestore configuration
import { doc, updateDoc } from "firebase/firestore";
import { encryptData } from "../../lib/encryption"; // Import the encryption function

const UpdateProfile = () => {
  const { data: session } = useSession();
  const currentUsername = session?.user?.username || ""; // Get current username from session

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordPattern.test(password)) {
      setPasswordError(
        "Password must be at least 8 characters, include one uppercase letter, and one special character."
      );
    } else {
      setPasswordError("");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      validatePassword(value);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword((prev) => !prev);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      {/* Blinking message */}
      <div className="bg-red-500 text-white text-center py-2 mb-4 animate-blink rounded-md w-full max-w-md">
        Sorry, this feature is not currently working. We will notify you once it's available.
      </div>

      <form className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-purple-600">Update Profile</h2>

        {/* Display Current Username with Message */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">Username</label>
          <input
            type="text"
            value={currentUsername}
            disabled
            className="bg-gray-200 w-full p-2 rounded focus:outline-none text-gray-600"
          />
          <p className="text-red-500 text-xs mt-2">
            Sorry, you can't change your username once it's created.
          </p>
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">New Password</label>
          <div className="flex items-center bg-gray-100 p-2 rounded relative">
            <FaLock className="text-red-500 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="New Password"
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
          </div>
          {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
        </div>

        {/* Confirm Password Input */}
        {formData.password && (
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Confirm New Password</label>
            <div className="flex items-center bg-gray-100 p-2 rounded relative">
              <FaLock className="text-red-500 mr-2" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm New Password"
                required
                className="bg-gray-100 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-10 text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {formData.password !== formData.confirmPassword && formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>
            )}
          </div>
        )}

        {/* Disabled Submit Button */}
        <button
          type="button"
          disabled
          className="w-full flex justify-center items-center bg-gray-400 text-white py-3 rounded-lg font-medium shadow-lg cursor-not-allowed opacity-70"
        >
          <FaSpinner className="animate-spin text-xl mr-2" />
          Update Password (Unavailable)
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;

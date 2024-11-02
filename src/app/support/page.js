// pages/support.js

'use client';

import React, { useState } from 'react';
import axios from 'axios';
import {
  FaSpinner,
  FaCheck,
  FaInfoCircle,
  FaEnvelope,
  FaUser,
  FaCommentDots,
  FaCheckCircle,
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SupportPage = () => {
  const [supportForm, setSupportForm] = useState({
    email: '',
    name: '',
    reason: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSupportForm({ ...supportForm, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validations
    if (!supportForm.email || !supportForm.name || !supportForm.reason) {
      toast.error('Please fill in all the fields.');
      return;
    }

    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(supportForm.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/auth/request-email-verification', supportForm);
      if (response.status === 200) {
        toast.success('Your request has been submitted. You will receive a verification email shortly.');
        setSubmissionSuccess(true);
        // Optionally, reset the form
        setSupportForm({
          email: '',
          name: '',
          reason: '',
        });
      } else {
        toast.error('Failed to submit your request. Please try again.');
      }
    } catch (error) {
      console.error('Support Request Error:', error);
      toast.error('Error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-teal-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Container for notifications */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

      <div className="max-w-4xl w-full bg-white p-8 rounded-2xl shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">Email Verification Assistance</h1>
          <p className="mt-4 text-gray-600">
            Having trouble verifying your email? We're here to help!
          </p>
        </div>

        {/* Explanation Section */}
        <div className="mb-8">
          <div className="flex items-start mb-6">
            <FaInfoCircle className="text-blue-500 text-3xl mr-4 mt-1" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Why You Need Support</h2>
              <p className="mt-2 text-gray-600">
                Our current AWS sandbox environment requires manual verification of your email address to ensure the security and integrity of our platform. Due to these limitations, automatic verification isn't possible.
              </p>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Get Your Email Verified</h2>
            <ol className="list-decimal list-inside space-y-4 text-gray-600">
              <li className="flex items-start">
                <span className="mr-3 text-blue-500"><FaEnvelope /></span>
                <div>
                  <strong>Fill Out the Support Form:</strong> Provide your email address, name, and a brief reason for verification.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-blue-500"><FaCheck /></span>
                <div>
                  <strong>Submit Your Request:</strong> Click the "Submit Request" button to send your verification request to our support team.
                </div>
              </li>
              <li className="flex items-start">
                {/* Replaced FaSpinner (spinning) with FaEnvelope (static) */}
                <span className="mr-3 text-blue-500"><FaEnvelope /></span>
                <div>
                  <strong>Receive Verification Email:</strong> Our support team will process your request and send a verification email from our official AWS account to the address you provided.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-blue-500"><FaCheckCircle className="text-green-500" /></span>
                <div>
                  <strong>Verify Your Email:</strong> Click the verification link in the email to complete the process.
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-blue-500"><FaUser /></span>
                <div>
                  <strong>Access the App:</strong> Once verified, you'll be able to use that Email for signup to the ClinicEase app without any restrictions.
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Support Request Form */}
        {!submissionSuccess ? (
          <form onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                <FaEnvelope className="inline mr-2" /> Email Address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={supportForm.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                required
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
              />
            </div>

            {/* Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                <FaUser className="inline mr-2" /> Your Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={supportForm.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
              />
            </div>

            {/* Reason for Assistance */}
            <div className="mb-6">
              <label htmlFor="reason" className="block text-gray-700 text-sm font-bold mb-2">
                <FaCommentDots className="inline mr-2" /> Reason for Assistance
              </label>
              <textarea
                name="reason"
                id="reason"
                value={supportForm.reason}
                onChange={handleInputChange}
                placeholder="Please explain why you need assistance with email verification."
                required
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                rows="5"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center items-center bg-gradient-to-r from-blue-500 to-teal-400 text-white py-4 rounded-lg font-medium transition duration-300 ${
                isSubmitting
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:from-blue-600 hover:to-teal-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin text-lg mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <FaCheck className="text-lg mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <FaCheckCircle className="text-green-500 text-6xl mb-4 mx-auto" />
            <h2 className="text-3xl font-semibold text-gray-800 mb-2">Request Submitted!</h2>
            <p className="text-gray-600">
              Thank you for reaching out. Our support team will process your request and send a verification email from our official AWS account to you shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;

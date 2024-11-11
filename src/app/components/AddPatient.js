'use client';

import { useState, useEffect } from 'react';
import { db } from '../../db';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { encryptData, decryptData } from '../../lib/encryption';
import { useSession } from 'next-auth/react';
import { showToast } from './Toast';
import { FaUserPlus } from 'react-icons/fa';
import Tooltip from './Tooltip';
import bcrypt from 'bcryptjs';

const AddPatient = () => {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    address: '',
    mobileNumber: '',
    email: '',
    disease: '',
    notes: '',
  });
  const [patientCredentials, setPatientCredentials] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Spinner state
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false); // Prompt state

  useEffect(() => {
    if (step === 4 && (!patientCredentials.username || !patientCredentials.password)) {
      setShowGeneratePrompt(true);
    } else {
      setShowGeneratePrompt(false);
    }
  }, [step, patientCredentials]);

  const handleChange = (e) => {
    setPatientData({
      ...patientData,
      [e.target.name]: e.target.value,
    });
    // Clear the error message for the field
    setErrors({
      ...errors,
      [e.target.name]: '',
    });
  };

  const validateStep = () => {
    let valid = true;
    let newErrors = {};

    if (step === 1) {
      if (!patientData.name.trim()) {
        newErrors.name = 'Name is required';
        valid = false;
      }
      if (!patientData.age || patientData.age <= 0) {
        newErrors.age = 'Please enter a valid age';
        valid = false;
      }
      if (!patientData.gender) {
        newErrors.gender = 'Please select a gender';
        valid = false;
      }
    } else if (step === 2) {
      if (!patientData.mobileNumber.trim()) {
        newErrors.mobileNumber = 'Mobile number is required';
        valid = false;
      } else if (!/^\d{10}$/.test(patientData.mobileNumber)) {
        newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
        valid = false;
      }
      if (!patientData.email.trim()) {
        newErrors.email = 'Email is required';
        valid = false;
      } else if (!/^\S+@\S+\.\S+$/.test(patientData.email)) {
        newErrors.email = 'Please enter a valid email address';
        valid = false;
      }
      if (!patientData.address.trim()) {
        newErrors.address = 'Address is required';
        valid = false;
      }
    } else if (step === 3) {
      if (!patientData.disease.trim()) {
        newErrors.disease = 'Disease/Condition is required';
        valid = false;
      }
      // Notes can be optional or add validation if required
    } else if (step === 4) {
      // Ensure credentials are generated before submission
      if (!patientCredentials.username || !patientCredentials.password) {
        valid = false;
        showToast('Please generate credentials before submitting.', 'error');
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const generateRandomUsername = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
    const namePart = patientData.name.split(' ')[0].toLowerCase(); // Use first name
    return `${namePart}${randomNum}`;
  };

  const generateRandomPassword = () => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const checkUsernameExists = async (username) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const generateCredentials = async () => {
    let unique = false;
    let username = '';
    const password = generateRandomPassword();

    while (!unique) {
      username = generateRandomUsername();
      const usernameExists = await checkUsernameExists(username);
      if (!usernameExists) {
        unique = true;
      }
    }

    setPatientCredentials({ username, password });
    setShowGeneratePrompt(false); // Hide prompt once generated
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Start spinner

    // Validate the final step
    if (!validateStep()) {
      setIsSubmitting(false);
      return;
    }

    // Encrypt the sensitive data, but store email in plaintext
    const encryptedData = {};
    for (const key in patientData) {
      if (key === 'email') {
        encryptedData[key] = patientData[key]; // Store email in plaintext
      } else {
        encryptedData[key] = encryptData(patientData[key]);
      }
    }

    try {
      const doctorId = session.user.id;

      // Hash the patient's password
      const hashedPassword = await bcrypt.hash(
        patientCredentials.password,
        10
      );

      // Combine patient data with credentials
      const patientDocData = {
        ...encryptedData,
        username: patientCredentials.username,
        password: hashedPassword,
        role: 'patient',
        doctorId: doctorId,
        createdAt: new Date(),
        treatmentStatus: 'Ongoing', // Store as plaintext
      };

      // Add patient data to 'users' collection
      await addDoc(collection(db, 'users'), patientDocData);

      // Fetch doctor's data from 'users' collection
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '==', session.user.username),
        where('role', '==', 'doctor')
      );
      const querySnapshot = await getDocs(q);
      let doctorData = null;

      if (!querySnapshot.empty) {
        doctorData = querySnapshot.docs[0].data();
      } else {
        showToast('Error fetching doctor data', 'error');
        setIsSubmitting(false);
        return;
      }

      // Decrypt doctor's data
      const doctorName = decryptData(doctorData.doctorName);
      const clinicName = decryptData(doctorData.clinicName);
      const clinicAddress = decryptData(doctorData.clinicLocation);

      // Send email to patient
      const response = await fetch('/api/sendPatientEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: patientData.email,
          doctorName,
          clinicName,
          clinicAddress,
          username: patientCredentials.username,
          password: patientCredentials.password,
          patientName: patientData.name,
        }),
      });

      if (response.ok) {
        showToast('Patient added and email sent successfully!', 'success');
      } else {
        showToast('Patient added, but failed to send email.', 'error');
      }

      // Reset form
      setPatientData({
        name: '',
        age: '',
        gender: '',
        address: '',
        mobileNumber: '',
        email: '',
        disease: '',
        notes: '',
      });
      setPatientCredentials({
        username: '',
        password: '',
      });
      setStep(1);
    } catch (error) {
      console.error('Error adding patient:', error);
      showToast('Error adding patient. Please try again.', 'error');
    } finally {
      setIsSubmitting(false); // Stop spinner
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-0 w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-8 rounded-lg shadow-lg w-full sm:w-11/12 md:w-10/12 lg:w-full mt-10 lg:mt-0">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">
          <FaUserPlus className="inline-block mb-1" /> Add New Patient
        </h2>
        <ProgressBar step={step} />

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <StepOne
              patientData={patientData}
              handleChange={handleChange}
              nextStep={nextStep}
              errors={errors}
            />
          )}
          {step === 2 && (
            <StepTwo
              patientData={patientData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              errors={errors}
            />
          )}
          {step === 3 && (
            <StepThree
              patientData={patientData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              errors={errors}
            />
          )}
          {step === 4 && (
            <StepFour
              patientData={patientData}
              patientCredentials={patientCredentials}
              generateCredentials={generateCredentials}
              prevStep={prevStep}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              showGeneratePrompt={showGeneratePrompt}
            />
          )}
        </form>
      </div>
    </div>
  );
};

const ProgressBar = ({ step }) => {
  return (
    <div className="relative h-2 bg-gray-300 rounded-full mb-8 overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full bg-indigo-600 transition-all duration-300"
        style={{ width: `${(step / 4) * 100}%` }}
      ></div>
    </div>
  );
};

const StepOne = ({ patientData, handleChange, nextStep, errors }) => (
  <>
    <InputField
      label="Full Name"
      name="name"
      value={patientData.name}
      onChange={handleChange}
      error={errors.name}
      required
      tooltip="Enter the patient's full name."
    />
    <InputField
      label="Age"
      name="age"
      type="number"
      value={patientData.age}
      onChange={handleChange}
      error={errors.age}
      required
      tooltip="Enter the patient's age in years."
    />
    <SelectField
      label="Gender"
      name="gender"
      value={patientData.gender}
      onChange={handleChange}
      error={errors.gender}
      required
      tooltip="Select the patient's gender."
    />
    <div className="flex justify-end mt-6">
      <button
        type="button"
        onClick={nextStep}
        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
      >
        Next
      </button>
    </div>
  </>
);

const StepTwo = ({ patientData, handleChange, nextStep, prevStep, errors }) => (
  <>
    <InputField
      label="Mobile Number"
      name="mobileNumber"
      value={patientData.mobileNumber}
      onChange={handleChange}
      error={errors.mobileNumber}
      required
      tooltip="Enter a 10-digit mobile number."
    />
    <InputField
      label="Email"
      name="email"
      type="email"
      value={patientData.email}
      onChange={handleChange}
      error={errors.email}
      required
      tooltip="Enter the patient's email address."
    />
    <InputField
      label="Address"
      name="address"
      value={patientData.address}
      onChange={handleChange}
      error={errors.address}
      required
      tooltip="Enter the patient's residential address."
    />
    <div className="flex justify-between mt-6">
      <button
        type="button"
        onClick={prevStep}
        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
      >
        Back
      </button>
      <button
        type="button"
        onClick={nextStep}
        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
      >
        Next
      </button>
    </div>
  </>
);

const StepThree = ({ patientData, handleChange, nextStep, prevStep, errors }) => (
  <>
    <InputField
      label="Disease/Condition"
      name="disease"
      value={patientData.disease}
      onChange={handleChange}
      error={errors.disease}
      required
      tooltip="Enter the patient's disease or condition."
    />
    <TextareaField
      label="Notes"
      name="notes"
      value={patientData.notes}
      onChange={handleChange}
      error={errors.notes}
      tooltip="Any additional notes or comments."
    />
    <div className="mt-6 p-4 bg-white rounded shadow">
      <h3 className="text-xl font-bold mb-2 text-indigo-600">Review Information</h3>
      <p>
        <strong>Name:</strong> {patientData.name}
      </p>
      <p>
        <strong>Age:</strong> {patientData.age}
      </p>
      <p>
        <strong>Gender:</strong> {patientData.gender}
      </p>
      <p>
        <strong>Mobile:</strong> {patientData.mobileNumber}
      </p>
      {patientData.email && (
        <p>
          <strong>Email:</strong> {patientData.email}
        </p>
      )}
      {patientData.address && (
        <p>
          <strong>Address:</strong> {patientData.address}
        </p>
      )}
      {patientData.disease && (
        <p>
          <strong>Disease:</strong> {patientData.disease}
        </p>
      )}
      {patientData.notes && (
        <p>
          <strong>Notes:</strong> {patientData.notes}
        </p>
      )}
    </div>
    <div className="flex justify-between mt-6">
      <button
        type="button"
        onClick={prevStep}
        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
      >
        Back
      </button>
      <button
        type="button"
        onClick={nextStep}
        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
      >
        Next
      </button>
    </div>
  </>
);

const StepFour = ({
  patientData,
  patientCredentials,
  generateCredentials,
  prevStep,
  handleSubmit,
  isSubmitting,
  showGeneratePrompt,
}) => (
  <>
    <div className="mt-6 p-4 bg-white rounded shadow">
      <h3 className="text-xl font-bold mb-4 text-indigo-600">
        Create Patient Credentials
      </h3>
      {patientCredentials.username && patientCredentials.password ? (
        <>
          <p>
            <strong>Username:</strong> {patientCredentials.username}
          </p>
          <p>
            <strong>Password:</strong> {patientCredentials.password}
          </p>
          <button
            type="button"
            onClick={generateCredentials}
            className="bg-yellow-600 text-white py-2 px-4 rounded mt-4 hover:bg-yellow-700"
          >
            Regenerate Credentials
          </button>
        </>
      ) : (
        <>
          {showGeneratePrompt && (
            <p className="text-red-600 animate-pulse mb-4">
              Please generate credentials before submitting.
            </p>
          )}
          <button
            type="button"
            onClick={generateCredentials}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            Generate Credentials
          </button>
        </>
      )}
    </div>
    <div className="flex justify-between mt-6">
      <button
        type="button"
        onClick={prevStep}
        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
      >
        Back
      </button>
      <button
        type="submit"
        className={`${
          !patientCredentials.username || !patientCredentials.password || isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        } text-white py-2 px-4 rounded flex items-center justify-center`}
        disabled={
          !patientCredentials.username || !patientCredentials.password || isSubmitting
        }
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5 mr-3 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            Sending...
          </>
        ) : (
          'Submit and Send Email'
        )}
      </button>
    </div>
  </>
);

const InputField = ({ label, error, tooltip, ...props }) => (
  <div className="relative mb-4">
    <div className="flex items-center">
      <label className="block text-gray-700 font-semibold mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      {tooltip && <Tooltip message={tooltip} />}
    </div>
    <input
      {...props}
      className={`w-full p-3 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded focus:outline-none focus:ring-2 focus:ring-indigo-400`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const TextareaField = ({ label, error, tooltip, ...props }) => (
  <div className="relative mb-4">
    <div className="flex items-center">
      <label className="block text-gray-700 font-semibold mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      {tooltip && <Tooltip message={tooltip} />}
    </div>
    <textarea
      {...props}
      className={`w-full p-3 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded focus:outline-none focus:ring-2 focus:ring-indigo-400`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const SelectField = ({ label, name, value, onChange, error, required, tooltip }) => (
  <div className="relative mb-4">
    <div className="flex items-center">
      <label className="block text-gray-700 font-semibold mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {tooltip && <Tooltip message={tooltip} />}
    </div>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full p-3 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded focus:outline-none focus:ring-2 focus:ring-indigo-400`}
    >
      <option value="">Select Gender</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default AddPatient;

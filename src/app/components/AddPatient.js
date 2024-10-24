// src/components/AddPatient.js

'use client';

import { useState } from 'react';
import { db } from '../../db';
import { collection, addDoc } from 'firebase/firestore';
import { encryptData } from '../../lib/encryption';
import { useSession } from 'next-auth/react';
import { showToast } from './Toast';
import { FaUserPlus } from 'react-icons/fa';
import Tooltip from './Tooltip';

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
  const [errors, setErrors] = useState({});

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
      if (patientData.email && !/^\S+@\S+\.\S+$/.test(patientData.email)) {
        newErrors.email = 'Please enter a valid email address';
        valid = false;
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the final step
    if (!validateStep()) {
      return;
    }

    // Encrypt the data
    const encryptedData = {};
    for (const key in patientData) {
      encryptedData[key] = encryptData(patientData[key]);
    }

    try {
      const doctorId = session.user.id;
      await addDoc(collection(db, 'doctors', doctorId, 'patients'), {
        ...encryptedData,
        createdAt: new Date(),
      });
      showToast('Patient added successfully!', 'success');
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
      setStep(1);
    } catch (error) {
      console.error('Error adding patient:', error);
      showToast('Error adding patient. Please try again.', 'error');
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
              prevStep={prevStep}
              handleSubmit={handleSubmit}
              errors={errors}
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
        style={{ width: `${(step / 3) * 100}%` }}
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
      <button type="button" onClick={nextStep} className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
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
      tooltip="Enter the patient's email address."
    />
    <InputField
      label="Address"
      name="address"
      value={patientData.address}
      onChange={handleChange}
      error={errors.address}
      tooltip="Enter the patient's residential address."
    />
    <div className="flex justify-between mt-6">
      <button type="button" onClick={prevStep} className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600">
        Back
      </button>
      <button type="button" onClick={nextStep} className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
        Next
      </button>
    </div>
  </>
);

const StepThree = ({ patientData, handleChange, prevStep, handleSubmit, errors }) => (
  <>
    <InputField
      label="Disease/Condition"
      name="disease"
      value={patientData.disease}
      onChange={handleChange}
      error={errors.disease}
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
      <p><strong>Name:</strong> {patientData.name}</p>
      <p><strong>Age:</strong> {patientData.age}</p>
      <p><strong>Gender:</strong> {patientData.gender}</p>
      <p><strong>Mobile:</strong> {patientData.mobileNumber}</p>
      {patientData.email && <p><strong>Email:</strong> {patientData.email}</p>}
      {patientData.address && <p><strong>Address:</strong> {patientData.address}</p>}
      {patientData.disease && <p><strong>Disease:</strong> {patientData.disease}</p>}
      {patientData.notes && <p><strong>Notes:</strong> {patientData.notes}</p>}
    </div>
    <div className="flex justify-between mt-6">
      <button type="button" onClick={prevStep} className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600">
        Back
      </button>
      <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
        Submit
      </button>
    </div>
  </>
);

const InputField = ({ label, error, tooltip, ...props }) => (
  <div className="relative mb-4">
    <div className="flex items-center">
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      {tooltip && <Tooltip message={tooltip} />}
    </div>
    <input
      {...props}
      className={`w-full p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-400`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const TextareaField = ({ label, error, tooltip, ...props }) => (
  <div className="relative mb-4">
    <div className="flex items-center">
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      {tooltip && <Tooltip message={tooltip} />}
    </div>
    <textarea
      {...props}
      className={`w-full p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-400`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const SelectField = ({ label, name, value, onChange, error, required, tooltip }) => (
  <div className="relative mb-4">
    <div className="flex items-center">
      <label className="block text-gray-700 font-semibold mb-1">{label}</label>
      {tooltip && <Tooltip message={tooltip} />}
    </div>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-400`}
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

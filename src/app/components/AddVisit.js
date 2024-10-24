// src/components/AddVisit.js

'use client';

import { useState, useEffect } from 'react';
import { db } from '../../db';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { encryptData, decryptData } from '../../lib/encryption';
import { useSession } from 'next-auth/react';
import { showToast } from './Toast';
import Select from 'react-select';
import { FaNotesMedical } from 'react-icons/fa';

const AddVisit = () => {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitData, setVisitData] = useState({
    visitDate: '',
    visitReason: '',
    symptoms: '',
    diagnosis: '',
    medicineGiven: '',
    treatmentStatus: '',
    nextVisitDate: '',
    totalAmount: '',
    amountPaid: '',
    notes: '',
  });
  const [patientDetails, setPatientDetails] = useState({});
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [visitHistory, setVisitHistory] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        if (!session || !session.user || !session.user.id) {
          console.error('Session data is not available');
          return;
        }
        const doctorId = session.user.id;
        const patientsRef = collection(db, 'doctors', doctorId, 'patients');
        const querySnapshot = await getDocs(patientsRef);

        const patientList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: decryptData(data.name),
          };
        });

        setPatients(patientList);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
    fetchPatients();
  }, [session]);

  const handlePatientChange = async (option) => {
    setSelectedPatient(option);
    await fetchVisitHistory(option.value);
    await fetchPatientDetails(option.value);
    setErrors({ ...errors, selectedPatient: '' });
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const doctorId = session.user.id;
      const patientRef = doc(db, 'doctors', doctorId, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);
      if (patientDoc.exists()) {
        const patientData = patientDoc.data();
        setPatientDetails({
          name: decryptData(patientData.name),
          disease: decryptData(patientData.disease),
          address: decryptData(patientData.address),
          mobileNumber: decryptData(patientData.mobileNumber),
          treatmentStatus: decryptData(patientData.treatmentStatus || ''),
        });
      } else {
        console.error('No such patient document!');
        setPatientDetails({});
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      setPatientDetails({});
    }
  };

  const fetchVisitHistory = async (patientId) => {
    try {
      const doctorId = session.user.id;
      const visitsRef = collection(
        db,
        'doctors',
        doctorId,
        'patients',
        patientId,
        'visits'
      );
      const q = query(visitsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const visits = [];
      let totalAmount = 0;
      let totalPaid = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const visit = {
          visitDate: decryptData(data.visitDate),
          medicineGiven: decryptData(data.medicineGiven),
          totalAmount: parseFloat(decryptData(data.totalAmount) || '0'),
          amountPaid: parseFloat(decryptData(data.amountPaid) || '0'),
          nextVisitDate: decryptData(data.nextVisitDate),
          treatmentStatus: decryptData(data.treatmentStatus || ''),
        };
        totalAmount += visit.totalAmount;
        totalPaid += visit.amountPaid;
        visits.push(visit);
      });

      setVisitHistory(visits);
      setRemainingBalance(totalAmount - totalPaid);
    } catch (error) {
      console.error('Error fetching visit history:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVisitData({
      ...visitData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: '',
    });

    // Disable next visit date if treatment status is 'Completed'
    if (name === 'treatmentStatus' && value === 'Completed') {
      setVisitData((prevData) => ({
        ...prevData,
        nextVisitDate: '',
      }));
    }
  };

  const validateStep = () => {
    let valid = true;
    let newErrors = {};

    if (step === 1) {
      if (!selectedPatient) {
        newErrors.selectedPatient = 'Please select a patient';
        valid = false;
      }
    } else if (step === 2) {
      if (!visitData.visitDate) {
        newErrors.visitDate = 'Visit date is required';
        valid = false;
      }
      if (!visitData.visitReason.trim()) {
        newErrors.visitReason = 'Please enter the reason for the visit';
        valid = false;
      }
      if (!visitData.diagnosis.trim()) {
        newErrors.diagnosis = 'Diagnosis is required';
        valid = false;
      }
    } else if (step === 3) {
      if (!visitData.treatmentStatus) {
        newErrors.treatmentStatus = 'Please select a treatment status';
        valid = false;
      }
      if (
        visitData.treatmentStatus !== 'Completed' &&
        !visitData.nextVisitDate
      ) {
        newErrors.nextVisitDate = 'Next visit date is required';
        valid = false;
      }
      if (!visitData.totalAmount) {
        newErrors.totalAmount = 'Total amount is required';
        valid = false;
      } else if (isNaN(visitData.totalAmount) || visitData.totalAmount < 0) {
        newErrors.totalAmount = 'Please enter a valid amount';
        valid = false;
      }
      if (!visitData.amountPaid) {
        newErrors.amountPaid = 'Amount paid is required';
        valid = false;
      } else if (isNaN(visitData.amountPaid) || visitData.amountPaid < 0) {
        newErrors.amountPaid = 'Please enter a valid amount';
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

  const calculateNewBalance = () => {
    const totalAmount = parseFloat(visitData.totalAmount || '0');
    const amountPaid = parseFloat(visitData.amountPaid || '0');
    return remainingBalance + totalAmount - amountPaid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) {
      return;
    }

    const encryptedData = {};
    for (const key in visitData) {
      encryptedData[key] = encryptData(visitData[key]);
    }

    try {
      const doctorId = session.user.id;
      const patientId = selectedPatient.value;

      await addDoc(
        collection(db, 'doctors', doctorId, 'patients', patientId, 'visits'),
        {
          ...encryptedData,
          createdAt: new Date(),
        }
      );

      // Update patient's treatment status in their main record
      const patientRef = doc(db, 'doctors', doctorId, 'patients', patientId);
      await updateDoc(patientRef, {
        treatmentStatus: encryptData(visitData.treatmentStatus),
      });

      showToast('Visit added successfully!', 'success');
      setVisitData({
        visitDate: '',
        visitReason: '',
        symptoms: '',
        diagnosis: '',
        medicineGiven: '',
        treatmentStatus: '',
        nextVisitDate: '',
        totalAmount: '',
        amountPaid: '',
        notes: '',
      });
      setStep(1);
      setSelectedPatient(null);
      setVisitHistory([]);
      setRemainingBalance(0);
    } catch (error) {
      console.error('Error adding visit:', error);
      showToast('Error adding visit. Please try again.', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-0">
      <div className="bg-gradient-to-r from-green-50 to-teal-100 p-8 rounded-lg shadow-lg w-full sm:w-11/12 md:w-10/12 lg:w-full mt-10 lg:mt-0 relative">
        <h2 className="text-3xl font-bold mb-6 text-center text-teal-600">
          <FaNotesMedical className="inline-block mb-1" /> Add Patient Visit
        </h2>
        <ProgressBar step={step} />

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <StepOne
              patients={patients}
              selectedPatient={selectedPatient}
              handlePatientChange={handlePatientChange}
              nextStep={nextStep}
              errors={errors}
              patientDetails={patientDetails}
            />
          )}
          {step === 2 && (
            <StepTwo
              visitData={visitData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              errors={errors}
            />
          )}
          {step === 3 && (
            <StepThree
              visitData={visitData}
              handleChange={handleChange}
              nextStep={nextStep}
              prevStep={prevStep}
              errors={errors}
            />
          )}
          {step === 4 && (
            <StepFour
              visitData={visitData}
              prevStep={prevStep}
              handleSubmit={handleSubmit}
              remainingBalance={remainingBalance}
              calculateNewBalance={calculateNewBalance}
              patientDetails={patientDetails}
            />
          )}
        </form>
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ step }) => {
  return (
    <div
      className="relative h-2 bg-gray-300 rounded-full mb-8 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <div
        className="absolute left-0 top-0 h-full bg-teal-600 transition-all duration-300"
        style={{ width: `${(step / 4) * 100}%` }}
      ></div>
    </div>
  );
};

// Step One Component
const StepOne = ({
  patients,
  selectedPatient,
  handlePatientChange,
  nextStep,
  errors,
  patientDetails,
}) => (
  <>
    <div className="mb-6 relative">
      <label className="block text-gray-700 font-semibold mb-2">
        Select Patient
      </label>
      <Select
        options={patients.map((patient) => ({
          value: patient.id,
          label: patient.name,
        }))}
        value={selectedPatient}
        onChange={handlePatientChange}
        placeholder="Choose a patient..."
        classNamePrefix="react-select"
        styles={{
          menu: (provided) => ({ ...provided, zIndex: 9999 }),
          control: (provided) => ({
            ...provided,
            borderColor: errors.selectedPatient ? 'red' : provided.borderColor,
            zIndex: 2,
          }),
        }}
        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
        menuPosition="fixed"
      />
      {errors.selectedPatient && (
        <p className="text-red-500 text-sm mt-1">{errors.selectedPatient}</p>
      )}
    </div>
    {selectedPatient && patientDetails && (
      <div className="mt-4 p-4 bg-white rounded shadow">
        <p>
          <strong>Name:</strong> {patientDetails.name || 'N/A'}
        </p>
        <p>
          <strong>Disease:</strong> {patientDetails.disease || 'N/A'}
        </p>
        <p>
          <strong>Treatment Status:</strong>{' '}
          {patientDetails.treatmentStatus || 'N/A'}
        </p>
        <p>
          <strong>Mobile Number:</strong> {patientDetails.mobileNumber || 'N/A'}
        </p>
        <p>
          <strong>Address:</strong> {patientDetails.address || 'N/A'}
        </p>
      </div>
    )}
    <div className="flex justify-end mt-6">
      <button
        type="button"
        onClick={nextStep}
        className="bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700"
      >
        Next
      </button>
    </div>
  </>
);

// Step Two Component (Medical Details)
const StepTwo = ({ visitData, handleChange, nextStep, prevStep, errors }) => (
  <>
    <InputField
      label="Visit Date"
      name="visitDate"
      type="date"
      value={visitData.visitDate}
      onChange={handleChange}
      error={errors.visitDate}
      required
    />
    <InputField
      label="Reason for Visit"
      name="visitReason"
      value={visitData.visitReason}
      onChange={handleChange}
      error={errors.visitReason}
      required
    />
    <TextareaField
      label="Symptoms Observed"
      name="symptoms"
      value={visitData.symptoms}
      onChange={handleChange}
      error={errors.symptoms}
    />
    <TextareaField
      label="Diagnosis"
      name="diagnosis"
      value={visitData.diagnosis}
      onChange={handleChange}
      error={errors.diagnosis}
      required
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
        className="bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700"
      >
        Next
      </button>
    </div>
  </>
);

// Step Three Component (Financial Details)
const StepThree = ({ visitData, handleChange, nextStep, prevStep, errors }) => (
  <>
    <SelectField
      label="Treatment Status"
      name="treatmentStatus"
      value={visitData.treatmentStatus}
      onChange={handleChange}
      options={[
        { value: '', label: 'Select' },
        { value: 'Ongoing', label: 'Ongoing' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Paused', label: 'Paused' },
      ]}
      error={errors.treatmentStatus}
      required
    />
    <InputField
      label="Next Visit Date"
      name="nextVisitDate"
      type="date"
      value={visitData.nextVisitDate}
      onChange={handleChange}
      error={errors.nextVisitDate}
      disabled={visitData.treatmentStatus === 'Completed'}
      required={visitData.treatmentStatus !== 'Completed'}
    />
    <InputField
      label="Total Amount (₹)"
      name="totalAmount"
      type="number"
      step="0.01"
      value={visitData.totalAmount}
      onChange={handleChange}
      error={errors.totalAmount}
    />
    <InputField
      label="Amount Paid (₹)"
      name="amountPaid"
      type="number"
      step="0.01"
      value={visitData.amountPaid}
      onChange={handleChange}
      error={errors.amountPaid}
    />
    <TextareaField
      label="Additional Notes"
      name="notes"
      value={visitData.notes}
      onChange={handleChange}
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
        className="bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700"
      >
        Next
      </button>
    </div>
  </>
);

// Step Four Component (Review & Submit)
const StepFour = ({
  visitData,
  prevStep,
  handleSubmit,
  remainingBalance,
  calculateNewBalance,
  patientDetails,
}) => (
  <>
    <div className="mt-6 p-4 bg-white rounded shadow">
      <h3 className="text-xl font-bold mb-2 text-teal-600">
        Review Visit Details
      </h3>
      <p>
        <strong>Patient Name:</strong> {patientDetails.name}
      </p>
      <p>
        <strong>Treatment Status:</strong> {visitData.treatmentStatus}
      </p>
      <p>
        <strong>Date:</strong> {visitData.visitDate}
      </p>
      <p>
        <strong>Reason for Visit:</strong> {visitData.visitReason}
      </p>
      <p>
        <strong>Diagnosis:</strong> {visitData.diagnosis}
      </p>
      <p>
        <strong>Total Amount:</strong> ₹{visitData.totalAmount}
      </p>
      <p>
        <strong>Amount Paid:</strong> ₹{visitData.amountPaid}
      </p>
      <p>
        <strong>Remaining Balance After This Visit:</strong> ₹
        {calculateNewBalance().toFixed(2)}
      </p>
      {visitData.nextVisitDate && (
        <p>
          <strong>Next Visit Date:</strong> {visitData.nextVisitDate}
        </p>
      )}
      {visitData.notes && (
        <p>
          <strong>Notes:</strong> {visitData.notes}
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
        type="submit"
        onClick={handleSubmit}
        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
      >
        Submit
      </button>
    </div>
  </>
);

// Input and Textarea Fields
const InputField = ({ label, error, ...props }) => (
  <div className="relative mb-4">
    <label className="block text-gray-700 font-semibold mb-1">{label}</label>
    <input
      {...props}
      className={`w-full p-3 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded focus:outline-none focus:ring-2 focus:ring-teal-400`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const TextareaField = ({ label, error, ...props }) => (
  <div className="relative mb-4">
    <label className="block text-gray-700 font-semibold mb-1">{label}</label>
    <textarea
      {...props}
      className={`w-full p-3 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded focus:outline-none focus:ring-2 focus:ring-teal-400`}
    ></textarea>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
}) => (
  <div className="relative mb-4">
    <label className="block text-gray-700 font-semibold mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full p-3 border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded focus:outline-none focus:ring-2 focus:ring-teal-400`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default AddVisit;

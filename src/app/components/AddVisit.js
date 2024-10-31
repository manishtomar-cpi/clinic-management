// src/app/components/AddVisit.js

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
  where,
} from 'firebase/firestore';
import { encryptData, decryptData } from '../../lib/encryption';
import { useSession } from 'next-auth/react';
import { showToast } from './Toast';
import Select from 'react-select';
import {
  FaNotesMedical,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaClock,
  FaHeartbeat,
  FaTimesCircle,
  FaCheckCircle,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// Helper function to format dates from 'yyyy-mm-dd' to 'dd-mm-yyyy'
const formatDateForStorage = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

// Mapping of visit statuses to their corresponding background colors
const visitStatusStyles = {
  Upcoming: 'bg-yellow-100',
  Rescheduled: 'bg-blue-100',
  Missed: 'bg-red-100',
  'Rescheduled but Missed': 'bg-orange-100',
};

const AddVisit = () => {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitData, setVisitData] = useState({
    visitDate: '',
    visitTime: '',
    visitReason: '',
    symptoms: '',
    medicines: [], // Array to hold medicines with timings
    treatmentStatus: '',
    nextVisitDate: '',
    nextVisitTime: '',
    totalAmount: '',
    amountPaid: '',
    notes: '',
  });
  const [patientDetails, setPatientDetails] = useState({});
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [visitHistory, setVisitHistory] = useState([]);
  const [scheduledVisit, setScheduledVisit] = useState(null);
  const [errors, setErrors] = useState({});
  const [visitNumber, setVisitNumber] = useState(0); // Track visit number
  const [isSubmitting, setIsSubmitting] = useState(false); // Submit button spinner
  const [isSendingEmail, setIsSendingEmail] = useState(false); // Send Email button spinner
  const [emailSent, setEmailSent] = useState(false); // Track if email has been sent
  const router = useRouter(); // For navigation

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        if (!session || !session.user || !session.user.id) {
          console.error('Session data is not available');
          return;
        }
        const doctorId = session.user.id;
        const patientsRef = collection(db, 'doctors', doctorId, 'patients');
        const q = query(patientsRef, orderBy('name'));
        const querySnapshot = await getDocs(q);

        const patientList = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: decryptData(data.name),
              treatmentStatus: data.treatmentStatus || '',
            };
          })
          .filter((patient) => patient.treatmentStatus !== 'Completed');

        setPatients(patientList);
      } catch (error) {
        console.error('Error fetching patients:', error);
        showToast('Error fetching patients. Please try again later.', 'error');
      }
    };
    fetchPatients();
  }, [session]);

  // Fetch scheduled visit if exists
  const fetchScheduledVisit = async (patientId) => {
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
      let scheduled = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          ['Upcoming', 'Rescheduled but Missed', 'Rescheduled', 'Missed'].includes(
            data.visitStatus
          )
        ) {
          scheduled = {
            id: doc.id,
            ...data,
          };
          // Assuming only one scheduled visit is needed; break the loop
          return;
        }
      });

      setScheduledVisit(scheduled);
    } catch (error) {
      console.error('Error fetching scheduled visit:', error);
      showToast('Error fetching scheduled visit.', 'error');
    }
  };

  const handlePatientChange = async (option) => {
    setSelectedPatient(option);
    await fetchVisitHistory(option.value);
    await fetchPatientDetails(option.value);
    await fetchScheduledVisit(option.value);
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
          treatmentStatus: patientData.treatmentStatus || '',
          email: decryptData(patientData.email), // Assuming email is encrypted
        });
      } else {
        console.error('No such patient document!');
        setPatientDetails({});
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      showToast('Error fetching patient details.', 'error');
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
      let maxVisitNumber = 0;
      const visits = [];
      let totalAmount = 0;
      let totalPaid = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const currentVisitNumber = data.visitNumber || 0;
        if (currentVisitNumber > maxVisitNumber) {
          maxVisitNumber = currentVisitNumber;
        }
        const visit = {
          id: doc.id,
          visitDate: data.visitDate,
          visitTime: data.visitTime,
          totalAmount: parseFloat(data.totalAmount || '0'),
          amountPaid: parseFloat(data.amountPaid || '0'),
          nextVisitDate: data.nextVisitDate,
          nextVisitTime: data.nextVisitTime,
          treatmentStatus: data.treatmentStatus || '',
          visitStatus: data.visitStatus || '',
          visitNumber: currentVisitNumber,
        };
        totalAmount += visit.totalAmount;
        totalPaid += visit.amountPaid;
        visits.push(visit);
      });

      setVisitHistory(visits);
      setRemainingBalance(totalAmount - totalPaid);
      setVisitNumber(maxVisitNumber + 1); // Set new visitNumber to max +1
    } catch (error) {
      console.error('Error fetching visit history:', error);
      showToast('Error fetching visit history.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('medicine_')) {
      // Handle medicine inputs
      const [_, field, index] = name.split('_'); // e.g., ['medicine', 'name', '0']
      const idx = parseInt(index, 10);
      const updatedMedicines = [...visitData.medicines];
      
      if (!updatedMedicines[idx]) {
        // If the medicine at this index doesn't exist, initialize it
        updatedMedicines[idx] = { name: '', timings: { morning: false, afternoon: false, night: false } };
      }

      if (field === 'name') {
        updatedMedicines[idx].name = value;
      } else if (field === 'timing') {
        updatedMedicines[idx].timings[value] = checked;
      }

      setVisitData({
        ...visitData,
        medicines: updatedMedicines,
      });
    } else {
      setVisitData({
        ...visitData,
        [name]: value,
      });

      // Disable next visit date and time if treatment status is 'Completed'
      if (name === 'treatmentStatus' && value === 'Completed') {
        setVisitData((prevData) => ({
          ...prevData,
          nextVisitDate: '',
          nextVisitTime: '',
        }));
      }
    }

    setErrors({
      ...errors,
      [name]: '',
    });
  };

  // Handle adding medicines
  const handleAddMedicine = () => {
    setVisitData({
      ...visitData,
      medicines: [
        ...visitData.medicines,
        { name: '', timings: { morning: false, afternoon: false, night: false } },
      ],
    });
  };

  // Handle removing a medicine
  const handleRemoveMedicine = (index) => {
    const updatedMedicines = [...visitData.medicines];
    updatedMedicines.splice(index, 1);
    setVisitData({
      ...visitData,
      medicines: updatedMedicines,
    });
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
      if (!visitData.visitTime) {
        newErrors.visitTime = 'Visit time is required';
        valid = false;
      }
      if (!visitData.visitReason.trim()) {
        newErrors.visitReason = 'Please enter the reason for the visit';
        valid = false;
      }
      if (visitData.medicines.length === 0) {
        newErrors.medicines = 'Please add at least one medicine';
        valid = false;
      } else {
        visitData.medicines.forEach((med, index) => {
          if (!med.name.trim()) {
            newErrors[`medicine_name_${index}`] = 'Medicine name is required';
            valid = false;
          }
          if (
            !med.timings.morning &&
            !med.timings.afternoon &&
            !med.timings.night
          ) {
            newErrors[`medicine_timing_${index}`] =
              'Select at least one timing';
            valid = false;
          }
        });
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
      if (
        visitData.treatmentStatus !== 'Completed' &&
        !visitData.nextVisitTime
      ) {
        newErrors.nextVisitTime = 'Next visit time is required';
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
      } else if (
        parseFloat(visitData.amountPaid) > parseFloat(visitData.totalAmount)
      ) {
        newErrors.amountPaid = 'Amount paid cannot exceed total amount';
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

  // Function to submit the visit (without sending email)
  const handleSubmitVisit = async () => {
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true); // Start spinner for Submit Visit

    // Prepare data to store
    const dataToStore = {};
    // Fields to store unencrypted
    const plaintextFields = [
      'treatmentStatus',
      'visitDate',
      'visitTime',
      'totalAmount',
      'amountPaid',
      'visitReason',
      'visitNumber',
    ];
    // Encrypt the rest
    for (const key in visitData) {
      if (plaintextFields.includes(key)) {
        if (key === 'visitDate' || key === 'nextVisitDate') {
          dataToStore[key] = formatDateForStorage(visitData[key]);
        } else {
          dataToStore[key] = visitData[key];
        }
      } else {
        // Exclude nextVisitDate and nextVisitTime from the current visit
        if (key === 'nextVisitDate' || key === 'nextVisitTime') {
          continue;
        }
        if (key === 'medicines') {
          // Serialize the medicines array before encryption
          dataToStore[key] = encryptData(JSON.stringify(visitData[key]));
        } else {
          // Ensure that we pass a string to encryptData
          dataToStore[key] = encryptData(visitData[key] || '');
        }
      }
    }

    // Add visitNumber
    dataToStore['visitNumber'] = visitNumber;

    // Set visitStatus to 'Completed' for current visit
    dataToStore['visitStatus'] = 'Completed';

    try {
      const doctorId = session.user.id;
      const patientId = selectedPatient.value;

      // Add the current visit to the patient's visits collection
      const currentVisitRef = await addDoc(
        collection(db, 'doctors', doctorId, 'patients', patientId, 'visits'),
        {
          ...dataToStore,
          createdAt: new Date(),
        }
      );

      // Update patient's treatment status in their main record
      const patientRef = doc(db, 'doctors', doctorId, 'patients', patientId);
      await updateDoc(patientRef, {
        treatmentStatus: visitData.treatmentStatus, // Store as plaintext
      });

      // Handle Scheduled Visit
      if (visitData.nextVisitDate && visitData.nextVisitTime) {
        const scheduledVisitData = {
          visitDate: formatDateForStorage(visitData.nextVisitDate),
          visitTime: visitData.nextVisitTime,
          visitStatus: 'Upcoming',
          createdAt: new Date(),
        };

        if (scheduledVisit) {
          // Update existing scheduled visit
          const scheduledVisitRef = doc(
            db,
            'doctors',
            doctorId,
            'patients',
            patientId,
            'visits',
            scheduledVisit.id
          );
          await updateDoc(scheduledVisitRef, {
            ...scheduledVisitData,
          });
        } else {
          // Add new scheduled visit
          await addDoc(
            collection(db, 'doctors', doctorId, 'patients', patientId, 'visits'),
            scheduledVisitData
          );
        }
      }

      showToast('Visit added successfully!', 'success');
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error adding visit:', error);
      showToast('Error adding visit. Please try again.', 'error');
    } finally {
      setIsSubmitting(false); // Stop spinner for Submit Visit
    }
  };

  // Function to send email to patient
  const handleSendEmail = async () => {
    if (!selectedPatient || !patientDetails.email) {
      showToast('Patient email is not available.', 'error');
      return;
    }

    if (!validateStep()) {
      return;
    }

    setIsSendingEmail(true); // Start spinner for Send Email

    try {
      const doctorId = session.user.id;
      const patientId = selectedPatient.value;

      // Fetch doctor's data from 'users' collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', session.user.username));
      const querySnapshot = await getDocs(q);
      let doctorData = null;

      if (!querySnapshot.empty) {
        doctorData = querySnapshot.docs[0].data();
      } else {
        showToast('Error fetching doctor data', 'error');
        setIsSendingEmail(false);
        return;
      }

      // Decrypt doctor's data
      const doctorName = decryptData(doctorData.doctorName);
      const clinicName = decryptData(doctorData.clinicName);
      const clinicAddress = decryptData(doctorData.clinicLocation);

      // Send email to patient with PDF attachment
      const response = await fetch('/api/sendVisitEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: patientDetails.email,
          doctorName,
          clinicName,
          clinicAddress,
          patientName: patientDetails.name,
          visitData,
          visitNumber,
        }),
      });

      if (response.ok) {
        showToast('Email sent successfully!', 'success');
        setEmailSent(true); // Update the emailSent state
      } else {
        const errorData = await response.json();
        showToast(
          `Failed to send email: ${errorData.message || 'Unknown error'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Error sending email. Please try again.', 'error');
    } finally {
      setIsSendingEmail(false); // Stop spinner for Send Email
    }
  };

  // Function to reset the form
  const resetForm = () => {
    setVisitData({
      visitDate: '',
      visitTime: '',
      visitReason: '',
      symptoms: '',
      medicines: [],
      treatmentStatus: '',
      nextVisitDate: '',
      nextVisitTime: '',
      totalAmount: '',
      amountPaid: '',
      notes: '',
    });
    setStep(1);
    setSelectedPatient(null);
    setVisitHistory([]);
    setScheduledVisit(null);
    setRemainingBalance(0);
    setVisitNumber(0);
    setErrors({});
    setEmailSent(false); // Reset emailSent state
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-0">
      <div className="bg-gradient-to-r from-green-50 to-teal-100 p-8 rounded-lg shadow-lg w-full sm:w-11/12 md:w-10/12 lg:w-full mt-10 lg:mt-0 relative">
        <h2 className="text-3xl font-bold mb-6 text-teal-600 flex items-center justify-center">
          <FaNotesMedical className="inline-block mb-1 mr-2" /> Add Patient Visit
        </h2>
        <ProgressBar step={step} />

        <form>
          {step === 1 && (
            <StepOne
              patients={patients}
              selectedPatient={selectedPatient}
              handlePatientChange={handlePatientChange}
              nextStep={nextStep}
              errors={errors}
              patientDetails={patientDetails}
              scheduledVisit={scheduledVisit}
              visitHistory={visitHistory}
              visitNumber={visitNumber}
            />
          )}
          {step === 2 && (
            <StepTwo
              visitData={visitData}
              handleChange={handleChange}
              handleAddMedicine={handleAddMedicine}
              handleRemoveMedicine={handleRemoveMedicine}
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
              handleSubmitVisit={handleSubmitVisit}
              handleSendEmail={handleSendEmail}
              remainingBalance={remainingBalance}
              calculateNewBalance={calculateNewBalance}
              patientDetails={patientDetails}
              scheduledVisit={scheduledVisit}
              visitNumber={visitNumber}
              visitHistory={visitHistory}
              isSubmitting={isSubmitting}
              isSendingEmail={isSendingEmail}
              emailSent={emailSent}
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
  scheduledVisit,
  visitHistory,
  visitNumber,
}) => {
  // Function to get the appropriate background color based on visitStatus
  const getScheduledVisitStyle = (status) => {
    return visitStatusStyles[status] || 'bg-gray-100';
  };

  // Function to get icon based on visitStatus
  const getScheduledVisitIcon = (status) => {
    switch (status) {
      case 'Upcoming':
        return <FaClock className="inline-block mr-2" />;
      case 'Rescheduled':
        return <FaHeartbeat className="inline-block mr-2" />;
      case 'Missed':
        return <FaTimesCircle className="inline-block mr-2" />;
      case 'Rescheduled but Missed':
        return <FaCheckCircle className="inline-block mr-2" />;
      default:
        return null;
    }
  };

  return (
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
              borderColor: errors.selectedPatient
                ? 'red'
                : provided.borderColor,
              zIndex: 2,
            }),
          }}
          menuPortalTarget={
            typeof window !== 'undefined' ? document.body : null
          }
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
            <strong>Mobile Number:</strong>{' '}
            {patientDetails.mobileNumber || 'N/A'}
          </p>
          <p>
            <strong>Address:</strong> {patientDetails.address || 'N/A'}
          </p>
        </div>
      )}
      {visitNumber > 1 && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <p>
            <strong>This is visit number:</strong> {visitNumber}
          </p>
          <p>
            <strong>Previous Visit Date:</strong>{' '}
            {visitHistory[0]?.visitDate || 'N/A'}
          </p>
        </div>
      )}
      {scheduledVisit && (
        <div
          className={`mt-4 p-4 rounded shadow ${getScheduledVisitStyle(
            scheduledVisit.visitStatus
          )}`}
        >
          <h3 className="text-lg font-semibold mb-2">
            {getScheduledVisitIcon(scheduledVisit.visitStatus)} Scheduled Visit
          </h3>
          <p>
            <strong>Date:</strong> {scheduledVisit.visitDate || 'N/A'}
          </p>
          <p>
            <strong>Time:</strong> {scheduledVisit.visitTime || 'N/A'}
          </p>
          <p>
            <strong>Status:</strong> {scheduledVisit.visitStatus || 'N/A'}
          </p>
        </div>
      )}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={nextStep}
          className="bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 flex items-center"
        >
          Next
        </button>
      </div>
    </>
  );
};

// Step Two Component (Medical Details)
const StepTwo = ({
  visitData,
  handleChange,
  handleAddMedicine,
  handleRemoveMedicine,
  nextStep,
  prevStep,
  errors,
}) => (
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
      label="Visit Time"
      name="visitTime"
      type="time"
      value={visitData.visitTime}
      onChange={handleChange}
      error={errors.visitTime}
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
    <div className="mb-4">
      <label className="block text-gray-700 font-semibold mb-2">
        Medicines Prescribed
      </label>
      {visitData.medicines.map((med, index) => (
        <div
          key={index}
          className="p-4 mb-2 border rounded bg-white relative flex flex-col sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex-1">
            <InputField
              label={`Medicine Name`}
              name={`medicine_name_${index}`}
              value={med.name}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: `medicine_name_${index}`,
                    value: e.target.value,
                  },
                })
              }
              error={errors[`medicine_name_${index}`]}
              required
            />
            <div className="flex items-center flex-wrap">
              <span className="mr-2 font-semibold">Timings:</span>
              <label className="mr-4 flex items-center">
                <input
                  type="checkbox"
                  name={`medicine_timing_${index}`}
                  value="morning"
                  checked={med.timings.morning}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: `medicine_timing_${index}`,
                        value: e.target.value,
                        checked: e.target.checked,
                      },
                    })
                  }
                  className="mr-1"
                />
                Morning
              </label>
              <label className="mr-4 flex items-center">
                <input
                  type="checkbox"
                  name={`medicine_timing_${index}`}
                  value="afternoon"
                  checked={med.timings.afternoon}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: `medicine_timing_${index}`,
                        value: e.target.value,
                        checked: e.target.checked,
                      },
                    })
                  }
                  className="mr-1"
                />
                Afternoon
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name={`medicine_timing_${index}`}
                  value="night"
                  checked={med.timings.night}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: `medicine_timing_${index}`,
                        value: e.target.value,
                        checked: e.target.checked,
                      },
                    })
                  }
                  className="mr-1"
                />
                Night
              </label>
            </div>
            {errors[`medicine_timing_${index}`] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[`medicine_timing_${index}`]}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleRemoveMedicine(index)}
            className="mt-4 sm:mt-0 sm:ml-4 bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center justify-center"
          >
            <FaTrash />
          </button>
        </div>
      ))}
      {errors.medicines && (
        <p className="text-red-500 text-sm mt-1">{errors.medicines}</p>
      )}
      <button
        type="button"
        onClick={handleAddMedicine}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex items-center mt-2"
      >
        <FaPlus className="mr-2" /> Add Medicine
      </button>
    </div>
    <div className="flex justify-between mt-6">
      <button
        type="button"
        onClick={prevStep}
        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 flex items-center"
      >
        Back
      </button>
      <button
        type="button"
        onClick={nextStep}
        className="bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 flex items-center"
      >
        Next
      </button>
    </div>
  </>
);

// Step Three Component (Treatment & Financial Details)
const StepThree = ({
  visitData,
  handleChange,
  nextStep,
  prevStep,
  errors,
}) => (
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
    {visitData.treatmentStatus !== 'Completed' && (
      <>
        <InputField
          label="Next Visit Date"
          name="nextVisitDate"
          type="date"
          value={visitData.nextVisitDate}
          onChange={handleChange}
          error={errors.nextVisitDate}
          required
        />
        <InputField
          label="Next Visit Time"
          name="nextVisitTime"
          type="time"
          value={visitData.nextVisitTime}
          onChange={handleChange}
          error={errors.nextVisitTime}
          required
        />
      </>
    )}
    <InputField
      label="Total Amount (₹)"
      name="totalAmount"
      type="number"
      step="0.01"
      value={visitData.totalAmount}
      onChange={handleChange}
      error={errors.totalAmount}
      required
    />
    <InputField
      label="Amount Paid (₹)"
      name="amountPaid"
      type="number"
      step="0.01"
      value={visitData.amountPaid}
      onChange={handleChange}
      error={errors.amountPaid}
      required
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
        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 flex items-center"
      >
        Back
      </button>
      <button
        type="button"
        onClick={nextStep}
        className="bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 flex items-center"
      >
        Next
      </button>
    </div>
  </>
);

// Step Four Component (Review & Actions)
const StepFour = ({
  visitData,
  prevStep,
  handleSubmitVisit,
  handleSendEmail,
  remainingBalance,
  calculateNewBalance,
  patientDetails,
  scheduledVisit,
  visitNumber,
  visitHistory,
  isSubmitting,
  isSendingEmail,
  emailSent,
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
        <strong>Visit Number:</strong> {visitNumber}
      </p>
      {visitNumber > 1 && (
        <p>
          <strong>Previous Visit Date:</strong>{' '}
          {visitHistory[0]?.visitDate || 'N/A'}
        </p>
      )}
      <p>
        <strong>Date:</strong> {formatDateForStorage(visitData.visitDate)}
      </p>
      <p>
        <strong>Time:</strong> {visitData.visitTime}
      </p>
      <p>
        <strong>Reason for Visit:</strong> {visitData.visitReason}
      </p>
      <p>
        <strong>Medicines Prescribed:</strong>
      </p>
      <ul className="list-disc list-inside">
        {visitData.medicines.map((med, index) => (
          <li key={index}>
            {med.name} -{' '}
            {[
              med.timings.morning && 'Morning',
              med.timings.afternoon && 'Afternoon',
              med.timings.night && 'Night',
            ]
              .filter(Boolean)
              .join(', ')}
          </li>
        ))}
      </ul>
      <p>
        <strong>Visit Status:</strong> Completed
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
          <strong>Next Visit Date:</strong>{' '}
          {formatDateForStorage(visitData.nextVisitDate)}
        </p>
      )}
      {visitData.nextVisitTime && (
        <p>
          <strong>Next Visit Time:</strong> {visitData.nextVisitTime}
        </p>
      )}
      {visitData.notes && (
        <p>
          <strong>Notes:</strong> {visitData.notes}
        </p>
      )}
      {scheduledVisit && (
        <div
          className={`mt-4 p-4 rounded ${visitStatusStyles[scheduledVisit.visitStatus] || 'bg-gray-100'}`}
        >
          <h3 className="text-lg font-semibold mb-2 text-teal-700">
            Scheduled Visit
          </h3>
          <p>
            <strong>Date:</strong> {scheduledVisit.visitDate || 'N/A'}
          </p>
          <p>
            <strong>Time:</strong> {scheduledVisit.visitTime || 'N/A'}
          </p>
          <p>
            <strong>Status:</strong> {scheduledVisit.visitStatus || 'N/A'}
          </p>
          <p>
            <strong>Note:</strong> This scheduled visit will be updated with the new details provided above.
          </p>
        </div>
      )}
    </div>
    <div className="flex justify-between mt-6">
      <button
        type="button"
        onClick={prevStep}
        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 flex items-center"
      >
        Back
      </button>
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={handleSubmitVisit}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaCheckCircle className="mr-2" />
          )}
          Submit Visit
        </button>
        <button
          type="button"
          onClick={handleSendEmail}
          className={`${
            emailSent
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white py-2 px-4 rounded flex items-center`}
          disabled={isSendingEmail || emailSent}
        >
          {isSendingEmail ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : emailSent ? (
            <FaCheckCircle className="mr-2" />
          ) : (
            <FaNotesMedical className="mr-2" />
          )}
          {emailSent ? 'Email Sent to Patient' : 'Send Email'}
        </button>
      </div>
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

// src/app/components/SearchPatient.js

'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../../db'; // Adjust the path based on your project structure
import { collection, getDocs } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption'; // Adjust the path based on your project structure
import {
  FiUser,
  FiMapPin,
  FiCalendar,
  FiMail,
  FiPhone,
  FiSearch,
  FiClipboard,
  FiDollarSign,
  FiFileText,
  FiMap,
} from 'react-icons/fi';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaHeartbeat,
  FaNotesMedical,
  FaMedkit,
} from 'react-icons/fa';
import Modal from 'react-modal';
import { TailSpin } from 'react-loader-spinner';

// Reusable Function to Render Status Badges
const renderStatusBadge = (status) => {
  let colorClasses;
  let Icon;

  switch (status.toLowerCase()) {
    case 'completed':
      colorClasses = 'bg-green-100 text-green-800';
      Icon = FaCheckCircle;
      break;
    case 'missed':
      colorClasses = 'bg-red-100 text-red-800';
      Icon = FaTimesCircle;
      break;
    case 'pending':
      colorClasses = 'bg-yellow-100 text-yellow-800';
      Icon = FaClock;
      break;
    case 'ongoing':
      colorClasses = 'bg-blue-100 text-blue-800';
      Icon = FaHeartbeat;
      break;
    case 'rescheduled':
      colorClasses = 'bg-purple-100 text-purple-800';
      Icon = FaMedkit;
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-800';
      Icon = FaClock;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClasses}`}
    >
      <Icon className="mr-1 text-sm" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Helper function to format date from yyyy-MM-dd to dd-MM-yyyy
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

// Custom Styles for Modal
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '600px',
    borderRadius: '1.5rem',
    padding: '2rem',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Beautiful gradient background
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

const SearchPatient = () => {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [modalIsOpen, setIsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Set the app element for React Modal
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const appElement = document.querySelector('#__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  // Validation: At least one field must be filled
  const isFormValid = () => {
    return name.trim() !== '' || address.trim() !== '' || visitDate.trim() !== '';
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // If form is invalid, set error and return
    if (!isFormValid()) {
      setError('Please fill at least one field to perform a search.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults([]);

    try {
      if (!session || !session.user || !session.user.id) {
        setError('User session not found.');
        setIsLoading(false);
        return;
      }

      const doctorId = session.user.id;
      const patientsRef = collection(db, 'doctors', doctorId, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);

      const patients = patientsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Decrypt patient data
      const decryptedPatients = patients.map((patient) => ({
        id: patient.id,
        name: decryptData(patient.name),
        address: decryptData(patient.address),
        email: decryptData(patient.email || 'Not Provided'),
        phone: decryptData(patient.mobileNumber || 'Not Provided'),
        age: decryptData(patient.age || 'N/A'),
        gender: decryptData(patient.gender || 'N/A'),
        disease: decryptData(patient.disease || 'N/A'),
        notes: decryptData(patient.notes || 'N/A'),
        treatmentStatus: decryptData(patient.treatmentStatus || 'N/A'),
        // Add other decrypted fields as necessary
      }));

      // Filter patients based on search criteria
      let filteredPatients = decryptedPatients.filter((patient) => {
        const nameMatch =
          name.trim() === '' ||
          patient.name.toLowerCase().includes(name.toLowerCase());
        const addressMatch =
          address.trim() === '' ||
          patient.address.toLowerCase().includes(address.toLowerCase());
        return nameMatch && addressMatch;
      });

      // If visitDate is provided, further filter patients who have visits on that date
      if (visitDate.trim() !== '') {
        const formattedVisitDate = formatDateToDDMMYYYY(visitDate);

        const patientsWithVisit = [];

        for (const patient of filteredPatients) {
          const visitsRef = collection(
            db,
            'doctors',
            doctorId,
            'patients',
            patient.id,
            'visits'
          );
          const visitsSnapshot = await getDocs(visitsRef);

          const visits = visitsSnapshot.docs.map((visitDoc) => ({
            id: visitDoc.id,
            ...visitDoc.data(),
          }));

          // Decrypt visit data with error handling
          const decryptedVisits = visits.map((visit) => ({
            id: visit.id,
            visitDate: decryptData(visit.visitDate),
            visitTime: decryptData(visit.visitTime),
            visitReason: decryptData(visit.visitReason),
            treatmentStatus: decryptData(visit.treatmentStatus),
            visitStatus: decryptData(visit.visitStatus || 'N/A'), // Fetch visitStatus
            diagnosis: decryptData(visit.medicineGiven || 'N/A'),
            symptoms: decryptData(visit.symptoms || 'N/A'),
            nextVisitDate: decryptData(visit.nextVisitDate || 'N/A'),
            nextVisitTime: decryptData(visit.nextVisitTime || 'N/A'),
            notes: decryptData(visit.notes || 'N/A'),
            amountPaid: decryptData(visit.amountPaid || '0'),
            totalAmount: decryptData(visit.totalAmount || '0'),
            medicineGiven: decryptData(visit.medicineGiven || 'None'),
            // Add other decrypted fields as necessary
          }));

          // Check if any visit matches the formatted visitDate
          const hasMatchingVisit = decryptedVisits.some(
            (visit) => visit.visitDate === formattedVisitDate
          );

          if (hasMatchingVisit) {
            patientsWithVisit.push({
              ...patient,
              visits: decryptedVisits.filter(
                (visit) => visit.visitDate === formattedVisitDate
              ),
            });
          }
        }

        filteredPatients = patientsWithVisit;
      } else {
        // If visitDate is not provided, fetch all visits for each patient
        const patientsWithAllVisits = [];

        for (const patient of filteredPatients) {
          const visitsRef = collection(
            db,
            'doctors',
            doctorId,
            'patients',
            patient.id,
            'visits'
          );
          const visitsSnapshot = await getDocs(visitsRef);

          const visits = visitsSnapshot.docs.map((visitDoc) => ({
            id: visitDoc.id,
            ...visitDoc.data(),
          }));

          // Decrypt visit data with error handling
          const decryptedVisits = visits.map((visit) => ({
            id: visit.id,
            visitDate: decryptData(visit.visitDate),
            visitTime: decryptData(visit.visitTime),
            visitReason: decryptData(visit.visitReason),
            treatmentStatus: decryptData(visit.treatmentStatus),
            visitStatus: decryptData(visit.visitStatus || 'N/A'), // Fetch visitStatus
            diagnosis: decryptData(visit.medicineGiven || 'N/A'),
            symptoms: decryptData(visit.symptoms || 'N/A'),
            nextVisitDate: decryptData(visit.nextVisitDate || 'N/A'),
            nextVisitTime: decryptData(visit.nextVisitTime || 'N/A'),
            notes: decryptData(visit.notes || 'N/A'),
            amountPaid: decryptData(visit.amountPaid || '0'),
            totalAmount: decryptData(visit.totalAmount || '0'),
            medicineGiven: decryptData(visit.medicineGiven || 'None'),
            // Add other decrypted fields as necessary
          }));

          patientsWithAllVisits.push({
            ...patient,
            visits: decryptedVisits,
          });
        }

        filteredPatients = patientsWithAllVisits;
      }

      setSearchResults(filteredPatients);
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open modal with visit details
  const openModal = (visit) => {
    setSelectedVisit(visit);
    setIsOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsOpen(false);
    setSelectedVisit(null);
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-100 to-blue-200 min-h-screen">
      <h2 className="text-4xl font-bold mb-8 text-center text-blue-800">
        Search Patients
      </h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Name Input */}
          <div className="relative">
            <FiUser className="absolute top-3 left-3 text-indigo-500" />
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patient Name"
              className="pl-10 pr-4 py-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              aria-label="Search by patient name"
            />
          </div>

          {/* Address Input */}
          <div className="relative">
            <FiMapPin className="absolute top-3 left-3 text-green-500" />
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Patient Address"
              className="pl-10 pr-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              aria-label="Search by patient address"
            />
          </div>

          {/* Visit Date Input */}
          <div className="relative">
            <FiCalendar className="absolute top-3 left-3 text-red-500" />
            <input
              type="date"
              id="visitDate"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="pl-10 pr-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              aria-label="Search by visit date"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Search Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className={`flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold transition-colors duration-300 ${
              isFormValid()
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            aria-label="Search patients"
          >
            {isLoading ? (
              <>
                <TailSpin
                  height="20"
                  width="20"
                  color="#FFFFFF"
                  ariaLabel="loading"
                  className="mr-2"
                />
                Searching...
              </>
            ) : (
              <>
                <FiSearch className="mr-2" />
                Search
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center mb-8">
          <span className="text-xl text-blue-700">Loading...</span>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && searchResults.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          {searchResults.map((patient) => (
            <div key={patient.id} className="mb-8">
              {/* Patient Information Card */}
              <div className="flex flex-col md:flex-row items-center bg-gradient-to-r from-green-100 to-green-200 p-6 rounded-xl shadow-lg mb-6">
                <FiUser className="text-6xl text-green-600 mr-6" />
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-semibold text-green-800">{patient.name}</h3>
                  <p className="text-green-700">{patient.age} years old | {patient.gender}</p>
                  <p className="flex items-center text-green-700 mt-2">
                    <FiMap className="mr-2 text-green-600" />
                    {patient.address}
                  </p>
                  <p className="flex items-center text-green-700 mt-1">
                    <FiMail className="mr-2 text-green-600" />
                    {patient.email}
                  </p>
                  <p className="flex items-center text-green-700 mt-1">
                    <FiPhone className="mr-2 text-green-600" />
                    {patient.phone}
                  </p>
                  {/* Next Visit Information */}
                  {patient.visits && patient.visits.length > 0 && (
                    <p className="flex items-center text-green-700 mt-1">
                      <FiCalendar className="mr-2 text-green-600" />
                      <strong>Next Visit:</strong> {patient.visits[0].visitDate} at {patient.visits[0].visitTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Patient Notes */}
              {patient.notes && (
                <div className="flex items-center bg-yellow-100 p-4 rounded-lg shadow-sm mb-6">
                  <span className="mr-4">📝</span>
                  <p className="text-yellow-700">{patient.notes}</p>
                </div>
              )}

              {/* Visit History */}
              <h4 className="text-xl font-semibold mb-4 text-blue-800">Visit History</h4>
              {Array.isArray(patient.visits) && patient.visits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {patient.visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-gray-700">
                          <strong>Date:</strong> {visit.visitDate} at {visit.visitTime}
                        </p>
                        <div className="mt-2">
                          {renderStatusBadge(visit.visitStatus)}
                        </div>
                      </div>
                      <button
                        onClick={() => openModal(visit)}
                        className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-pink-500 hover:to-purple-500 transition-colors duration-300"
                        aria-label="View Visit Details"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No visits found.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {!isLoading && searchResults.length === 0 && (
        <p className="text-center text-gray-700 mt-12">No patients found matching the search criteria.</p>
      )}

      {/* Modal for Visit Details */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Visit Details"
      >
        {selectedVisit && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700">Visit Details</h2>
              <button
                onClick={closeModal}
                className="text-white bg-red-500 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <p className="flex items-center">
                <FiCalendar className="mr-2 text-blue-500" />
                <strong>Date:</strong> {selectedVisit.visitDate}
              </p>
              <p className="flex items-center">
                <FiCalendar className="mr-2 text-blue-500" />
                <strong>Time:</strong> {selectedVisit.visitTime}
              </p>
              <p className="flex items-center">
                <FiClipboard className="mr-2 text-blue-500" />
                <strong>Reason:</strong> {selectedVisit.visitReason}
              </p>
              <p className="flex items-center">
                <FaHeartbeat className="mr-2 text-red-500" />
                <strong>Diagnosis:</strong> {selectedVisit.medicineGiven}
              </p>
              <p className="flex items-center">
                <FaNotesMedical className="mr-2 text-yellow-500" />
                <strong>Symptoms:</strong> {selectedVisit.symptoms}
              </p>
              <p className="flex items-center">
                {renderStatusBadge(selectedVisit.visitStatus)}
                <strong className="ml-2">Visit Status:</strong> {selectedVisit.visitStatus}
              </p>
              <p className="flex items-center">
                {renderStatusBadge(selectedVisit.treatmentStatus)}
                <strong className="ml-2">Treatment Status:</strong> {selectedVisit.treatmentStatus}
              </p>
              <p className="flex items-center">
                <FiDollarSign className="mr-2 text-green-500" />
                <strong>Amount Paid:</strong> ₹{selectedVisit.amountPaid}
              </p>
              <p className="flex items-center">
                <FiDollarSign className="mr-2 text-green-500" />
                <strong>Total Amount:</strong> ₹{selectedVisit.totalAmount}
              </p>
              <p className="flex items-center">
                <FaMedkit className="mr-2 text-purple-500" />
                <strong>Medicine Given:</strong> {selectedVisit.medicineGiven}
              </p>
              <p className="flex items-center">
                <FiFileText className="mr-2 text-gray-500" />
                <strong>Notes:</strong> {selectedVisit.notes}
              </p>
              {selectedVisit.visitDate && selectedVisit.visitTime && (
                <p className="flex items-center">
                  <FiCalendar className="mr-2 text-blue-500" />
                  <strong>Next Visit:</strong> {selectedVisit.visitDate} at {selectedVisit.visitTime}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Export the renderStatusBadge function if needed elsewhere
export { renderStatusBadge };

export default SearchPatient;

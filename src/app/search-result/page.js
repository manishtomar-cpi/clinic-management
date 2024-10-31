
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; 
import { db } from '../../db';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 
import { decryptData } from '../../lib/encryption';
import {
  FiUser,
  FiMap,
  FiMail,
  FiPhone,
  FiCalendar,
  FiClock,
  FiFilter,
  FiCheckCircle,
  FiArrowLeft,
} from 'react-icons/fi';
import { FaTimesCircle } from 'react-icons/fa';
import { FaHeart } from 'react-icons/fa';
import Modal from 'react-modal';
import Timeline from '../components/Timeline'; 
import ProtectedRoute from '../components/ProtectedRoute';


const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};


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
      maxHeight: '80vh',
      overflowY: 'auto', 
      borderRadius: '1.5rem',
      padding: '2rem',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
    },
  };
  

const renderStatusBadge = (status) => {
  if (!status) return null; 

  let colorClasses;
  let Icon;

  switch (status.toLowerCase()) {
    case 'completed':
      colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      Icon = FiCheckCircle;
      break;
    case 'missed':
      colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      Icon = FaTimesCircle;
      break;
    case 'upcoming':
      colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      Icon = FiClock;
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      Icon = FiClock;
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

const SearchResultPageContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [error, setError] = useState('');
  const [modalIsOpen, setIsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Sorting and Filtering States
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Set the app element for React Modal
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const appElement = document.querySelector('#__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      // Do nothing while loading
      return;
    }
    if (status === 'unauthenticated') {
      router.push('/login'); 
      return;
    }
    if (status === 'authenticated') {
      // Proceed with fetching data
      const fetchData = async () => {
        setIsLoading(true);
        setError('');
        setPatient(null);
        setVisits([]);
        setFilteredVisits([]);

        try {
          if (!session || !session.user || !session.user.id) {
            setError('User session not found.');
            setIsLoading(false);
            return;
          }

          const patientId = searchParams.get('patientId');
          if (!patientId) {
            setError('No patient selected.');
            setIsLoading(false);
            return;
          }

          const doctorId = session.user.id;

          // Fetch patient details
          const patientRef = doc(db, 'doctors', doctorId, 'patients', patientId);
          const patientSnap = await getDoc(patientRef);

          if (!patientSnap.exists()) {
            setError('Patient not found.');
            setIsLoading(false);
            return;
          }

          const patientData = patientSnap.data();

          const decryptedPatient = {
            id: patientSnap.id,
            name: decryptData(patientData.name),
            address: decryptData(patientData.address),
            email: decryptData(patientData.email || 'Not Provided'),
            phone: decryptData(patientData.mobileNumber || 'Not Provided'),
            age: decryptData(patientData.age || 'N/A'),
            gender: decryptData(patientData.gender || 'N/A'),
            disease: decryptData(patientData.disease || 'N/A'),
            notes: decryptData(patientData.notes || 'N/A'),
            treatmentStatus: patientData.treatmentStatus || 'N/A', 
            nextVisitDate: patientData.visitDate
              ? formatDateToDDMMYYYY(patientData.visitDate)
              : 'N/A',
            nextVisitTime: patientData.visitTime || 'N/A',
            nextVisitStatus: patientData.visitStatus || 'upcoming', // Add this line
          };

          setPatient(decryptedPatient);

          // Fetch patient visits
          const visitsRef = collection(
            db,
            'doctors',
            doctorId,
            'patients',
            patientId,
            'visits'
          );
          const visitsSnapshot = await getDocs(
            query(visitsRef, orderBy('createdAt', 'desc'))
          );

          const fetchedVisits = visitsSnapshot.docs.map((visitDoc) => {
            const visitData = visitDoc.data();

            // Handle possible undefined fields
            const visitStatus = visitData.visitStatus
              ? decryptData(visitData.visitStatus)
              : 'N/A';
            const treatmentStatus = visitData.treatmentStatus
              ? decryptData(visitData.treatmentStatus)
              : 'N/A';

            // Parse medicines JSON string
            let medicines = [];
            try {
              medicines = JSON.parse(decryptData(visitData.medicines || '[]'));
            } catch (error) {
              console.error('Error parsing medicines:', error);
              medicines = [];
            }

            return {
              id: visitDoc.id,
              visitDate: visitData.visitDate
                ? formatDateToDDMMYYYY(visitData.visitDate)
                : 'N/A',
              visitTime: visitData.visitTime || 'N/A',
              visitReason: visitData.visitReason || 'N/A',
              symptoms: decryptData(visitData.symptoms || 'N/A'),
              notes: decryptData(visitData.notes || 'N/A'),
              amountPaid: visitData.amountPaid || '0',
              totalAmount: visitData.totalAmount || '0',
              treatmentStatus: treatmentStatus,
              visitStatus: visitStatus,
              visitNumber: visitData.visitNumber || 'N/A',
              missedCount: visitData.missedCount || 0,
              medicines: medicines, // Array of medicines
              createdAt: visitData.createdAt
                ? visitData.createdAt.toDate()
                : new Date(),
            };
          });

          setVisits(fetchedVisits);
        } catch (err) {
          console.error('Error fetching patient data:', err);
          setError('An error occurred while fetching patient data.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [status, session, router, searchParams]);

  // Apply Sorting and Filtering
  useEffect(() => {
    let updatedVisits = [...visits];

    // Apply Filtering
    if (filterStatus !== 'all') {
      updatedVisits = updatedVisits.filter(
        (visit) => visit.visitStatus.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Apply Sorting
    if (sortOrder === 'newest') {
      updatedVisits.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else if (sortOrder === 'oldest') {
      updatedVisits.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }

    setFilteredVisits(updatedVisits);
  }, [visits, sortOrder, filterStatus]);

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

  // Handler for sorting
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  // Handler for filtering
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setIsFilterOpen(false);
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-100 to-blue-200 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 min-h-screen">
      <div className="flex items-center mb-8">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-blue-700 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400"
          aria-label="Back to Dashboard"
        >
          <FiArrowLeft className="mr-2 text-xl" />
          Back to Dashboard
        </button>
      </div>

      <h2 className="text-4xl font-bold mb-8 text-center text-blue-800 dark:text-blue-300">
        Search Results
      </h2>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center mb-8">
          <FaHeart
            className="animate-pulse text-red-500 text-4xl mr-2"
            aria-label="loading"
          />
          <span className="text-xl text-blue-700 dark:text-blue-300">Loading...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Patient Information and Visit Timeline */}
      {!isLoading && patient && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          {/* Patient Information */}
          <div className="flex flex-col md:flex-row items-center bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-600 p-6 rounded-xl shadow-lg mb-6">
            <FiUser className="text-6xl text-green-600 dark:text-green-200 mr-6" />
            <div className="flex-1">
              {/* Next Visit Status */}
              {patient.nextVisitDate !== 'N/A' && patient.nextVisitTime !== 'N/A' && (
                <div className="mb-4 p-4 rounded-lg shadow-sm flex items-center space-x-2 animate-pulse">
                  {patient.nextVisitStatus.toLowerCase() === 'missed' ? (
                    <FaTimesCircle className="text-red-500 text-2xl" />
                  ) : patient.nextVisitStatus.toLowerCase() === 'completed' ? (
                    <FiCheckCircle className="text-green-500 text-2xl" />
                  ) : (
                    <FiClock className="text-yellow-500 text-2xl" />
                  )}
                  <p
                    className={`text-lg font-semibold ${
                      patient.nextVisitStatus.toLowerCase() === 'missed'
                        ? 'text-red-700 dark:text-red-300'
                        : patient.nextVisitStatus.toLowerCase() === 'completed'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {patient.nextVisitStatus.charAt(0).toUpperCase() +
                      patient.nextVisitStatus.slice(1)}{' '}
                    on {patient.nextVisitDate} at {patient.nextVisitTime}
                  </p>
                </div>
              )}
              <h3 className="text-2xl font-semibold text-green-800 dark:text-green-200">
                {patient.name}
              </h3>
              <p className="text-green-700 dark:text-green-300">
                {patient.age} years old | {patient.gender}
              </p>
              <p className="flex items-center text-green-700 dark:text-green-300 mt-2">
                <FiMap className="mr-2 text-green-600 dark:text-green-200" />
                {patient.address}
              </p>
              <p className="flex items-center text-green-700 dark:text-green-300 mt-1">
                <FiMail className="mr-2 text-green-600 dark:text-green-200" />
                {patient.email}
              </p>
              <p className="flex items-center text-green-700 dark:text-green-300 mt-1">
                <FiPhone className="mr-2 text-green-600 dark:text-green-200" />
                {patient.phone}
              </p>  
              {/* Next Visit Information */}
              {patient.nextVisitDate !== 'N/A' && patient.nextVisitTime !== 'N/A' && (
                <p className="flex items-center text-green-700 dark:text-green-300 mt-1">
                  <FiCalendar className="mr-2 text-green-600 dark:text-green-200" />
                  <strong>Next Visit:</strong> {patient.nextVisitDate} at {patient.nextVisitTime}
                </p>
              )}
            </div>
          </div>

          {/* Patient Notes */}
          {patient.notes && (
            <div className="flex items-center bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg shadow-sm mb-6">
              <span className="mr-4">📝</span>
              <p className="text-yellow-700 dark:text-yellow-300">{patient.notes}</p>
            </div>
          )}

          {/* Sorting and Filtering Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            {/* Sorting */}
            <div className="flex items-center mb-4 md:mb-0">
              <FiFilter className="text-blue-500 mr-2" />
              <label htmlFor="sort" className="text-blue-700 dark:text-blue-300 mr-2">
                Sort By:
              </label>
              <div className="relative inline-block text-left">
                <select
                  id="sort"
                  value={sortOrder}
                  onChange={handleSortChange}
                  className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <option value="newest">Newest to Oldest</option>
                  <option value="oldest">Oldest to Newest</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtering */}
            <div className="relative inline-block text-left">
              <div>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  id="options-menu"
                  aria-haspopup="true"
                  aria-expanded={isFilterOpen}
                >
                  <FiFilter className="mr-2" />
                  Filter
                  <svg
                    className="ml-2 -mr-1 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {isFilterOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu"
                >
                  <div className="py-1" role="none">
                    <button
                      onClick={() => handleFilterChange('all')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                      role="menuitem"
                    >
                      <FiCheckCircle className="mr-2 text-green-500" />
                      All
                    </button>
                    <button
                      onClick={() => handleFilterChange('completed')}
                      className="flex items-center px-4 py-2 text-sm text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-600 w-full text-left"
                      role="menuitem"
                    >
                      <FiCheckCircle className="mr-2 text-green-500" />
                      Completed
                    </button>
                    <button
                      onClick={() => handleFilterChange('missed')}
                      className="flex items-center px-4 py-2 text-sm text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-600 w-full text-left"
                      role="menuitem"
                    >
                      <FaTimesCircle className="mr-2 text-red-500" />
                      Missed
                    </button>
                    <button
                      onClick={() => handleFilterChange('upcoming')}
                      className="flex items-center px-4 py-2 text-sm text-yellow-700 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-600 w-full text-left"
                      role="menuitem"
                    >
                      <FiClock className="mr-2 text-yellow-500" />
                      Upcoming
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visit Timeline */}
          <h4 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-300">Visit Timeline</h4>
          {filteredVisits.length > 0 ? (
            <Timeline visits={filteredVisits} onViewDetails={openModal} />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No visits found.</p>
          )}
        </div>
      )}

      {/* No Results Message */}
      {!isLoading && !patient && !error && (
        <p className="text-center text-gray-700 dark:text-gray-300 mt-12">No patient found with the provided ID.</p>
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
              <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">Visit Details</h2>
              <button
                onClick={closeModal}
                className="text-white bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 rounded-full w-8 h-8 flex items-center justify-center"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <p className="flex items-center">
                <FiCalendar className="mr-2 text-blue-500 dark:text-blue-300" />
                <strong>Date:</strong> {selectedVisit.visitDate}
              </p>
              <p className="flex items-center">
                <FiClock className="mr-2 text-blue-500 dark:text-blue-300" />
                <strong>Time:</strong> {selectedVisit.visitTime}
              </p>
              <p>
                <strong>Visit Number:</strong> {selectedVisit.visitNumber}
              </p>
              <p className="flex items-center">
                {renderStatusBadge(selectedVisit.visitStatus)}
                <strong className="ml-2">Visit Status:</strong> {selectedVisit.visitStatus}
              </p>
              <p className="flex items-center">
                {renderStatusBadge(selectedVisit.treatmentStatus)}
                <strong className="ml-2">Treatment Status:</strong> {selectedVisit.treatmentStatus}
              </p>
              <p>
                <strong>Reason for Visit:</strong> {selectedVisit.visitReason}
              </p>
              <p>
                <strong>Symptoms:</strong> {selectedVisit.symptoms}
              </p>
              <p>
                <strong>Medicines Prescribed:</strong>
              </p>
              <ul className="list-disc list-inside">
                {selectedVisit.medicines.map((med, index) => (
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
                <strong>Total Amount:</strong> ₹{selectedVisit.totalAmount}
              </p>
              <p>
                <strong>Amount Paid:</strong> ₹{selectedVisit.amountPaid}
              </p>
              {selectedVisit.notes && (
                <p>
                  <strong>Notes:</strong> {selectedVisit.notes}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Wrap the content with ProtectedRoute
const SearchResultPage = () => {
  return (
    <ProtectedRoute>
      <SearchResultPageContent />
    </ProtectedRoute>
  );
};

export default SearchResultPage;

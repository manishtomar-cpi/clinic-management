'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../app/components/Toast'; // Assuming you have a Toast component
import PatientSidebar from '../components/PatientSidebar'; // Assuming you have a Sidebar component
import ProtectedRoute from '../components/ProtectedRoute';
import MedicalSpinner from '../components/MedicalSpinner'; // Assuming you have a Spinner component
import { decryptData } from '../../lib/encryption';
import { db } from '../../db'; // Firebase configuration
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import Modal from 'react-modal';
import {
  FaHeart,
  FaCalendarAlt,
  FaFileMedical,
  FaStickyNote,
} from 'react-icons/fa';
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiUser ,
  FiMap ,
  FiPhone ,
  FiMail,
  FiFilter,
  FiArrowLeft,
} from 'react-icons/fi';

// Formatting Functions
const formatDateToDDMMYYYY = (date) => {
  if (!date) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatTimeToHHMM = (date) => {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
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

// Status Badge Component
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
      Icon = FaHeart; // Using FaHeart as an example; replace with appropriate icon
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

// Info Card Component
const InfoCard = ({ label, value, icon, gradient }) => (
  <motion.div
    className={`flex items-center p-4 rounded-lg shadow hover:shadow-lg transition-shadow bg-gradient-to-r ${gradient} text-white`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-3xl mr-4">{icon}</div>
    <div>
      <p className="font-semibold">{label}</p>
      <p className="">{value}</p>
    </div>
  </motion.div>
);

const PatientDashboardContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  const [doctorData, setDoctorData] = useState({
    doctorName: '',
    clinicName: '',
    clinicLocation: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Set the app element for React Modal
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const appElement = document.querySelector('#__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  useEffect(() => {
    const fetchPatientAndDoctorData = async () => {
      if (status === 'authenticated' && session) {
        // Check if the user has the 'patient' role
        if (session.user.role !== 'patient') {
          showToast('Access denied. Patients only.', 'error');
          router.push('/patient-login'); // Redirect to login or appropriate page
          return;
        }

        try {
          const userId = session.user.id; // Patient's user ID
          console.log('Patient User ID:', userId);
          let doctorId = null;

          // Fetch patient data from 'users' collection to get doctorId
          const patientUserDocRef = doc(db, 'users', userId);
          const patientUserDoc = await getDoc(patientUserDocRef);

          if (patientUserDoc.exists()) {
            const userData = patientUserDoc.data();
            console.log('Patient User Data:', userData);
            doctorId = userData.doctorId;

            if (doctorId) {
              console.log('Doctor ID:', doctorId);
              // Fetch patient data from 'doctors/{doctorId}/patients/{patientId}'
              const patientDocRef = doc(
                db,
                'doctors',
                doctorId,
                'patients',
                userId
              );
              const patientDoc = await getDoc(patientDocRef);

              if (patientDoc.exists()) {
                const data = patientDoc.data();
                console.log('Patient Data under Doctor:', data);
                const decryptedData = {};
                for (const key in data) {
                  // Decrypt only necessary fields
                  if (
                    key !== 'treatmentStatus' &&
                    key !== 'createdAt' &&
                    key !== 'visitTimestamp' &&
                    key !== 'visitStatus' &&
                    key !== 'visitNumber' &&
                    key !== 'missedCount'
                  ) {
                    decryptedData[key] = decryptData(data[key]);
                  } else {
                    decryptedData[key] = data[key];
                  }
                }
                console.log('Decrypted Patient Data:', decryptedData);
                setPatientData({
                  name: decryptedData.name || '',
                  age: decryptedData.age || '',
                  gender: decryptedData.gender || '',
                  address: decryptedData.address || '',
                  mobileNumber: decryptedData.mobileNumber || '',
                  email: decryptedData.email || '',
                  disease: decryptedData.disease || '',
                  notes: decryptedData.notes || '',
                });
              } else {
                showToast('Patient data not found', 'error');
                console.error('Patient document does not exist.');
              }

              // Fetch doctor's data from 'users' collection
              const doctorDocRef = doc(db, 'users', doctorId);
              const doctorDoc = await getDoc(doctorDocRef);

              if (doctorDoc.exists()) {
                const data = doctorDoc.data();
                console.log('Doctor Data:', data);
                const decryptedData = {};
                for (const key in data) {
                  if (
                    key !== 'createdAt' &&
                    key !== 'username' &&
                    key !== 'password' &&
                    key !== 'role'
                  ) {
                    decryptedData[key] = decryptData(data[key]);
                  } else {
                    decryptedData[key] = data[key];
                  }
                }
                console.log('Decrypted Doctor Data:', decryptedData);
                setDoctorData({
                  doctorName: decryptedData.doctorName || '',
                  clinicName: decryptedData.clinicName || '',
                  clinicLocation: decryptedData.clinicLocation || '',
                });
              } else {
                showToast('Doctor data not found', 'error');
                console.error('Doctor document does not exist.');
              }

              // Fetch visits data ordered by visitTimestamp ascending
              const visitsRef = collection(
                db,
                'doctors',
                doctorId,
                'patients',
                userId,
                'visits'
              );
              const visitsSnapshot = await getDocs(
                query(visitsRef, orderBy('visitTimestamp', 'asc'))
              );

              const visitsData = visitsSnapshot.docs.map((visitDoc) => {
                const visitData = visitDoc.data();
                console.log('Raw Visit Data:', visitData);

                // Handle encrypted and plaintext fields
                const decryptedVisit = {
                  id: visitDoc.id,
                  visitDate: visitData.visitTimestamp
                    ? formatDateToDDMMYYYY(visitData.visitTimestamp.toDate())
                    : 'N/A',
                  visitTime: visitData.visitTimestamp
                    ? formatTimeToHHMM(visitData.visitTimestamp.toDate())
                    : 'N/A',
                  visitStatus: visitData.visitStatus
                    ? decryptData(visitData.visitStatus)
                    : 'N/A',
                  treatmentStatus: visitData.treatmentStatus
                    ? decryptData(visitData.treatmentStatus)
                    : 'N/A',
                  symptoms: visitData.symptoms
                    ? decryptData(visitData.symptoms)
                    : 'N/A',
                  notes: visitData.notes ? decryptData(visitData.notes) : 'N/A',
                  amountPaid: visitData.amountPaid
                    ? decryptData(visitData.amountPaid)
                    : '0',
                  totalAmount: visitData.totalAmount
                    ? decryptData(visitData.totalAmount)
                    : '0',
                  medicines: visitData.medicines
                    ? JSON.parse(decryptData(visitData.medicines))
                    : [],
                  visitNumber: visitData.visitNumber
                    ? decryptData(visitData.visitNumber)
                    : 'N/A',
                  missedCount: visitData.missedCount
                    ? decryptData(visitData.missedCount)
                    : '0',
                  createdAt: visitData.createdAt
                    ? visitData.createdAt.toDate()
                    : null,
                };
                console.log('Decrypted Visit:', decryptedVisit);
                return decryptedVisit;
              });

              setVisits(visitsData);
              console.log('All Visits:', visitsData);

              // Find the next upcoming appointment
              const now = new Date();
              const upcomingVisits = visitsData.filter((visit) => {
                if (visit.visitDate === 'N/A' || visit.visitTime === 'N/A') return false;
                const [day, month, year] = visit.visitDate.split('-').map(Number);
                const [hours, minutes] = visit.visitTime.split(':').map(Number);
                const visitDateTime = new Date(year, month - 1, day, hours, minutes);
                return (
                  visitDateTime > now &&
                  visit.visitStatus.toLowerCase() !== 'missed' &&
                  visit.visitStatus.toLowerCase() !== 'completed'
                );
              });

              console.log('Upcoming Visits:', upcomingVisits);

              if (upcomingVisits.length > 0) {
                // Sort upcoming visits by date
                upcomingVisits.sort((a, b) => {
                  const [dayA, monthA, yearA] = a.visitDate.split('-').map(Number);
                  const [hoursA, minutesA] = a.visitTime.split(':').map(Number);
                  const visitDateTimeA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);

                  const [dayB, monthB, yearB] = b.visitDate.split('-').map(Number);
                  const [hoursB, minutesB] = b.visitTime.split(':').map(Number);
                  const visitDateTimeB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);

                  return visitDateTimeA - visitDateTimeB;
                });

                setNextAppointment(upcomingVisits[0]);
                console.log('Next Appointment:', upcomingVisits[0]);
              } else {
                setNextAppointment(null);
                console.log('No upcoming appointments.');
              }
            } else {
              showToast('Doctor ID not found in user data', 'error');
              console.error('Doctor ID missing.');
            }
          } else {
            showToast('User data not found', 'error');
            console.error('Patient user document does not exist.');
          }

          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          showToast('Error fetching your data. Please contact support.', 'error');
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/patient-login'); // Redirect to login if not authenticated
      }
    };

    fetchPatientAndDoctorData();
  }, [status, session, router]);

  // Modal functions
  const openModal = (visit) => {
    setSelectedVisit(visit);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedVisit(null);
  };

  // Custom styles for Modal (if different from above)
  // const customStyles = { ... };

  // Determine if there are any errors during visits fetching
  useEffect(() => {
    if (visits.length === 0 && !isLoading) {
      showToast('No visits found for your profile.', 'info');
    }
  }, [visits, isLoading]);

  // Determine next appointment has been set
  useEffect(() => {
    if (nextAppointment) {
      console.log('Next Appointment:', nextAppointment);
    } else {
      console.log('No upcoming appointments.');
    }
  }, [nextAppointment]);

  if (isLoading) {
    return <MedicalSpinner />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PatientSidebar />
      <motion.div
        className="flex-1 overflow-auto bg-gray-100 ml-0 md:ml-64"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          {/* Welcome Banner */}
          <motion.div
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-md mb-6 w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-2">
              Welcome, {patientData.name}!
            </h2>
            <p className="text-lg">Managing your health has never been easier.</p>
            {doctorData.doctorName && (
              <p className="mt-2">
                Your assigned doctor:{' '}
                <span className="font-semibold">{doctorData.doctorName}</span>
              </p>
            )}
            {doctorData.clinicName && (
              <p className="mt-1">
                Clinic Name:{' '}
                <span className="font-semibold">{doctorData.clinicName}</span>
              </p>
            )}
            {doctorData.clinicLocation && (
              <p className="mt-1">
                Clinic Location:{' '}
                <span className="font-semibold">{doctorData.clinicLocation}</span>
              </p>
            )}
          </motion.div>

          {/* Patient Information Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <InfoCard
              label="Name"
              value={patientData.name}
              icon={<FiUser />}
              gradient="from-purple-500 to-pink-500"
            />
            <InfoCard
              label="Age"
              value={patientData.age}
              icon={<FiUser />}
              gradient="from-blue-500 to-green-500"
            />
            <InfoCard
              label="Gender"
              value={patientData.gender}
              icon={<FiUser />}
              gradient="from-red-500 to-yellow-500"
            />
            <InfoCard
              label="Address"
              value={patientData.address}
              icon={<FiMap />}
              gradient="from-teal-500 to-cyan-500"
            />
            <InfoCard
              label="Mobile Number"
              value={patientData.mobileNumber}
              icon={<FiPhone />}
              gradient="from-indigo-500 to-purple-500"
            />
            <InfoCard
              label="Email"
              value={patientData.email}
              icon={<FiMail />}
              gradient="from-orange-500 to-pink-500"
            />
            <InfoCard
              label="Disease/Condition"
              value={patientData.disease}
              icon={<FaFileMedical />}
              gradient="from-green-500 to-lime-500"
            />
            <InfoCard
              label="Notes"
              value={patientData.notes}
              icon={<FaStickyNote />}
              gradient="from-pink-500 to-red-500"
            />
          </motion.div>

          {/* Upcoming Appointments */}
          <motion.div
            className="bg-white shadow-md rounded-lg p-6 mb-6 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-2xl font-semibold mb-4">Upcoming Appointments</h3>
            {nextAppointment ? (
              <div className="flex items-center text-gray-600">
                <FaCalendarAlt className="text-2xl mr-2 animate-pulse" />
                <p>
                  Your next appointment is on{' '}
                  <span className="font-semibold">
                    {nextAppointment.visitDate} at {nextAppointment.visitTime}
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex items-center text-gray-600">
                <FaCalendarAlt className="text-2xl mr-2 animate-pulse" />
                <p>You have no upcoming appointments scheduled.</p>
              </div>
            )}
          </motion.div>

          {/* Health Records */}
          <motion.div
            className="bg-white shadow-md rounded-lg p-6 mb-6 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h3 className="text-2xl font-semibold mb-4">Health Records</h3>
            {visits.length > 0 ? (
              <div className="space-y-4">
                {visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center text-gray-600 mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded"
                    onClick={() => openModal(visit)}
                  >
                    <FaFileMedical className="text-2xl mr-2" />
                    <p>
                      Visit on{' '}
                      <span className="font-semibold">
                        {visit.visitDate} at {visit.visitTime}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center text-gray-600">
                <FaHeart className="text-2xl mr-2 animate-pulse" />
                <p>Your health records will appear here once available.</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

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
                <FiClock className="mr-2 text-blue-500" />
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

// Wrap the content with ProtectedRoute if necessary
// Assuming you have a ProtectedRoute component to handle route protection
const PatientDashboardPage = () => {
  return (
    <ProtectedRoute>
      <PatientDashboardContent />
    </ProtectedRoute>
  );
};

export default PatientDashboardPage;

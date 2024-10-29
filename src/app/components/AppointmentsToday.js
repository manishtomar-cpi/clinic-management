// src/app/components/AppointmentsToday.js

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../db'; // Ensure the path is correct
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc, 
} from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { FiAlertCircle } from 'react-icons/fi';
import { BsSearch } from 'react-icons/bs';
import { FaCheckCircle, FaTimesCircle, FaClock, FaHeartbeat, FaMedkit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { showToast } from './Toast';
import { TailSpin } from 'react-loader-spinner'; // For loading indicators
import Modal from 'react-modal'; // If you intend to use modals
import { decryptData } from '../../lib/encryption'; // Adjust the path based on your project structure

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

// Helper function to categorize appointments based on visitDate and current date
const categorizeAppointment = (appointment) => {
  const visitDateStr = appointment.visitDate;
  const now = new Date();
  const [day, month, year] = visitDateStr.split('-').map(Number);
  const visitDate = new Date(year, month - 1, day);

  const diffTime = visitDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays > 0 && diffDays <= 7) return 'This Week';
  if (diffDays > 7 && diffDays <= 30) return 'This Month';
  return 'All';
};

const AppointmentsToday = () => {
  const { data: session } = useSession();
  const [allAppointments, setAllAppointments] = useState([]); // Holds all appointments from Firestore
  const [patientsMap, setPatientsMap] = useState({}); // Maps patientId to patientName
  const [searchTerm, setSearchTerm] = useState('');
  const [rescheduleData, setRescheduleData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All'); // Default filter
  const [displayedCount, setDisplayedCount] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState([]); // Appointments for today
  const loader = useRef(null);
  const appointmentsPerLoad = 6; // Fixed number of appointments to display initially
  const visitsListenersRef = useRef([]); // To store visits listeners

  // Set the app element for React Modal
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const appElement = document.querySelector('#__next') || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  // Fetch all patients and map patientId to patientName
  useEffect(() => {
    if (!session || !session.user || !session.user.id) {
      console.log('No valid session found.');
      return;
    }

    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    const unsubscribePatients = onSnapshot(
      patientsRef,
      (patientsSnapshot) => {
        const patientData = {};
        patientsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Decrypt patient name if stored encrypted
          const decryptedName = decryptData(data.name) || 'Unknown';
          patientData[doc.id] = decryptedName;
        });
        setPatientsMap(patientData);

        const patientIds = patientsSnapshot.docs.map((doc) => doc.id);
        console.log('Patient IDs:', patientIds);

        // Clean up existing visits listeners
        visitsListenersRef.current.forEach((unsub) => unsub());
        visitsListenersRef.current = [];

        // Reset allAppointments
        setAllAppointments([]);

        // Set up listeners for each patient's visits
        patientIds.forEach((patientId) => {
          const visitsRef = collection(
            db,
            'doctors',
            doctorId,
            'patients',
            patientId,
            'visits'
          );

          const unsubscribeVisit = onSnapshot(
            visitsRef,
            (visitsSnapshot) => {
              const visits = visitsSnapshot.docs.map((visitDoc) => {
                const data = visitDoc.data();
                return {
                  id: visitDoc.id,
                  patientId,
                  // Decrypt patientName and visitReason if stored encrypted
                  patientName: data.patientName ? decryptData(data.patientName) : patientData[patientId] || 'Unknown',
                  visitReason: data.visitReason ? decryptData(data.visitReason) : 'N/A',
                  ...data,
                };
              });

              setAllAppointments((prevAppointments) => {
                // Remove old visits for this patient
                const filteredAppointments = prevAppointments.filter(
                  (appt) => appt.patientId !== patientId
                );
                // Add updated visits
                const updatedAppointments = [...filteredAppointments, ...visits];
                return updatedAppointments;
              });
            },
            (error) => {
              console.error(`Error fetching visits for patient ${patientId}:`, error);
              showToast(`Error fetching visits for patient ${patientId}.`, 'error');
            }
          );

          visitsListenersRef.current.push(unsubscribeVisit);
        });
      },
      (error) => {
        console.error('Error fetching patients:', error);
        showToast('Error fetching patients data. Please try again later.', 'error');
      }
    );

    // Clean up on unmount
    return () => {
      unsubscribePatients();
      visitsListenersRef.current.forEach((unsub) => unsub());
    };
  }, [session]);

  // Filter appointments for today
  useEffect(() => {
    if (!session || !session.user || !session.user.id) return;

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const yyyy = now.getFullYear();
    const todayDateStr = `${dd}-${mm}-${yyyy}`;

    const filteredAppointments = allAppointments.filter(appointment => {
      const visitDateStr = appointment.visitDate;
      return visitDateStr === todayDateStr;
    });

    // Sort appointments by time ascending
    filteredAppointments.sort((a, b) => {
      const visitTimeA = a.visitTime;
      const visitTimeB = b.visitTime;
      if (!visitTimeA || !visitTimeB) return 0;

      const [hoursA, minutesA] = visitTimeA.split(':').map(Number);
      const [hoursB, minutesB] = visitTimeB.split(':').map(Number);
      return hoursA !== hoursB ? hoursA - hoursB : minutesA - minutesB;
    });

    setTodayAppointments(filteredAppointments);
    setDisplayedCount(Math.min(appointmentsPerLoad, filteredAppointments.length));
  }, [allAppointments, appointmentsPerLoad, session]);

  // Automatic Missed Status Logic
  useEffect(() => {
    const checkAndUpdateMissedAppointments = async () => {
      const now = new Date();
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const yyyy = today.getFullYear();
      const todayDateStr = `${dd}-${mm}-${yyyy}`;

      for (const appointment of todayAppointments) {
        const visitStatus = appointment.visitStatus || 'Pending';
        if (visitStatus.toLowerCase() !== 'upcoming' && visitStatus.toLowerCase() !== 'pending') continue; // Only process upcoming or pending appointments

        const visitDateStr = appointment.visitDate || '';
        const visitTimeStr = appointment.visitTime || '';

        if (visitDateStr !== todayDateStr) continue; // Ensure it's today

        // Parse appointment datetime
        const [day, month, year] = visitDateStr.split('-').map(Number);
        const [hours, minutes] = visitTimeStr.split(':').map(Number);
        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

        if (appointmentDateTime > now) continue; // Appointment time hasn't passed yet

        // Mark as 'Missed'
        await handleAction(appointment, 'missed');
      }
    };

    if (todayAppointments.length > 0) {
      checkAndUpdateMissedAppointments();
    }

    // Set interval to check every minute
    const intervalId = setInterval(() => {
      checkAndUpdateMissedAppointments();
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(intervalId);
  }, [todayAppointments, session]);

  // Filter appointments based on search term and selected filter using useMemo
  const filteredAppointments = useMemo(() => {
    return todayAppointments.filter((appointment) => {
      // Filter by search term
      const patientName = appointment.patientName || 'Unknown';
      const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by selected category
      const category = categorizeAppointment(appointment);
      const matchesFilter =
        selectedFilter === 'All' || category === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [todayAppointments, searchTerm, selectedFilter]);

  // Adjust displayedCount based on filteredAppointments
  useEffect(() => {
    setDisplayedCount(Math.min(appointmentsPerLoad, filteredAppointments.length));
  }, [filteredAppointments, appointmentsPerLoad]);

  // Infinite Scroll: Load more appointments when loader is visible
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        loadMore();
      }
    }, options);

    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [filteredAppointments, displayedCount]);

  const loadMore = () => {
    if (displayedCount < filteredAppointments.length) {
      setDisplayedCount((prev) => Math.min(prev + appointmentsPerLoad, filteredAppointments.length));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setDisplayedCount(appointmentsPerLoad); // Reset displayed count on new search
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setDisplayedCount(appointmentsPerLoad); // Reset displayed count when filter changes
  };

  const handleRescheduleChange = (appointmentId, field, value) => {
    setRescheduleData((prev) => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        [field]: value,
      },
    }));
  };

  const handleAction = async (appointment, action) => {
    try {
      setIsLoading(true);
      const doctorId = session.user.id;
      const patientId = appointment.patientId;
      const visitRef = doc(
        db,
        'doctors',
        doctorId,
        'patients',
        patientId,
        'visits',
        appointment.id
      );

      let updateObj = {};

      if (action === 'done') {
        updateObj = {
          treatmentStatus: 'Completed',
          completedDate: formatDateForStorage(new Date()),
          visitStatus: 'Completed', // Update visitStatus
        };
      } else if (action === 'missed') {
        updateObj = {
          treatmentStatus: 'Missed',
          missedDate: formatDateForStorage(new Date()),
          visitStatus: 'Missed', // Update visitStatus
        };
      }

      await updateDoc(visitRef, updateObj);

      if (action === 'done') {
        showToast(`Appointment with ${appointment.patientName || 'Unknown'} marked as Completed!`, 'success');
      } else if (action === 'missed') {
        showToast(`Appointment with ${appointment.patientName || 'Unknown'} marked as Missed!`, 'success');
      }

      // Update the appointment in the local state
      setAllAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment.id
            ? {
                ...appt,
                ...updateObj,
              }
            : appt
        )
      );
    } catch (error) {
      console.error(`Error performing action '${action}' on appointment:`, error);
      showToast(`Error performing action. Please try again.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async (appointment) => {
    const { date, time } = rescheduleData[appointment.id] || {};
    if (!date || !time) {
      showToast('Please select both a new date and time.', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      const doctorId = session.user.id;
      const patientId = appointment.patientId;
      const visitRef = doc(
        db,
        'doctors',
        doctorId,
        'patients',
        patientId,
        'visits',
        appointment.id
      );

      // Fetch the current visit data to ensure accurate updates
      const visitDocSnap = await getDoc(visitRef);
      if (!visitDocSnap.exists()) {
        showToast('Appointment does not exist.', 'error');
        setIsLoading(false);
        return;
      }
      const currentVisitData = visitDocSnap.data();

      // Prepare the update object
      const newDateObj = new Date(date);
      const [resHours, resMinutes] = time.split(':').map(Number);
      newDateObj.setHours(resHours, resMinutes);

      const isMissed = newDateObj.getTime() < Date.now();

      const updateObj = {
        visitDate: formatDateForStorage(newDateObj), // Update visitDate to new date
        visitTime: time, // Update visitTime to new time
        treatmentStatus: 'Ongoing', // Maintain as 'Ongoing'
        visitStatus: 'Rescheduled', // Update visitStatus to 'Rescheduled'
        missedDate: currentVisitData.missedDate || null, // Preserve original missed date if any
      };

      await updateDoc(visitRef, updateObj);

      showToast('Appointment rescheduled successfully!', 'success');

      // Update the appointment in the local state
      setAllAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment.id
            ? {
                ...appt,
                ...updateObj,
              }
            : appt
        )
      );

      // Reset reschedule data
      setRescheduleData((prev) => ({
        ...prev,
        [appointment.id]: {},
      }));
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      showToast('Error rescheduling appointment. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForStorage = (dateObj) => {
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const yyyy = dateObj.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const getFilterCategories = () => {
    const categories = ['All', 'Today', 'This Week', 'This Month'];
    return categories;
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <FiAlertCircle className="text-3xl text-blue-500 mr-2" />
        <h2 className="text-2xl font-bold">Today's Appointments</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Search Appointments"
        />
        <BsSearch className="absolute left-4 top-3 text-gray-400" />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {getFilterCategories().map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`px-4 py-2 rounded-full transition-colors duration-300 ${
              selectedFilter === filter
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label={`Filter appointments by ${filter}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {isLoading ? (
        <div className="flex justify-center items-center">
          <TailSpin
            height="50"
            width="50"
            color="#3B82F6" // Tailwind blue-500
            ariaLabel="loading"
          />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-purple-800">
            Appointments Today
          </h3>
          {filteredAppointments.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAppointments.slice(0, displayedCount).map((appointment) => {
                  const patientName = appointment.patientName || 'Unknown';
                  const visitReason = appointment.visitReason || 'N/A';
                  const visitStatus = appointment.visitStatus || 'Pending';
                  const isMissed = visitStatus.toLowerCase() === 'missed';
                  const isCompleted = visitStatus.toLowerCase() === 'completed';
                  const isRescheduled = visitStatus.toLowerCase() === 'rescheduled';
                  const isUpcoming = visitStatus.toLowerCase() === 'upcoming';

                  // visitDate and visitTime are plaintext
                  const visitDateStr = appointment.visitDate || '';
                  const visitTimeStr = appointment.visitTime || '';

                  // Compute appointmentDateTime
                  let appointmentDateTime = null;
                  if (visitDateStr && visitTimeStr) {
                    const [day, month, year] = visitDateStr.split('-').map(Number);
                    const [hours, minutes] = visitTimeStr.split(':').map(Number);
                    appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
                  }

                  // Determine if the rescheduled appointment has been missed
                  const missedAfterReschedule = isRescheduled && appointmentDateTime && appointmentDateTime < new Date();

                  return (
                    <motion.div
                      key={appointment.id}
                      className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Appointment Status Badge */}
                      {isCompleted && (
                        <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          Completed
                        </span>
                      )}
                      {isMissed && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          Missed
                        </span>
                      )}
                      {isRescheduled && (
                        <span
                          className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${
                            missedAfterReschedule
                              ? 'bg-red-500 text-white'
                              : 'bg-purple-500 text-white'
                          }`}
                        >
                          {missedAfterReschedule ? 'Rescheduled but Missed' : 'Rescheduled'}
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                          Upcoming
                        </span>
                      )}
                      {!isCompleted && !isMissed && !isRescheduled && !isUpcoming && (
                        <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">
                          Pending
                        </span>
                      )}

                      <h3 className="text-xl font-semibold mb-2">{patientName}</h3>
                      <p>
                        <strong>Time:</strong> {visitTimeStr || 'N/A'}
                      </p>
                      <p>
                        <strong>Reason:</strong> {visitReason}
                      </p>
                      {/* Display Rescheduled To if applicable */}
                      {isRescheduled && (
                        <p className={`mt-2 ${missedAfterReschedule ? 'text-red-700' : 'text-purple-700'}`}>
                          Rescheduled to <strong>{visitDateStr} at {visitTimeStr}</strong>
                        </p>
                      )}
                      {/* Action Buttons */}
                      <div className="mt-4 flex justify-between">
                        <button
                          onClick={() => handleAction(appointment, 'done')}
                          className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm transition-colors duration-300 ${
                            isMissed || isCompleted ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isMissed || isCompleted}
                          aria-label={`Mark appointment with ${patientName} as Done`}
                        >
                          Done
                        </button>
                        <button
                          onClick={() => handleAction(appointment, 'missed')}
                          className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition-colors duration-300 ${
                            isMissed || isCompleted ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isMissed || isCompleted}
                          aria-label={`Mark appointment with ${patientName} as Missed`}
                        >
                          Missed
                        </button>
                      </div>
                      {/* Reschedule Inputs */}
                      <div className="mt-4">
                        <label className="block text-gray-700 mb-1">New Date:</label>
                        <input
                          type="date"
                          value={rescheduleData[appointment.id]?.date || ''}
                          onChange={(e) =>
                            handleRescheduleChange(
                              appointment.id,
                              'date',
                              e.target.value
                            )
                          }
                          className={`w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            isMissed || isCompleted ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                          aria-label={`Select new date for appointment with ${patientName}`}
                          disabled={isMissed || isCompleted}
                        />

                        {/* Conditional Time Picker */}
                        {rescheduleData[appointment.id]?.date && (
                          <>
                            <label className="block text-gray-700 mb-1">New Time:</label>
                            <input
                              type="time"
                              value={rescheduleData[appointment.id]?.time || ''}
                              onChange={(e) =>
                                handleRescheduleChange(
                                  appointment.id,
                                  'time',
                                  e.target.value
                                )
                              }
                              className={`w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                isMissed || isCompleted ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                              aria-label={`Select new time for appointment with ${patientName}`}
                              disabled={isMissed || isCompleted}
                            />
                          </>
                        )}
                      </div>
                      {/* Reschedule Button */}
                      <button
                        onClick={() => handleReschedule(appointment)}
                        className={`mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm transition-colors duration-300 flex items-center justify-center ${
                          rescheduleData[appointment.id]?.date &&
                          rescheduleData[appointment.id]?.time &&
                          !isMissed &&
                          !isCompleted
                            ? ''
                            : 'cursor-not-allowed opacity-50'
                        }`}
                        disabled={
                          !rescheduleData[appointment.id]?.date ||
                          !rescheduleData[appointment.id]?.time ||
                          isMissed ||
                          isCompleted
                        }
                        aria-label={`Reschedule appointment with ${patientName}`}
                      >
                        {rescheduleData[appointment.id]?.date &&
                        rescheduleData[appointment.id]?.time ? (
                          <>
                            <span className="mr-2">Reschedule</span>
                            {/* Simple SVG Icon */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 0A8.001 8.001 0 0112 21a8.001 8.001 0 01-7.938-6H4m16 0h-.541A8.002 8.002 0 0012 5a8.002 8.002 0 00-7.459 4H4"
                              />
                            </svg>
                          </>
                        ) : (
                          'Reschedule'
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Loader for infinite scroll */}
              <div ref={loader} />
            </>
          ) : (
            <p className="text-gray-600">No appointments found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsToday;

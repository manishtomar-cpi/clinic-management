// src/app/components/AppointmentsThisWeek.js

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../db'; // Ensure the path is correct
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc 
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

// Custom hook to get window width
const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return width;
};

// Helper Functions

const getStartOfWeek = (date) => {
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Define categorizeAppointment BEFORE its usage to prevent ReferenceError
const categorizeAppointment = (appointment) => {
  const visitDateStr = appointment.visitDate;
  const visitTimeStr = appointment.visitTime;
  if (!visitDateStr) return 'All';

  const [day, month, year] = visitDateStr.split('-').map(Number);
  const [hours, minutes] = visitTimeStr ? visitTimeStr.split(':').map(Number) : [0, 0];
  const appointmentDate = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();

  // Start of the week (Monday)
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(now);

  if (
    appointmentDate.toDateString() === now.toDateString()
  ) {
    return 'Today';
  } else if (
    appointmentDate >= startOfWeek &&
    appointmentDate <= endOfWeek
  ) {
    return 'This Week';
  } else if (
    appointmentDate.getMonth() === now.getMonth() &&
    appointmentDate.getFullYear() === now.getFullYear()
  ) {
    return 'This Month';
  } else {
    return 'All';
  }
};

const AppointmentsThisWeek = () => {
  const { data: session } = useSession();
  const [allAppointments, setAllAppointments] = useState([]); // Holds all appointments from Firestore
  const [patientsMap, setPatientsMap] = useState({}); // Maps patientId to patientName
  const [searchTerm, setSearchTerm] = useState('');
  const [rescheduleData, setRescheduleData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('This Week'); // Default filter set to 'This Week'
  const [displayedCount, setDisplayedCount] = useState(0);
  const loader = useRef(null);
  const windowWidth = useWindowWidth();
  const visitsListenersRef = useRef([]); // To store visits listeners

  // Memoize appointmentsPerLoad based on windowWidth
  const appointmentsPerLoad = useMemo(() => {
    if (windowWidth >= 1024) return 9; // Desktop
    if (windowWidth >= 768) return 6;  // Tablet
    return 3;                           // Mobile
  }, [windowWidth]);

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
    console.log('Fetching patients for doctorId:', doctorId);

    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    const unsubscribePatients = onSnapshot(
      patientsRef,
      (patientsSnapshot) => {
        const patientData = {};
        patientsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Adjust the field name as per your Firestore schema
          const decryptedName = data.name ? decryptData(data.name) : 'Unknown';
          patientData[doc.id] = decryptedName;
        });
        setPatientsMap(patientData);
        console.log('Updated patientsMap:', patientData);

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
              console.log(`Fetched ${visitsSnapshot.size} visits for patientId: ${patientId}`);
              const visits = visitsSnapshot.docs.map((visitDoc) => {
                const data = visitDoc.data();
                // Decrypt visitReason if encrypted
                let decryptedReason = 'N/A';
                try {
                  decryptedReason = data.visitReason ? decryptData(data.visitReason) : 'N/A';
                } catch (error) {
                  console.error(`Error decrypting visitReason for appointment ${visitDoc.id}:`, error);
                }

                return {
                  id: visitDoc.id,
                  patientId,
                  ...data,
                  // Use patientData to get patientName
                  patientName: patientData[patientId] || 'Unknown',
                  visitReason: decryptedReason,
                };
              });

              setAllAppointments((prevAppointments) => {
                // Remove old visits for this patient
                const filteredAppointments = prevAppointments.filter(
                  (appt) => appt.patientId !== patientId
                );
                // Add updated visits
                const updatedAppointments = [...filteredAppointments, ...visits];
                console.log('Updated allAppointments:', updatedAppointments);
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

  // Filter appointments based on selectedFilter and searchTerm
  const [filteredAppointments, setFilteredAppointments] = useState([]); // Added this state
  useEffect(() => {
    console.log('Filtering appointments based on selectedFilter and searchTerm.');
    const filtered = allAppointments.filter((appointment) => {
      // At this point, patientName and visitReason are already decrypted during mapping
      const patientName = appointment.patientName || 'Unknown';
      const visitDate = appointment.visitDate || ''; // Assuming visitDate is plaintext
      const visitTime = appointment.visitTime || ''; // Assuming visitTime is plaintext
      const visitReason = appointment.visitReason || 'N/A'; // Assuming visitReason is plaintext
      const visitStatus = appointment.visitStatus || 'Pending'; // Assuming visitStatus is plaintext

      // Filter by search term
      const lowerCaseName = patientName.toLowerCase();
      const matchesSearch = lowerCaseName.includes(searchTerm.toLowerCase());

      // Filter by selected category
      const category = categorizeAppointment(appointment);
      const matchesFilter =
        selectedFilter === 'All' || category === selectedFilter;

      return matchesSearch && matchesFilter;
    });

    console.log(`Filtered Appointments Count: ${filtered.length}`);
    // Sort appointments based on date and time
    filtered.sort((a, b) => {
      const [dayA, monthA, yearA] = a.visitDate.split('-').map(Number);
      const [hoursA, minutesA] = a.visitTime.split(':').map(Number);
      const [dayB, monthB, yearB] = b.visitDate.split('-').map(Number);
      const [hoursB, minutesB] = b.visitTime.split(':').map(Number);

      const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
      const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);

      return dateA - dateB;
    });

    setFilteredAppointments(filtered);
    setDisplayedCount(Math.min(appointmentsPerLoad, filtered.length));
  }, [allAppointments, selectedFilter, searchTerm, appointmentsPerLoad]);

  // Automatically mark appointments as missed if time has passed and status is 'Pending'
  useEffect(() => {
    const checkMissedAppointments = async () => {
      console.log('Checking for missed appointments.');
      const now = new Date();

      for (const appointment of filteredAppointments) {
        if (appointment.visitStatus.toLowerCase() === 'pending') {
          const [day, month, year] = appointment.visitDate.split('-').map(Number);
          const [hours, minutes] = appointment.visitTime.split(':').map(Number);
          const appointmentTime = new Date(year, month - 1, day, hours, minutes);

          if (appointmentTime < now) {
            console.log(`Marking appointment ${appointment.id} as Missed.`);
            await handleAction(appointment, 'missed');
          }
        }
      }
    };

    if (filteredAppointments.length > 0) {
      checkMissedAppointments();
    }

    // Set interval to check every minute
    const intervalId = setInterval(() => {
      checkMissedAppointments();
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(intervalId);
  }, [filteredAppointments, session]);

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
        console.log('Loader is visible. Loading more appointments.');
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
      setDisplayedCount((prev) => {
        const newCount = Math.min(prev + appointmentsPerLoad, filteredAppointments.length);
        console.log(`Loading more appointments. New displayedCount: ${newCount}`);
        return newCount;
      });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setDisplayedCount(appointmentsPerLoad); // Reset displayed count on new search
    console.log('Search term updated:', e.target.value);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setDisplayedCount(appointmentsPerLoad); // Reset displayed count when filter changes
    console.log('Filter changed to:', filter);
  };

  const handleRescheduleChange = (appointmentId, field, value) => {
    setRescheduleData((prev) => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        [field]: value,
      },
    }));
    console.log(`Reschedule data updated for appointment ${appointmentId}:`, field, value);
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
      console.log(`Appointment ${appointment.id} updated with action: ${action}`, updateObj);

      if (action === 'done') {
        showToast(`Appointment with ${appointment.patientName} marked as Completed!`, 'success');
      } else if (action === 'missed') {
        showToast(`Appointment with ${appointment.patientName} marked as Missed!`, 'success');
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
      console.log(`Appointment ${appointment.id} state updated locally.`);
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
      console.log(`Reschedule attempted without complete data for appointment ${appointment.id}.`);
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
        console.log(`Reschedule failed: Appointment ${appointment.id} does not exist.`);
        return;
      }
      const currentVisitData = visitDocSnap.data();

      // Prepare the update object
      const newDateObj = new Date(date);
      const [resHours, resMinutes] = time.split(':').map(Number);
      newDateObj.setHours(resHours, resMinutes);

      const isMissed = newDateObj.getTime() < Date.now();
      console.log(`Rescheduling appointment ${appointment.id} to ${newDateObj}. Is missed: ${isMissed}`);

      const updateObj = {
        visitDate: formatDateForStorage(newDateObj), // Update visitDate to new date
        visitTime: time, // Update visitTime to new time
        treatmentStatus: 'Ongoing', // Maintain as 'Ongoing'
        visitStatus: 'Rescheduled', // Update visitStatus to 'Rescheduled'
        missedDate: currentVisitData.missedDate || null, // Preserve original missed date if any
      };

      await updateDoc(visitRef, updateObj);
      console.log(`Appointment ${appointment.id} rescheduled with update:`, updateObj);

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
      console.log(`Appointment ${appointment.id} state updated locally after rescheduling.`);

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
        <h2 className="text-2xl font-bold">This Week's Appointments</h2>
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
        <>
          {filteredAppointments.length === 0 ? (
            <p className="text-gray-600">No appointments scheduled for the selected period.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAppointments.slice(0, displayedCount).map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Appointment Status Badge */}
                    {appointment.visitStatus.toLowerCase() === 'completed' && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Completed
                      </span>
                    )}
                    {appointment.visitStatus.toLowerCase() === 'missed' && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Missed
                      </span>
                    )}
                    {appointment.visitStatus.toLowerCase() === 'rescheduled' && (
                      <span
                        className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${
                          new Date(`${appointment.visitDate} ${appointment.visitTime}`) < new Date()
                            ? 'bg-red-500 text-white'
                            : 'bg-purple-500 text-white'
                        }`}
                      >
                        {new Date(`${appointment.visitDate} ${appointment.visitTime}`) < new Date()
                          ? 'Rescheduled but Missed'
                          : 'Rescheduled'}
                      </span>
                    )}
                    {appointment.visitStatus.toLowerCase() === 'upcoming' && (
                      <span className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                        Upcoming
                      </span>
                    )}
                    {!['completed', 'missed', 'rescheduled', 'upcoming'].includes(
                      appointment.visitStatus.toLowerCase()
                    ) && (
                      <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        Pending
                      </span>
                    )}

                    <h3 className="text-xl font-semibold mb-2">{appointment.patientName || 'Unknown'}</h3>
                    <p>
                      <strong>Date:</strong> {appointment.visitDate || ''}
                    </p>
                    <p>
                      <strong>Time:</strong> {appointment.visitTime || ''}
                    </p>
                    <p>
                      <strong>Reason:</strong> {appointment.visitReason || 'N/A'}
                    </p>
                    {/* Display Rescheduled To if applicable */}
                    {appointment.visitStatus.toLowerCase() === 'rescheduled' && (
                      <p
                        className={`mt-2 ${
                          new Date(`${appointment.visitDate} ${appointment.visitTime}`) < new Date()
                            ? 'text-red-700'
                            : 'text-purple-700'
                        }`}
                      >
                        Rescheduled to <strong>{appointment.visitDate} at {appointment.visitTime}</strong>
                      </p>
                    )}
                    {/* Action Buttons */}
                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => handleAction(appointment, 'done')}
                        className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm transition-colors duration-300 ${
                          ['missed', 'completed'].includes(appointment.visitStatus.toLowerCase()) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={['missed', 'completed'].includes(appointment.visitStatus.toLowerCase())}
                        aria-label={`Mark appointment with ${appointment.patientName} as Done`}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleAction(appointment, 'missed')}
                        className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition-colors duration-300 ${
                          ['missed', 'completed'].includes(appointment.visitStatus.toLowerCase()) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={['missed', 'completed'].includes(appointment.visitStatus.toLowerCase())}
                        aria-label={`Mark appointment with ${appointment.patientName} as Missed`}
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
                          ['missed', 'completed'].includes(appointment.visitStatus.toLowerCase()) ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                        aria-label={`Select new date for appointment with ${appointment.patientName}`}
                        disabled={['missed', 'completed'].includes(appointment.visitStatus.toLowerCase())}
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
                              ['missed', 'completed'].includes(appointment.visitStatus.toLowerCase()) ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                            aria-label={`Select new time for appointment with ${appointment.patientName}`}
                            disabled={['missed', 'completed'].includes(appointment.visitStatus.toLowerCase())}
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
                        !['missed', 'completed'].includes(appointment.visitStatus.toLowerCase())
                          ? ''
                          : 'cursor-not-allowed opacity-50'
                      }`}
                      disabled={
                        !rescheduleData[appointment.id]?.date ||
                        !rescheduleData[appointment.id]?.time ||
                        ['missed', 'completed'].includes(appointment.visitStatus.toLowerCase())
                      }
                      aria-label={`Reschedule appointment with ${appointment.patientName}`}
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
                ))}
              </div>

              {/* Loader for infinite scroll */}
              <div ref={loader} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentsThisWeek;

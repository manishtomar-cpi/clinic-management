'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption';
import { FiAlertCircle } from 'react-icons/fi';
import { BsSearch } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { showToast } from './Toast';
import { TailSpin } from 'react-loader-spinner'; // For loading indicators

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

const AppointmentsToday = () => {
  const { data: session } = useSession();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rescheduleData, setRescheduleData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [displayedCount, setDisplayedCount] = useState(0);
  const loader = useRef(null);
  const windowWidth = useWindowWidth();

  // Determine appointments per load based on screen width
  const getAppointmentsPerLoad = () => {
    if (windowWidth >= 1024) return 9; // Desktop
    if (windowWidth >= 768) return 6;  // Tablet
    return 3;                           // Mobile
  };

  const appointmentsPerLoad = getAppointmentsPerLoad();

  useEffect(() => {
    if (!session || !session.user || !session.user.id) return;

    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    const unsubscribePatients = onSnapshot(patientsRef, (patientsSnapshot) => {
      const patientIds = patientsSnapshot.docs.map(doc => doc.id);
      if (patientIds.length === 0) {
        setTodayAppointments([]);
        setDisplayedCount(0);
        return;
      }

      // Listen to each patient's visits
      const visitsListeners = patientIds.map(patientId => {
        const visitsRef = collection(db, 'doctors', doctorId, 'patients', patientId, 'visits');
        return onSnapshot(visitsRef, (visitsSnapshot) => {
          const appointments = visitsSnapshot.docs.map(visitDoc => ({
            id: visitDoc.id,
            patientId,
            ...visitDoc.data(),
          }));

          setTodayAppointments(prevAppointments => {
            // Remove old appointments for this patient
            const filtered = prevAppointments.filter(appt => appt.patientId !== patientId);
            // Add new appointments
            return [...filtered, ...appointments];
          });
        });
      });

      // Cleanup listeners on unmount
      return () => {
        visitsListeners.forEach(unsub => unsub());
      };
    });

    return () => {
      if (unsubscribePatients) unsubscribePatients();
    };
  }, [session]);

  useEffect(() => {
    // Filter today's appointments
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const todayDateStr = `${dd}-${mm}-${yyyy}`;

    const filteredAppointments = todayAppointments.filter(appointment => {
      const nextVisitDateStr = decryptData(appointment.nextVisitDate);
      return nextVisitDateStr === todayDateStr;
    });

    // Sort appointments by time ascending
    filteredAppointments.sort((a, b) => {
      const [hoursA, minutesA] = decryptData(a.nextVisitTime).split(':').map(Number);
      const [hoursB, minutesB] = decryptData(b.nextVisitTime).split(':').map(Number);
      return hoursA !== hoursB ? hoursA - hoursB : minutesA - minutesB;
    });

    setTodayAppointments(filteredAppointments);
    setDisplayedCount(Math.min(appointmentsPerLoad, filteredAppointments.length));
  }, [todayAppointments, appointmentsPerLoad]);

  useEffect(() => {
    // Function to check and update missed appointments
    const checkMissedAppointments = async () => {
      const now = new Date();
      todayAppointments.forEach(appointment => {
        const status = appointment.visitStatus || 'Pending';
        if (status === 'Pending') {
          const nextVisitDateStr = decryptData(appointment.nextVisitDate);
          const nextVisitTimeStr = decryptData(appointment.nextVisitTime);
          if (nextVisitDateStr && nextVisitTimeStr) {
            const [day, month, year] = nextVisitDateStr.split('-').map(Number);
            const [hours, minutes] = nextVisitTimeStr.split(':').map(Number);
            const appointmentTime = new Date(year, month - 1, day, hours, minutes);

            if (appointmentTime < now) {
              // Time has passed; mark as Missed
              handleAction(appointment, 'missed');
            }
          }
        }
      });
    };

    // Initial check
    checkMissedAppointments();

    // Set interval to check every minute
    const intervalId = setInterval(() => {
      checkMissedAppointments();
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(intervalId);
  }, [todayAppointments]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
        showToast('Appointment marked as Completed!', 'success');
      } else if (action === 'missed') {
        showToast('Appointment marked as Missed!', 'success');
      }

      // Update the appointment in the local state
      setTodayAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment.id
            ? {
                ...appt,
                ...updateObj,
              }
            : appt
        )
      );

      // Reset reschedule data if any
      setRescheduleData((prev) => ({
        ...prev,
        [appointment.id]: {},
      }));
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
        nextVisitDate: formatDateForStorage(newDateObj),
        nextVisitTime: time, // Store time string directly
        treatmentStatus: 'Ongoing', // Maintain as 'Ongoing'
        visitStatus: 'Rescheduled', // Add or update 'visitStatus' to 'Rescheduled'
        missedDate: currentVisitData.missedDate || null, // Preserve original missed date if any
      };

      await updateDoc(visitRef, updateObj);

      showToast('Appointment rescheduled successfully!', 'success');

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

  const categorizeAppointment = (appointment) => {
    const [day, month, year] = decryptData(appointment.nextVisitDate).split('-').map(Number);
    const [hours, minutes] = decryptData(appointment.nextVisitTime).split(':').map(Number);
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

  const filteredAppointments = todayAppointments.filter((appointment) => {
    // Filter by search term
    const matchesSearch = decryptData(appointment.patientName)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filter by selected category
    const category = categorizeAppointment(appointment);
    const matchesFilter =
      selectedFilter === 'All' || category === selectedFilter;

    return matchesSearch && matchesFilter;
  });

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
      ) : filteredAppointments.length === 0 ? (
        <p>No appointments scheduled for today.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.slice(0, displayedCount).map((appointment) => {
              const patientName = decryptData(appointment.patientName);
              const visitReason = appointment.visitReason;
              const visitStatus = appointment.visitStatus || 'Pending';
              const isMissed = visitStatus === 'Missed';
              const isCompleted = visitStatus === 'Completed';
              const isRescheduled = visitStatus === 'Rescheduled';
              
              // Decrypt nextVisitDate and nextVisitTime
              const nextVisitDateStr = decryptData(appointment.nextVisitDate);
              const nextVisitTimeStr = decryptData(appointment.nextVisitTime);
              
              // Compute appointmentDateTime
              let appointmentDateTime = null;
              if (nextVisitDateStr && nextVisitTimeStr) {
                const [day, month, year] = nextVisitDateStr.split('-').map(Number);
                const [hours, minutes] = nextVisitTimeStr.split(':').map(Number);
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
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {missedAfterReschedule ? 'Rescheduled but Missed' : 'Rescheduled'}
                    </span>
                  )}
                  {!isCompleted && !isMissed && !isRescheduled && (
                    <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Pending
                    </span>
                  )}

                  <h3 className="text-xl font-semibold mb-2">{patientName}</h3>
                  <p>
                    <strong>Time:</strong> {nextVisitTimeStr}
                  </p>
                  <p>
                    <strong>Reason:</strong> {visitReason}
                  </p>
                  {/* Display Rescheduled To if applicable */}
                  {isRescheduled && (
                    <p className={`mt-2 ${missedAfterReschedule ? 'text-red-700' : 'text-green-700'}`}>
                      Rescheduled to <strong>{nextVisitDateStr} at {nextVisitTimeStr}</strong>
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
      )}
    </div>
  );
};

export default AppointmentsToday;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
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

const MissedAppointments = () => {
  const { data: session } = useSession();
  const [missedAppointments, setMissedAppointments] = useState([]);
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

    const fetchMissedAppointments = async () => {
      setIsLoading(true);
      try {
        const doctorId = session.user.id;
        const patientsRef = collection(db, 'doctors', doctorId, 'patients');
        const patientsSnapshot = await getDocs(patientsRef);

        if (patientsSnapshot.empty) {
          setMissedAppointments([]);
          setDisplayedCount(0);
          setIsLoading(false);
          return;
        }

        const appointmentsData = [];
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        for (const patientDoc of patientsSnapshot.docs) {
          const patientId = patientDoc.id;
          const patientData = patientDoc.data();
          const patientName = decryptData(patientData.name);

          const visitsRef = collection(
            db,
            'doctors',
            doctorId,
            'patients',
            patientId,
            'visits'
          );

          const visitsSnapshot = await getDocs(visitsRef);

          visitsSnapshot.forEach((visitDoc) => {
            const visitData = visitDoc.data();
            const nextVisitDateStr = decryptData(visitData.nextVisitDate);
            const nextVisitTimeStr = decryptData(visitData.nextVisitTime);
            const treatmentStatus = visitData.treatmentStatus;
            const visitStatus = visitData.visitStatus || 'Ongoing'; // Default to 'Ongoing' if not present

            if (nextVisitDateStr && nextVisitTimeStr) {
              const [day, month, year] = nextVisitDateStr.split('-').map(Number);
              const [hours, minutes] = nextVisitTimeStr.split(':').map(Number);

              if (
                !isNaN(day) &&
                !isNaN(month) &&
                !isNaN(year) &&
                !isNaN(hours) &&
                !isNaN(minutes)
              ) {
                const nextVisitDateObj = new Date(year, month - 1, day, hours, minutes);
                const nextVisitTimestamp = nextVisitDateObj.getTime();
                const currentTimestamp = now.getTime();
                const firstDayOfMonthTimestamp = firstDayOfMonth.getTime();

                // Filter: Missed appointments within the current month
                if (
                  nextVisitTimestamp < currentTimestamp &&
                  nextVisitTimestamp >= firstDayOfMonthTimestamp &&
                  treatmentStatus !== 'Completed'
                ) {
                  // Determine if rescheduled and missed after reschedule
                  let missedAfterReschedule = false;
                  let rescheduledTo = null;

                  if (visitStatus === 'Rescheduled') {
                    const [resDay, resMonth, resYear] = nextVisitDateStr.split('-').map(Number);
                    const [resHours, resMinutes] = nextVisitTimeStr.split(':').map(Number);
                    const rescheduledDateObj = new Date(resYear, resMonth - 1, resDay, resHours, resMinutes);
                    if (rescheduledDateObj.getTime() < currentTimestamp) {
                      missedAfterReschedule = true;
                    }
                    rescheduledTo = `${nextVisitDateStr} at ${nextVisitTimeStr}`;
                  }

                  appointmentsData.push({
                    id: visitDoc.id,
                    patientId,
                    patientName,
                    nextVisitDate: nextVisitDateStr,
                    nextVisitTime: nextVisitTimeStr,
                    visitReason: visitData.visitReason,
                    visitStatus,
                    missedAfterReschedule,
                    rescheduledTo,
                  });
                }
              }
            }
          });
        }

        // Sort appointments by date descending
        appointmentsData.sort((a, b) => {
          const [dayA, monthA, yearA] = a.nextVisitDate.split('-').map(Number);
          const [hoursA, minutesA] = a.nextVisitTime.split(':').map(Number);
          const [dayB, monthB, yearB] = b.nextVisitDate.split('-').map(Number);
          const [hoursB, minutesB] = b.nextVisitTime.split(':').map(Number);
          const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
          const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
          return dateB - dateA;
        });

        setMissedAppointments(appointmentsData);
        setDisplayedCount(Math.min(appointmentsPerLoad, appointmentsData.length));
      } catch (error) {
        console.error('Error fetching missed appointments:', error);
        showToast('Error fetching missed appointments. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissedAppointments();
  }, [session, appointmentsPerLoad]);

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
      const updateObj = {
        nextVisitDate: formatDateForStorage(new Date(date)),
        nextVisitTime: time, // Store time string directly
        treatmentStatus: 'Ongoing', // Maintain as 'Ongoing'
        visitStatus: 'Rescheduled', // Add or update 'visitStatus' to 'Rescheduled'
        missedDate: currentVisitData.nextVisitDate, // Add 'missedDate'
      };

      await updateDoc(visitRef, updateObj);

      showToast('Appointment rescheduled successfully!', 'success');

      // Determine if rescheduled appointment has been missed
      const [resDay, resMonth, resYear] = updateObj.nextVisitDate.split('-').map(Number);
      const [resHours, resMinutes] = updateObj.nextVisitTime.split(':').map(Number);
      const rescheduledDateObj = new Date(resYear, resMonth - 1, resDay, resHours, resMinutes);
      const isMissed = rescheduledDateObj.getTime() < Date.now();

      // Update the appointment in the local state
      setMissedAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment.id
            ? {
                ...appt,
                nextVisitDate: updateObj.nextVisitDate,
                nextVisitTime: updateObj.nextVisitTime,
                visitStatus: updateObj.visitStatus,
                missedAfterReschedule: isMissed,
                rescheduledTo: `${updateObj.nextVisitDate} at ${updateObj.nextVisitTime}`,
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
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dateObj.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
  };

  const getFilterCategories = () => {
    const categories = ['All', 'Today', 'This Week', 'This Month'];
    return categories;
  };

  const categorizeAppointment = (appointment) => {
    const [day, month, year] = appointment.nextVisitDate.split('-').map(Number);
    const [hours, minutes] = appointment.nextVisitTime.split(':').map(Number);
    const appointmentDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    // Start of the week (Monday)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    if (
      appointmentDate.toDateString() === now.toDateString()
    ) {
      return 'Today';
    } else if (
      appointmentDate >= startOfWeek &&
      appointmentDate <= now
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

  const filteredAppointments = missedAppointments.filter((appointment) => {
    // Filter by search term
    const matchesSearch = appointment.patientName
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

    const observer = new IntersectionObserver((entities) => {
      const target = entities[0];
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
        <FiAlertCircle className="text-3xl text-red-500 mr-2" />
        <h2 className="text-2xl font-bold">Missed Appointments</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
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
                ? 'bg-red-500 text-white'
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
            color="#EF4444" // Tailwind red-500
            ariaLabel="loading"
          />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <p>No missed appointments.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.slice(0, displayedCount).map((appointment) => (
              <motion.div
                key={appointment.id}
                className="bg-gradient-to-r from-red-100 to-red-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
                whileHover={{ scale: 1.02 }}
              >
                {/* Rescheduled Badge */}
                {appointment.visitStatus === 'Rescheduled' && (
                  <span
                    className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${
                      appointment.missedAfterReschedule
                        ? 'bg-red-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {appointment.missedAfterReschedule ? 'Rescheduled but Missed' : 'Rescheduled'}
                  </span>
                )}

                <h3 className="text-xl font-semibold mb-2">{appointment.patientName}</h3>
                <p>
                  <strong>Date:</strong> {appointment.nextVisitDate}
                </p>
                <p>
                  <strong>Time:</strong> {appointment.nextVisitTime}
                </p>
                <p>
                  <strong>Reason:</strong> {appointment.visitReason}
                </p>
                {/* Display Rescheduled To */}
                {appointment.visitStatus === 'Rescheduled' && (
                  <p className={`mt-2 ${appointment.missedAfterReschedule ? 'text-red-700' : 'text-green-700'}`}>
                    Rescheduled to <strong>{appointment.rescheduledTo}</strong>
                  </p>
                )}
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
                    className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
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
                        className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </>
                  )}

                  <button
                    onClick={() => handleReschedule(appointment)}
                    className={`mt-2 py-2 px-4 rounded-full transition-colors duration-300 flex items-center justify-center ${
                      rescheduleData[appointment.id]?.date &&
                      rescheduleData[appointment.id]?.time
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-400 cursor-not-allowed text-gray-700'
                    }`}
                    disabled={
                      !rescheduleData[appointment.id]?.date ||
                      !rescheduleData[appointment.id]?.time
                    }
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
                </div>
              </motion.div>
            ))}
          </div>

          {/* Loader for infinite scroll */}
          <div ref={loader} />
        </>
      )}
    </div>
  );
};

export default MissedAppointments;


'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../db';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { FiAlertCircle } from 'react-icons/fi';
import { BsSearch } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { decryptData } from '../../lib/encryption';
import { showToast } from './Toast';

// Define motion variants for different appointment statuses
const appointmentVariants = {
  default: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  missed: {
    opacity: 1,
    y: -10,
    scale: 1.05,
    backgroundColor: '#fde68a', // Light yellow for missed
    transition: { duration: 0.5 },
  },
};

const AppointmentsToday = () => {
  const { data: session } = useSession();
  const [allAppointments, setAllAppointments] = useState([]);
  const [patientsMap, setPatientsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [displayedCount, setDisplayedCount] = useState(6);
  const loader = useRef(null);

  // Helper function to format dates from 'dd-mm-yyyy' to 'dd-mm-yyyy' (for display)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    const [day, month, year] = dateStr.split('-').map(Number);
    return `${day}-${month}-${year}`;
  };

  // Helper function to categorize appointments based on visitDate
  const categorizeAppointment = (appointment) => {
    const { visitDate } = appointment;
    if (!visitDate) return 'All';

    const now = new Date();
    const [day, month, year] = visitDate.split('-').map(Number);
    const visitDateObj = new Date(year, month - 1, day);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDateOnly = new Date(
      visitDateObj.getFullYear(),
      visitDateObj.getMonth(),
      visitDateObj.getDate()
    );

    if (appointmentDateOnly.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as first day

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    if (appointmentDateOnly >= startOfWeek && appointmentDateOnly <= endOfWeek) {
      return 'This Week';
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (appointmentDateOnly >= startOfMonth && appointmentDateOnly <= endOfMonth) {
      return 'This Month';
    }

    return 'All';
  };

  // Filter appointments based on selected filter and search term
  const filteredAppointments = useMemo(() => {
    return allAppointments.filter((appointment) => {
      const category = categorizeAppointment(appointment);
      const matchesFilter =
        selectedFilter === 'All' || category === selectedFilter;
      const matchesSearch = appointment.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allAppointments, selectedFilter, searchTerm]);

  // Handle automatic status updates
  useEffect(() => {
    const checkMissedAppointments = async () => {
      const now = new Date();
      for (const appointment of allAppointments) {
        const { visitDate, visitTime, visitStatus } = appointment;

        let scheduledDateTime;
        if (
          visitStatus.toLowerCase() === 'upcoming' ||
          visitStatus.toLowerCase() === 'rescheduled'
        ) {
          const [day, month, year] = visitDate.split('-').map(Number);
          const [hours, minutes] = visitTime.split(':').map(Number);
          scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
        } else {
          continue; // Skip other statuses
        }

        if (scheduledDateTime < now) {
          let newStatus = '';
          let updateFields = {};
          if (visitStatus.toLowerCase() === 'upcoming') {
            newStatus = 'Missed';
            updateFields = {
              visitStatus: newStatus,
              missedCount: (appointment.missedCount || 0) + 1,
            };
          } else if (visitStatus.toLowerCase() === 'rescheduled') {
            newStatus = 'Rescheduled but Missed';
            updateFields = {
              visitStatus: newStatus,
              missedCount: (appointment.missedCount || 0) + 1,
              rescheduledButMissed: true,
            };
          }

          if (newStatus) {
            try {
              const doctorId = session.user.id;
              const visitRef = doc(
                db,
                'doctors',
                doctorId,
                'patients',
                appointment.patientId,
                'visits',
                appointment.id
              );

              await updateDoc(visitRef, updateFields);

              // Update state locally
              setAllAppointments((prevAppointments) =>
                prevAppointments.map((appt) =>
                  appt.id === appointment.id
                    ? { ...appt, ...updateFields }
                    : appt
                )
              );

              showToast(
                `Appointment for ${appointment.patientName} marked as ${newStatus}.`,
                'info'
              );
            } catch (error) {
              console.error('Error updating appointment status:', error);
              showToast('Error updating appointment status.', 'error');
            }
          }
        }
      }
    };

    if (
      allAppointments.length > 0 &&
      session &&
      session.user &&
      session.user.id
    ) {
      checkMissedAppointments();
      const intervalId = setInterval(checkMissedAppointments, 60000); // Check every minute
      return () => clearInterval(intervalId);
    }
  }, [allAppointments, session]);

  // Fetch patients and their appointments
  useEffect(() => {
    if (!session || !session.user || !session.user.id) {
      console.log('No valid session found.');
      return;
    }

    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    const unsubscribePatients = onSnapshot(patientsRef, (patientsSnapshot) => {
      const patientData = {};
      patientsSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const decryptedName = data.name ? decryptData(data.name) : 'Unknown';
        const decryptedAddress = data.address ? decryptData(data.address) : 'N/A';
        const decryptedMobileNumber = data.mobileNumber
          ? decryptData(data.mobileNumber)
          : 'N/A';
        const decryptedDisease = data.disease ? decryptData(data.disease) : 'N/A';
        patientData[docSnap.id] = {
          name: decryptedName,
          address: decryptedAddress,
          mobileNumber: decryptedMobileNumber,
          disease: decryptedDisease,
        };
      });
      setPatientsMap(patientData);

      const patientIds = patientsSnapshot.docs.map((docSnap) => docSnap.id);

      setAllAppointments([]); // Reset appointments

      patientIds.forEach((patientId) => {
        const visitsRef = collection(
          db,
          'doctors',
          doctorId,
          'patients',
          patientId,
          'visits'
        );

        onSnapshot(visitsRef, (visitsSnapshot) => {
          const visits = visitsSnapshot.docs.map((visitDoc) => {
            const data = visitDoc.data();
            return {
              id: visitDoc.id,
              patientId,
              ...data,
              patientName: patientData[patientId]?.name || 'Unknown',
              address: patientData[patientId]?.address || 'N/A',
              mobileNumber: patientData[patientId]?.mobileNumber || 'N/A',
              disease: patientData[patientId]?.disease || 'N/A',
            };
          });

          setAllAppointments((prevAppointments) => {
            // Remove previous appointments of this patient
            const filteredPrev = prevAppointments.filter(
              (appt) => appt.patientId !== patientId
            );
            // Add updated visits
            return [...filteredPrev, ...visits];
          });
        });
      });
    });

    return () => {
      unsubscribePatients();
    };
  }, [session]);

  // Infinite Scroll: Load more appointments when loader is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

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
      setDisplayedCount((prev) =>
        Math.min(prev + 6, filteredAppointments.length)
      );
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setDisplayedCount(6);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setDisplayedCount(6);
  };

  const getFilterCategories = () => ['Today', 'This Week', 'This Month', 'All'];

  // Removed reschedule handlers as rescheduling is moved to Missed Appointments

  return (
    <div className="p-6">
      {/* Removed the "Today's Appointments" Header */}
      
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
            className={`px-4 py-2 rounded-xl transition-colors duration-300 ${
              selectedFilter === filter
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-purple-300'
            }`}
            
            aria-label={`Filter appointments by ${filter}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <p className="text-gray-600">No appointments found.</p>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          {/* Removed the "Appointments Today" Header inside the card */}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.slice(0, displayedCount).map((appointment) => {
              const {
                patientName,
                address,
                mobileNumber,
                disease,
                visitDate,
                visitTime,
                visitStatus,
                missedCount = 0,
                rescheduled,
                rescheduledButMissed,
              } = appointment;

              // Determine if the appointment is missed
              const isMissed =
                visitStatus.toLowerCase() === 'missed' ||
                visitStatus.toLowerCase() === 'rescheduled but missed';

              // Determine badge color and text based on status
              let badge = { text: '', color: '' };
              switch (visitStatus.toLowerCase()) {
                case 'completed':
                  badge = { text: 'Completed', color: 'bg-green-500' };
                  break;
                case 'missed':
                  badge = { text: 'Missed', color: 'bg-red-500' };
                  break;
                case 'rescheduled':
                  badge = { text: 'Rescheduled', color: 'bg-purple-500' };
                  break;
                case 'rescheduled but missed':
                  badge = { text: 'Rescheduled but Missed', color: 'bg-orange-500' };
                  break;
                case 'upcoming':
                  badge = { text: 'Upcoming', color: 'bg-yellow-200 text-yellow-800' };
                  break;
                default:
                  badge = { text: 'Pending', color: 'bg-gray-500' };
                  break;
              }

              return (
                <motion.div
                  key={appointment.id}
                  className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative ${
                    isMissed ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                  variants={appointmentVariants}
                  initial="default"
                  animate={isMissed ? 'missed' : 'default'}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Appointment Status Badge */}
                  {badge.text && (
                    <span
                      className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  )}

                  {/* Appointment Details */}
                  <h3 className="text-xl font-semibold mb-2">{patientName}</h3>
                  <p>
                    <strong>Address:</strong> {address}
                  </p>
                  <p>
                    <strong>Mobile:</strong> {mobileNumber}
                  </p>
                  <p>
                    <strong>Disease:</strong> {disease}
                  </p>
                  <p>
                    <strong>Visit Date:</strong> {formatDateForDisplay(visitDate)}
                  </p>
                  <p>
                    <strong>Visit Time:</strong> {visitTime || 'N/A'}
                  </p>
                  <p>
                    <strong>Missed Count:</strong> {missedCount}
                  </p>

                  {/* Conditional Message */}
                  {isMissed && (
                    <p className="mt-2 text-red-700">
                      This visit is <strong>{visitStatus}</strong>. Please take necessary actions.
                    </p>
                  )}

                  {/* Removed Reschedule Button as per requirements */}
                </motion.div>
              );
            })}
          </div>

          {/* Loader for infinite scroll */}
          <div ref={loader} />
        </div>
      )}
    </div>
  );
};

// Progress Bar Component (Optional: If you have one)
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

export default AppointmentsToday;

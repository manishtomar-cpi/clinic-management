// src/app/dashboard/page.js

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { showToast } from '../../app/components/Toast';
import Sidebar from '../components/Sidebar';
import Tile from '../components/Tile';
import {
  FiCalendar,
  FiAlertCircle,
  FiUsers,
  FiClipboard,
} from 'react-icons/fi';
import { FaCalendarCheck, FaRupeeSign, FaHeartbeat } from 'react-icons/fa';
import AddPatient from '../components/AddPatient';
import SearchPatient from '../components/SearchPatient';
import UpdateProfile from '../components/UpdateProfile';
import PatientBalance from '../components/PatientBalance';
import OngoingPatients from '../components/OngoingPatients';
import AppointmentsToday from '../components/AppointmentsToday';
import AppointmentsThisWeek from '../components/AppointmentsThisWeek';
import AddVisit from '../components/AddVisit';
import MissedAppointments from '../components/MissedAppointments';
import { decryptData } from '../../lib/encryption';
import { db } from '../../db';
import { collection, onSnapshot } from 'firebase/firestore';
import StatsChart from '../components/StatsChart';

// Spinner Component
const MedicalSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <FaHeartbeat className="animate-pulse text-red-500 text-6xl" />
    </div>
  );
};

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeContent, setActiveContent] = useState('Dashboard');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [tileData, setTileData] = useState([]);
  const [allVisits, setAllVisits] = useState([]); // Centralized state for all visits
  const visitsListenersRef = useRef([]); // To store visits listeners

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session) {
      try {
        // Decrypt the encrypted data from the session
        const decryptedDoctorName = decryptData(session.user?.doctorName);
        const decryptedClinicName = decryptData(session.user?.clinicName);
        setDoctorName(decryptedDoctorName);
        setClinicName(decryptedClinicName);

        const unsubscribe = fetchDashboardData();
        return () => {
          if (unsubscribe) unsubscribe();
        };
      } catch (error) {
        console.error('Decryption Error:', error);
        showToast('Error decrypting user data. Please contact support.', 'error');
      }
    }
  }, [status, session, router]);

  const fetchDashboardData = () => {
    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    const unsubscribePatients = onSnapshot(
      patientsRef,
      (patientsSnapshot) => {
        const patientIds = patientsSnapshot.docs.map((doc) => doc.id);

        // Clean up existing visits listeners
        visitsListenersRef.current.forEach((unsub) => unsub());
        visitsListenersRef.current = [];

        // Reset allVisits
        setAllVisits([]);

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
              const visits = visitsSnapshot.docs.map((visitDoc) => ({
                id: visitDoc.id,
                patientId,
                ...visitDoc.data(),
              }));

              setAllVisits((prevVisits) => {
                // Remove old visits for this patient
                const filteredVisits = prevVisits.filter(
                  (visit) => visit.patientId !== patientId
                );
                // Add updated visits
                return [...filteredVisits, ...visits];
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

    return unsubscribePatients;
  };

  useEffect(() => {
    // Compute counts based on allVisits
    let ongoingTreatments = 0;
    let outstandingBalance = 0;
    let appointmentsToday = 0;
    let appointmentsThisWeek = 0;
    let missedAppointmentsToday = 0;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of the current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the current week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Extract unique patient IDs
    const uniquePatientIds = new Set(allVisits.map((visit) => visit.patientId));
    const totalPatients = uniquePatientIds.size;

    allVisits.forEach((visit) => {
      let treatmentStatus = '';
      let totalAmount = 0;
      let amountPaid = 0;
      let nextVisitDateStr = '';
      let nextVisitTimeStr = '';

      try {
        treatmentStatus = decryptData(visit.treatmentStatus || '');
        totalAmount = parseFloat(decryptData(visit.totalAmount) || '0');
        amountPaid = parseFloat(decryptData(visit.amountPaid) || '0');
        nextVisitDateStr = decryptData(visit.nextVisitDate);
        nextVisitTimeStr = decryptData(visit.nextVisitTime);
      } catch (error) {
        console.error('Decryption Error for visit:', visit.id, error);
        // Optionally, show a toast or handle the error as needed
        return; // Skip this visit if decryption fails
      }

      if (treatmentStatus === 'Ongoing') {
        ongoingTreatments += 1;
      }

      outstandingBalance += totalAmount - amountPaid;

      if (nextVisitDateStr) {
        const [day, month, year] = nextVisitDateStr.split('-').map(Number);
        const nextVisitDate = new Date(year, month - 1, day);

        // If next visit time is available, use it; otherwise, assume it's at the start of the day
        if (nextVisitTimeStr) {
          const [hours, minutes] = nextVisitTimeStr.split(':').map(Number);
          nextVisitDate.setHours(hours, minutes, 0, 0);
        } else {
          nextVisitDate.setHours(0, 0, 0, 0);
        }

        // Check if the visit is today and missed
        if (
          nextVisitDate >= todayStart &&
          nextVisitDate < now &&
          treatmentStatus !== 'Completed'
        ) {
          missedAppointmentsToday += 1;
        }

        // Check if the visit is today for appointmentsToday count
        if (nextVisitDate >= todayStart && nextVisitDate <= todayEnd) {
          appointmentsToday += 1;
        }

        // Check if the visit is within this week
        if (nextVisitDate >= startOfWeek && nextVisitDate <= endOfWeek) {
          appointmentsThisWeek += 1;
        }
      }
    });

    setTileData([
      {
        title: 'Total Patients',
        count: totalPatients,
        icon: <FiUsers className="text-blue-500" />,
        color: 'border-blue-500',
        description: 'Number of registered patients',
        component: 'OngoingPatients',
      },
      {
        title: 'Ongoing Treatments',
        count: ongoingTreatments,
        icon: <FiClipboard className="text-green-500" />,
        color: 'border-green-500',
        description: 'Patients currently under treatment',
        component: 'OngoingPatients',
      },
      {
        title: 'Appointments Today',
        count: appointmentsToday,
        icon: <FiCalendar className="text-purple-500" />,
        color: 'border-purple-500',
        description: 'Scheduled appointments for today',
        component: 'AppointmentsToday',
      },
      {
        title: 'Appointments This Week',
        count: appointmentsThisWeek,
        icon: <FaCalendarCheck className="text-teal-500" />,
        color: 'border-teal-500',
        description: 'Scheduled appointments for this week',
        component: 'AppointmentsThisWeek',
      },
      {
        title: 'Missed Appointments Today',
        count: missedAppointmentsToday,
        icon: <FiAlertCircle className="text-red-500" />,
        color: 'border-red-500',
        description: 'Missed appointments for today',
        component: 'MissedAppointments',
      },
      {
        title: 'Outstanding Balance (₹)',
        count: outstandingBalance.toFixed(2),
        icon: <FaRupeeSign className="text-yellow-500" />,
        color: 'border-yellow-500',
        description: 'Total outstanding payments',
        component: 'PatientBalance',
      },
    ]);
  }, [allVisits]);

  if (status === 'loading') {
    return <MedicalSpinner />;
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    showToast('You have successfully logged out!', 'success');
    await signOut({ callbackUrl: '/' });
  };

  const handleTileClick = (component) => {
    setActiveContent(component);
  };

  const handleMenuItemClick = (component) => {
    if (component === 'Logout') {
      handleLogout();
    } else if (component === 'Home') {
      router.push('/');
    } else {
      setActiveContent(component);
    }
  };

  const renderContent = () => {
    switch (activeContent) {
      case 'AddPatient':
        return <AddPatient />;
      case 'AddVisit':
        return <AddVisit />;
      case 'SearchPatient':
        return <SearchPatient />;
      case 'UpdateProfile':
        return <UpdateProfile />;
      case 'PatientBalance':
        return <PatientBalance />;
      case 'OngoingPatients':
        return <OngoingPatients />;
      case 'AppointmentsToday':
        return <AppointmentsToday />;
      case 'AppointmentsThisWeek':
        return <AppointmentsThisWeek />;
      case 'MissedAppointments':
        return <MissedAppointments />;
      case 'Dashboard':
      default:
        return (
          <>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-md mb-6 w-full sm:w-11/12 md:w-10/12 lg:w-full mt-10 lg:mt-0">
              <h2 className="text-3xl font-bold mb-2">Welcome back, Dr. {doctorName}!</h2>
              <p className="text-lg">Hope you have a productive day at {clinicName}.</p>
            </div>

            {/* Stats Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tileData.map((tile, idx) => (
                <Tile
                  key={idx}
                  title={tile.title}
                  count={tile.count}
                  icon={tile.icon}
                  color={tile.color}
                  description={tile.description}
                  onClick={() => handleTileClick(tile.component)}
                />
              ))}
            </div>

            {/* Charts */}
            <StatsChart />
          </>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onMenuItemClick={handleMenuItemClick} activeItem={activeContent} />
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-6">
          <div>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

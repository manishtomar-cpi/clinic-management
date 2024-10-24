// src/app/dashboard/page.js

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { showToast } from '../../app/components/Toast';
import Sidebar from '../components/Sidebar';
import Tile from '../components/Tile';
import {
  FiCalendar,
  FiAlertCircle,
  FiDollarSign,
  FiUsers,
  FiClipboard,
} from 'react-icons/fi';
import { FaCalendarCheck } from 'react-icons/fa';

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
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import StatsChart from '../components/StatsChart';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeContent, setActiveContent] = useState('Dashboard');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [tileData, setTileData] = useState([]);

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
    const unsubscribePatients = onSnapshot(patientsRef, async (patientsSnapshot) => {
      const totalPatients = patientsSnapshot.size;
      let ongoingTreatments = 0;
      let outstandingBalance = 0;

      const today = new Date();
      let appointmentsToday = 0;
      let appointmentsThisWeek = 0;
      let missedAppointments = 0;

      const patientPromises = patientsSnapshot.docs.map(async (patientDoc) => {
        const patientId = patientDoc.id;
        const patientData = patientDoc.data();
        const treatmentStatus = decryptData(patientData.treatmentStatus || '');

        if (treatmentStatus === 'Ongoing') {
          ongoingTreatments += 1;
        }

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

          const totalAmount = parseFloat(decryptData(visitData.totalAmount) || '0');
          const amountPaid = parseFloat(decryptData(visitData.amountPaid) || '0');
          outstandingBalance += totalAmount - amountPaid;

          const nextVisitDateStr = decryptData(visitData.nextVisitDate);
          if (nextVisitDateStr) {
            const nextVisitDate = new Date(nextVisitDateStr);
            if (isSameDay(nextVisitDate, today)) {
              appointmentsToday += 1;
            }
            if (isSameWeek(nextVisitDate, today)) {
              appointmentsThisWeek += 1;
            }
            if (nextVisitDate < today && treatmentStatus !== 'Completed') {
              missedAppointments += 1;
            }
          }
        });
      });

      await Promise.all(patientPromises);

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
          title: 'Missed Appointments',
          count: missedAppointments,
          icon: <FiAlertCircle className="text-red-500" />,
          color: 'border-red-500',
          description: 'Missed appointments',
          component: 'MissedAppointments',
        },
        {
          title: 'Outstanding Balance (₹)',
          count: outstandingBalance.toFixed(2),
          icon: <FiDollarSign className="text-yellow-500" />,
          color: 'border-yellow-500',
          description: 'Total outstanding payments',
          component: 'PatientBalance',
        },
      ]);
    });

    return () => {
      unsubscribePatients();
    };
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isSameWeek = (date1, date2) => {
    const weekStart = new Date(date2);
    weekStart.setDate(date2.getDate() - date2.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return date1 >= weekStart && date1 <= weekEnd;
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
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
          {/* Removed the title display */}
          <div>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

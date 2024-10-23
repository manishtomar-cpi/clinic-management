'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { showToast } from '../../app/components/Toast';
import Sidebar from '../components/Sidebar';
import Tile from '../components/Tile';
import { FiCalendar, FiUsers, FiAlertCircle } from 'react-icons/fi';
import AddPatient from '../components/AddPatient';
import SearchPatient from '../components/SearchPatient';
import UpdateProfile from '../components/UpdateProfile';
import PatientBalance from '../components/PatientBalance';
import OngoingPatients from '../components/OngoingPatients';
import AppointmentsToday from '../components/AppointmentsToday';
import AppointmentsThisWeek from '../components/AppointmentsThisWeek';
import MissedAppointments from '../components/MissedAppointments';

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeContent, setActiveContent] = useState('Dashboard');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  const tileData = [
    {
      title: 'Ongoing Patients',
      count: 5,
      icon: <FiUsers className="text-blue-500" />,
      component: 'OngoingPatients',
    },
    {
      title: 'Appointments Today',
      count: 10,
      icon: <FiCalendar className="text-green-500" />,
      component: 'AppointmentsToday',
    },
    {
      title: 'Appointments This Week',
      count: 30,
      icon: <FiCalendar className="text-purple-500" />,
      component: 'AppointmentsThisWeek',
    },
    {
      title: 'Missed Appointments Today',
      count: 2,
      icon: <FiAlertCircle className="text-red-500" />,
      component: 'MissedAppointments',
    },
  ];

  const handleTileClick = (component) => {
    setActiveContent(component);
  };

  const handleMenuItemClick = (component) => {
    if (component === 'Logout') {
      handleLogout();
    } else {
      setActiveContent(component);
    }
  };

  const renderContent = () => {
    switch (activeContent) {
      case 'AddPatient':
        return <AddPatient />;
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
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tileData.map((tile, idx) => (
                <Tile
                  key={idx}
                  title={tile.title}
                  count={tile.count}
                  icon={tile.icon}
                  onClick={() => handleTileClick(tile.component)}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar onMenuItemClick={handleMenuItemClick} activeItem={activeContent} />
      <div className="flex-1 min-h-screen bg-gray-100 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-6">
            {activeContent === 'Dashboard'
              ? 'Welcome to the Dashboard, Doctor!'
              : activeContent.replace(/([A-Z])/g, ' $1').trim()}
          </h1>
        </div>
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default DashboardPage;

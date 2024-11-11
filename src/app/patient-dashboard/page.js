'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { showToast } from '../../app/components/Toast'; // Ensure this utility exists
import PatientSidebar from '../components/PatientSidebar';
import MedicalSpinner from '../components/MedicalSpinner';
import ProtectedRoute from '../components/ProtectedRoute'; // Import the ProtectedRoute
import { decryptData } from '../../lib/encryption'; // Ensure this utility exists

const PatientDashboardContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patientData, setPatientData] = useState({
    name: '',
    email: '',
    username: '',
    doctorName: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      try {
        // Decrypt patient information from the session
        const decryptedName = decryptData(session.user.name);
        const decryptedEmail = decryptData(session.user.email);
        const decryptedUsername = decryptData(session.user.username);
        const decryptedDoctorName = decryptData(session.user.doctorName);

        setPatientData({
          name: decryptedName,
          email: decryptedEmail,
          username: decryptedUsername,
          doctorName: decryptedDoctorName,
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Decryption Error:', error);
        showToast('Error fetching your data. Please contact support.', 'error');
        setIsLoading(false);
      }
    }
  }, [status, session]);

  if (isLoading) {
    return <MedicalSpinner />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PatientSidebar />
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-md mb-6 w-full sm:w-11/12 md:w-10/12 lg:w-full mt-10 lg:mt-0">
            <h2 className="text-3xl font-bold mb-2">Welcome, {patientData.name}!</h2>
            <p className="text-lg">Managing your health has never been easier.</p>
          </div>

          {/* Patient Information Card */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6 w-full sm:w-11/12 md:w-10/12 lg:w-full">
            <h3 className="text-2xl font-semibold mb-4">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Name:</p>
                <p className="text-gray-800 font-medium">{patientData.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="text-gray-800 font-medium">{patientData.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Username:</p>
                <p className="text-gray-800 font-medium">{patientData.username}</p>
              </div>
              <div>
                <p className="text-gray-600">Doctor:</p>
                <p className="text-gray-800 font-medium">{patientData.doctorName}</p>
              </div>
            </div>
          </div>

          {/* Future Features Placeholder */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6 w-full sm:w-11/12 md:w-10/12 lg:w-full">
            <h3 className="text-2xl font-semibold mb-4">Upcoming Features</h3>
            <p className="text-gray-600">
              Stay tuned! We're working on adding more features to enhance your experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientDashboardPage = () => {
  return (
    <ProtectedRoute requiredRole="patient">
      <PatientDashboardContent />
    </ProtectedRoute>
  );
};

export default PatientDashboardPage;

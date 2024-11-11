'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../app/components/Toast'; // Ensure this utility exists
import PatientSidebar from '../components/PatientSidebar';
import MedicalSpinner from '../components/MedicalSpinner';
import ProtectedRoute from '../components/ProtectedRoute'; // Import the ProtectedRoute
import { decryptData } from '../../lib/encryption'; // Ensure this utility exists
import { db } from '../../db';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaStethoscope, FaFileMedical, FaCalendarAlt, FaRegFileAlt, FaEnvelope, FaHeart  } from 'react-icons/fa';

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
  const [doctorName, setDoctorName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (status === 'authenticated' && session) {
        try {
          // Fetch patient data from 'doctors' collection
          const doctorId = session.user.doctorId;
          const userId = session.user.id;

          if (!doctorId) {
            throw new Error('Doctor ID not found');
          }

          const patientDocRef = doc(db, 'doctors', doctorId, 'patients', userId);
          const patientDoc = await getDoc(patientDocRef);

          if (patientDoc.exists()) {
            const data = patientDoc.data();
            const decryptedData = {};
            for (const key in data) {
              if (key !== 'treatmentStatus' && key !== 'createdAt') {
                decryptedData[key] = decryptData(data[key]);
              }
            }
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
          }

          // Doctor's name is already in session
          setDoctorName(session.user.doctorName || '');

          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching patient data:', error);
          showToast('Error fetching your data. Please contact support.', 'error');
          setIsLoading(false);
        }
      }
    };

    fetchPatientData();
  }, [status, session]);

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
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-md mb-6 w-full sm:w-11/12 md:w-10/12 lg:w-full mt-10 lg:mt-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-2">Welcome, {patientData.name}!</h2>
            <p className="text-lg">Managing your health has never been easier.</p>
            {doctorName && (
              <p className="mt-2">
                Your assigned doctor: <span className="font-semibold">{doctorName}</span>
              </p>
            )}
          </motion.div>

          {/* Patient Information Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <InfoCard
              label="Name"
              value={patientData.name}
              icon={<FaHeartbeat color="#FF69B4" />} // HotPink
            />
            <InfoCard
              label="Age"
              value={patientData.age}
              icon={<FaStethoscope color="#FFD700" />} // Gold
            />
            <InfoCard
              label="Gender"
              value={patientData.gender}
              icon={<FaHeartbeat color="#1E90FF" />} // DodgerBlue
            />
            <InfoCard
              label="Address"
              value={patientData.address}
              icon={<FaRegFileAlt color="#32CD32" />} // LimeGreen
            />
            <InfoCard
              label="Mobile Number"
              value={patientData.mobileNumber}
              icon={<FaHeartbeat color="#FF4500" />} // OrangeRed
            />
            <InfoCard
              label="Email"
              value={patientData.email}
              icon={<FaEnvelope color="#9400D3" />} // DarkViolet
            />
            <InfoCard
              label="Disease/Condition"
              value={patientData.disease}
              icon={<FaFileMedical color="#FF6347" />} // Tomato
            />
            <InfoCard
              label="Notes"
              value={patientData.notes}
              icon={<FaHeart color="#FF1493" />} // DeepPink
            />
          </motion.div>

          {/* Additional Sections */}
          {/* Upcoming Appointments */}
          <motion.div
            className="bg-white shadow-md rounded-lg p-6 mb-6 w-full sm:w-11/12 md:w-10/12 lg:w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-2xl font-semibold mb-4">Upcoming Appointments</h3>
            {/* Placeholder for appointments */}
            <div className="flex items-center text-gray-600">
              <FaCalendarAlt className="text-2xl mr-2 animate-pulse" />
              <p>You have no upcoming appointments scheduled.</p>
            </div>
          </motion.div>

          {/* Health Records */}
          <motion.div
            className="bg-white shadow-md rounded-lg p-6 mb-6 w-full sm:w-11/12 md:w-10/12 lg:w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h3 className="text-2xl font-semibold mb-4">Health Records</h3>
            {/* Placeholder for health records */}
            <div className="flex items-center text-gray-600">
              <FaFileMedical className="text-2xl mr-2 animate-spin" />
              <p>Your health records will appear here once available.</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const InfoCard = ({ label, value, icon }) => (
  <motion.div
    className="flex items-center p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg shadow hover:shadow-lg transition-shadow"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-3xl mr-4">{icon}</div>
    <div>
      <p className="text-gray-600">{label}</p>
      <p className="text-gray-800 font-semibold">{value}</p>
    </div>
  </motion.div>
);

export default PatientDashboardContent;

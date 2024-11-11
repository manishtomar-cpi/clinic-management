// PatientDashboardContent.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { showToast } from '../../app/components/Toast';
import PatientSidebar from '../components/PatientSidebar';
import MedicalSpinner from '../components/MedicalSpinner';
import { decryptData } from '../../lib/encryption';
import { db } from '../../db';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  FaHeartbeat,
  FaStethoscope,
  FaFileMedical,
  FaCalendarAlt,
  FaRegFileAlt,
  FaEnvelope,
  FaHeart,
  FaClinicMedical,
  FaMapMarkerAlt,
  FaUserMd,
  FaPhoneAlt,
  FaStickyNote,
} from 'react-icons/fa';

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
  const [doctorData, setDoctorData] = useState({
    doctorName: '',
    clinicName: '',
    clinicLocation: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatientAndDoctorData = async () => {
      if (status === 'authenticated' && session) {
        // Check if the user has the 'patient' role
        if (session.user.role !== 'patient') {
          showToast('Access denied. Patients only.', 'error');
          router.push('/patient-login'); // Redirect to login or appropriate page
          return;
        }

        try {
          const userId = session.user.id;
          const doctorId = session.user.doctorId;

          // Fetch patient data from 'users' collection
          const patientDocRef = doc(db, 'users', userId);
          const patientDoc = await getDoc(patientDocRef);

          if (patientDoc.exists()) {
            const data = patientDoc.data();
            const decryptedData = {};
            for (const key in data) {
              if (
                key !== 'treatmentStatus' &&
                key !== 'createdAt' &&
                key !== 'username' &&
                key !== 'password' &&
                key !== 'role' &&
                key !== 'doctorId'
              ) {
                decryptedData[key] = decryptData(data[key]);
              } else {
                decryptedData[key] = data[key];
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

          if (doctorId) {
            // Fetch doctor's data from 'users' collection
            const doctorDocRef = doc(db, 'users', doctorId);
            const doctorDoc = await getDoc(doctorDocRef);

            if (doctorDoc.exists()) {
              const data = doctorDoc.data();
              const decryptedData = {};
              for (const key in data) {
                if (
                  key !== 'createdAt' &&
                  key !== 'username' &&
                  key !== 'password' &&
                  key !== 'role'
                ) {
                  decryptedData[key] = decryptData(data[key]);
                } else {
                  decryptedData[key] = data[key];
                }
              }
              setDoctorData({
                doctorName: decryptedData.doctorName || '',
                clinicName: decryptedData.clinicName || '',
                clinicLocation: decryptedData.clinicLocation || '',
              });
            } else {
              showToast('Doctor data not found', 'error');
            }
          } else {
            showToast('Doctor ID not found', 'error');
          }

          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          showToast('Error fetching your data. Please contact support.', 'error');
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/patient-login'); // Redirect to login if not authenticated
      }
    };

    fetchPatientAndDoctorData();
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
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-md mb-6 w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-2">
              Welcome, {patientData.name}!
            </h2>
            <p className="text-lg">Managing your health has never been easier.</p>
            {doctorData.doctorName && (
              <p className="mt-2">
                Your assigned doctor:{' '}
                <span className="font-semibold">{doctorData.doctorName}</span>
              </p>
            )}
            {doctorData.clinicName && (
              <p className="mt-1">
                Clinic Name:{' '}
                <span className="font-semibold">{doctorData.clinicName}</span>
              </p>
            )}
            {doctorData.clinicLocation && (
              <p className="mt-1">
                Clinic Location:{' '}
                <span className="font-semibold">{doctorData.clinicLocation}</span>
              </p>
            )}
          </motion.div>

          {/* Patient Information Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <InfoCard
              label="Name"
              value={patientData.name}
              icon={<FaUserMd color="#FFFFFF" />}
              gradient="from-purple-500 to-pink-500"
            />
            <InfoCard
              label="Age"
              value={patientData.age}
              icon={<FaStethoscope color="#FFFFFF" />}
              gradient="from-blue-500 to-green-500"
            />
            <InfoCard
              label="Gender"
              value={patientData.gender}
              icon={<FaHeartbeat color="#FFFFFF" />}
              gradient="from-red-500 to-yellow-500"
            />
            <InfoCard
              label="Address"
              value={patientData.address}
              icon={<FaMapMarkerAlt color="#FFFFFF" />}
              gradient="from-teal-500 to-cyan-500"
            />
            <InfoCard
              label="Mobile Number"
              value={patientData.mobileNumber}
              icon={<FaPhoneAlt color="#FFFFFF" />}
              gradient="from-indigo-500 to-purple-500"
            />
            <InfoCard
              label="Email"
              value={patientData.email}
              icon={<FaEnvelope color="#FFFFFF" />}
              gradient="from-orange-500 to-pink-500"
            />
            <InfoCard
              label="Disease/Condition"
              value={patientData.disease}
              icon={<FaFileMedical color="#FFFFFF" />}
              gradient="from-green-500 to-lime-500"
            />
            <InfoCard
              label="Notes"
              value={patientData.notes}
              icon={<FaStickyNote color="#FFFFFF" />}
              gradient="from-pink-500 to-red-500"
            />
          </motion.div>

          {/* Additional Sections */}
          {/* Upcoming Appointments */}
          <motion.div
            className="bg-white shadow-md rounded-lg p-6 mb-6 w-full"
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
            className="bg-white shadow-md rounded-lg p-6 mb-6 w-full"
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

const InfoCard = ({ label, value, icon, gradient }) => (
  <motion.div
    className={`flex items-center p-4 rounded-lg shadow hover:shadow-lg transition-shadow bg-gradient-to-r ${gradient} text-white`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-3xl mr-4">{icon}</div>
    <div>
      <p className="font-semibold">{label}</p>
      <p className="">{value}</p>
    </div>
  </motion.div>
);

export default PatientDashboardContent;

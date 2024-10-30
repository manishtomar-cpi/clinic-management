// src/app/components/TotalPatient.js

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../db';
import {
  collection,
  onSnapshot,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption';
import { motion } from 'framer-motion';
import { BsSearch } from 'react-icons/bs';
import { FaClinicMedical } from 'react-icons/fa';
import { showToast } from './Toast';
import PatientCard from './PatientCard'; // Import the PatientCard component

// Helper function to format dates from 'dd-mm-yyyy' to 'dd-mm-yyyy' (for display)
const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return 'N/A';
  const [day, month, year] = dateStr.split('-').map(Number);
  return `${day}-${month}-${year}`;
};

// Helper function to parse date strings to Date objects
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const TotalPatient = () => {
  const { data: session } = useSession();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all patients and their visits
  useEffect(() => {
    if (!session || !session.user || !session.user.id) {
      console.log('No valid session found.');
      return;
    }

    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');

    const unsubscribePatients = onSnapshot(patientsRef, (patientsSnapshot) => {
      const patientsData = [];

      const patientIds = patientsSnapshot.docs.map(docSnap => docSnap.id);

      patientIds.forEach(patientId => {
        const patientDoc = patientsSnapshot.docs.find(doc => doc.id === patientId);
        if (patientDoc) {
          const data = patientDoc.data();
          const decryptedName = data.name ? decryptData(data.name) : 'Unknown';
          const decryptedAddress = data.address ? decryptData(data.address) : 'N/A';
          const decryptedMobileNumber = data.mobileNumber ? decryptData(data.mobileNumber) : 'N/A';
          const decryptedEmail = data.email ? decryptData(data.email) : 'N/A';
          const treatmentStatus = data.treatmentStatus || 'N/A';

          // Fetch visits for the patient
          const visitsRef = collection(db, 'doctors', doctorId, 'patients', patientId, 'visits');
          const visitsQuery = query(visitsRef, orderBy('createdAt', 'desc'));

          onSnapshot(visitsQuery, (visitsSnapshot) => {
            const visits = visitsSnapshot.docs.map(visitDoc => {
              const visitData = visitDoc.data();
              return {
                id: visitDoc.id,
                visitDate: visitData.visitDate || null,
                visitTime: visitData.visitTime || null,
                visitStatus: visitData.visitStatus || 'N/A',
                createdAt: visitData.createdAt ? visitData.createdAt.toDate() : new Date(),
              };
            });

            // Determine Last Visit
            const sortedVisits = visits.sort((a, b) => b.createdAt - a.createdAt);
            const lastVisit = sortedVisits[0] || null;

            // Determine Next Visit
            const upcomingVisits = visits.filter(visit => {
              const visitDateTime = visit.visitDate && visit.visitTime ? new Date(`${visit.visitDate} ${visit.visitTime}`) : null;
              return visitDateTime && visitDateTime > new Date();
            }).sort((a, b) => a.createdAt - b.createdAt);

            const nextVisit = upcomingVisits[0] || null;

            patientsData.push({
              id: patientId,
              name: decryptedName,
              address: decryptedAddress,
              mobileNumber: decryptedMobileNumber,
              email: decryptedEmail,
              treatmentStatus,
              lastVisit: lastVisit ? {
                date: lastVisit.visitDate,
                time: lastVisit.visitTime,
                status: lastVisit.visitStatus,
              } : null,
              nextVisit: nextVisit ? {
                date: nextVisit.visitDate,
                time: nextVisit.visitTime,
                status: nextVisit.visitStatus,
              } : null,
            });

            setPatients([...patientsData]);
          });
        }
      });
    }, (error) => {
      console.error('Error fetching patients:', error);
      showToast('Error fetching patients. Please try again later.', 'error');
    });

    return () => {
      unsubscribePatients();
    };
  }, [session]);

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const term = searchTerm.toLowerCase();
      return (
        patient.name.toLowerCase().includes(term) ||
        patient.mobileNumber.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term)
      );
    });
  }, [patients, searchTerm]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <FaClinicMedical className="text-3xl text-purple-500 mr-2" />
        <h2 className="text-2xl font-bold text-purple-700">Total Patients</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search patients by name, mobile, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Search Patients"
        />
        <BsSearch className="absolute left-4 top-3 text-gray-400" />
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.length > 0 ? (
          filteredPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        ) : (
          <p className="text-gray-600 col-span-full">No patients found.</p>
        )}
      </div>
    </div>
  );
};

export default TotalPatient;

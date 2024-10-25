'use client';

import { useState, useEffect } from 'react';
import { db } from '../../db';
import { collection, query, where, onSnapshot, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption';
import { FiUserCheck, FiCheckCircle, FiXCircle, FiUser, FiCalendar } from 'react-icons/fi';
import { BsSearch } from 'react-icons/bs';
import { showToast } from './Toast';
import { motion } from 'framer-motion';

const OngoingPatients = () => {
  const { data: session } = useSession();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!session || !session.user || !session.user.id) return;

    const doctorId = session.user.id;
    const patientsRef = collection(db, 'doctors', doctorId, 'patients');
    const q = query(patientsRef, where('treatmentStatus', '==', 'Ongoing'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const patientsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const patientId = doc.id;
          const nextVisit = await fetchNextVisit(doctorId, patientId);
          return {
            id: patientId,
            name: decryptData(data.name),
            age: decryptData(data.age),
            gender: decryptData(data.gender),
            disease: decryptData(data.disease),
            mobileNumber: decryptData(data.mobileNumber),
            notes: decryptData(data.notes),
            nextVisit,
          };
        })
      );
      setPatients(patientsData);
    });

    return () => unsubscribe();
  }, [session]);

  const fetchNextVisit = async (doctorId, patientId) => {
    const visitsRef = collection(db, 'doctors', doctorId, 'patients', patientId, 'visits');
    const visitsSnapshot = await getDocs(visitsRef);
    let nextVisit = null;

    visitsSnapshot.forEach((doc) => {
      const visitData = doc.data();
      const nextVisitDateStr = decryptData(visitData.nextVisitDate);
      const nextVisitTimeStr = decryptData(visitData.nextVisitTime);

      if (nextVisitDateStr && nextVisitTimeStr) {
        // Parse the date and time strings
        const [day, month, year] = nextVisitDateStr.split('-').map(Number);
        const [hours, minutes] = nextVisitTimeStr.split(':').map(Number);

        // Construct a JavaScript Date object for the next visit
        const nextVisitDateTime = new Date(year, month - 1, day, hours, minutes);
        const now = new Date();

        // Determine the status based on the comparison with the current date and time
        const status = nextVisitDateTime.getTime() < now.getTime() ? 'Missed' : 'Scheduled';

        // Update if it's the earliest upcoming visit or the first found
        if (!nextVisit || nextVisitDateTime < nextVisit.dateTime) {
          nextVisit = {
            dateTime: nextVisitDateTime,
            time: nextVisitTimeStr,
            status,
            formattedDate: nextVisitDateStr,
          };
        }
      }
    });

    return nextVisit;
  };

  if (!session) return null;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTreatmentUpdate = async (patientId, status) => {
    try {
      const doctorId = session.user.id;
      const patientRef = doc(db, 'doctors', doctorId, 'patients', patientId);
      await updateDoc(patientRef, {
        treatmentStatus: status,
      });
      showToast(`Treatment marked as ${status.toLowerCase()}!`, 'success');
    } catch (error) {
      console.error('Error updating treatment status:', error);
      showToast('Error updating treatment status. Please try again.', 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <FiUserCheck className="text-3xl text-blue-500 mr-2" />
        <h2 className="text-2xl font-bold">Ongoing Patients</h2>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <BsSearch className="absolute left-4 top-3 text-gray-400" />
      </div>

      {filteredPatients.length === 0 ? (
        <p>No ongoing patients found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <motion.div
              key={patient.id}
              className="bg-gradient-to-r from-blue-50 to-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-center">
                <FiUser className="text-6xl text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{patient.name}</h3>
                <p className="text-gray-700">
                  <strong>Age:</strong> {patient.age} | <strong>Gender:</strong> {patient.gender}
                </p>
                <p className="text-gray-700">
                  <strong>Disease:</strong> {patient.disease}
                </p>
                <p className="text-gray-700">
                  <strong>Mobile:</strong> {patient.mobileNumber}
                </p>
                {patient.notes && (
                  <p className="text-gray-700">
                    <strong>Notes:</strong> {patient.notes}
                  </p>
                )}
                {patient.nextVisit && (
                  <p
                    className={`text-gray-700 mt-2 ${patient.nextVisit.status === 'Missed' ? 'text-red-500 font-bold' : 'text-green-500'}`}
                  >
                    <FiCalendar className="inline-block mr-1" />
                    <strong>Next Visit:</strong> {patient.nextVisit.formattedDate} at {patient.nextVisit.time} -{' '}
                    {patient.nextVisit.status === 'Missed' ? (
                      <span>Missed</span>
                    ) : (
                      <span>Scheduled</span>
                    )}
                  </p>
                )}
                <div className="flex justify-center space-x-2 mt-4">
                  <button
                    onClick={() => handleTreatmentUpdate(patient.id, 'Completed')}
                    className="flex items-center bg-green-500 text-white py-2 px-4 rounded-full hover:bg-green-600"
                  >
                    <FiCheckCircle className="mr-1" /> Complete
                  </button>
                  <button
                    onClick={() => handleTreatmentUpdate(patient.id, 'Stopped')}
                    className="flex items-center bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600"
                  >
                    <FiXCircle className="mr-1" /> Stop
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OngoingPatients;

'use client';

import { useState, useEffect } from 'react';
import { db } from '../../db';
import { collection, query, where, onSnapshot, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption';
import { FiUserCheck, FiCheckCircle, FiXCircle, FiUser, FiCalendar, FiLoader } from 'react-icons/fi';
import { BsSearch } from 'react-icons/bs';
import { showToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

const OngoingPatients = () => {
  const { data: session } = useSession();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // States for Confirmation Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Handler for initiating treatment status update
  const initiateTreatmentUpdate = (patient, action) => {
    setSelectedPatient(patient);
    setSelectedAction(action);
    setShowModal(true);
  };

  // Handler for confirming treatment status update
  const confirmTreatmentUpdate = async () => {
    if (!selectedPatient || !selectedAction) return;

    setIsLoading(true);
    try {
      const doctorId = session.user.id;
      const patientRef = doc(db, 'doctors', doctorId, 'patients', selectedPatient.id);
      await updateDoc(patientRef, {
        treatmentStatus: selectedAction,
      });
      showToast(`Treatment marked as ${selectedAction.toLowerCase()}!`, 'success');
      setShowModal(false);
      setSelectedPatient(null);
      setSelectedAction('');
    } catch (error) {
      console.error('Error updating treatment status:', error);
      showToast('Error updating treatment status. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for cancelling treatment status update
  const cancelTreatmentUpdate = () => {
    setShowModal(false);
    setSelectedPatient(null);
    setSelectedAction('');
  };

  return (
    <div className="p-6">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-11/12 md:w-1/3 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4">Confirm Action</h3>
              <p className="mb-6">
                Are you sure you want to mark <span className="font-bold">{selectedPatient?.name}</span> as{' '}
                <span className="font-bold text-blue-500">{selectedAction}</span>?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelTreatmentUpdate}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTreatmentUpdate}
                  className={`px-4 py-2 bg-${
                    selectedAction === 'Completed' ? 'green-500' : 'red-500'
                  } text-white rounded-xl hover:bg-${
                    selectedAction === 'Completed' ? 'green-600' : 'red-600'
                  } transition-colors flex items-center`}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <FiLoader
                      className={`animate-spin mr-2 ${
                        selectedAction === 'Completed' ? 'text-green-300' : 'text-red-300'
                      }`}
                    />
                  )}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center mb-6">
        <FiUserCheck className="text-3xl text-blue-500 mr-2" />
        <h2 className="text-2xl font-bold">Ongoing Patients</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <BsSearch className="absolute left-4 top-3 text-gray-400" />
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <p>No ongoing patients found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <motion.div
              key={patient.id}
              className="bg-gradient-to-r from-blue-50 to-blue-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
              whileHover={{ scale: 1.02 }}
            >
              {/* Loading Overlay */}
              {isLoading && selectedPatient?.id === patient.id && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <FiLoader className="animate-spin text-3xl text-blue-500" />
                </div>
              )}

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
                    className={`text-gray-700 mt-2 ${
                      patient.nextVisit.status === 'Missed' ? 'text-red-500 font-bold' : 'text-green-500'
                    }`}
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
                <div className="flex justify-center space-x-4 mt-6">
                  {/* Complete Button */}
                  <button
                    onClick={() => initiateTreatmentUpdate(patient, 'Completed')}
                    className="flex items-center bg-green-500 text-white py-2 px-4 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <FiCheckCircle className="mr-2" /> Complete
                  </button>
                  {/* Stop Button */}
                  <button
                    onClick={() => initiateTreatmentUpdate(patient, 'Stopped')}
                    className="flex items-center bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <FiXCircle className="mr-2" /> Stop
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

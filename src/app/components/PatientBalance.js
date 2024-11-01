'use client';

import { useState, useEffect } from 'react';
import { db } from '../../db';
import { collection, getDocs } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption';
import { FaRupeeSign } from 'react-icons/fa'; // Rupee Icon
import { BsSearch } from 'react-icons/bs';
import { motion } from 'framer-motion';

const PatientBalance = () => {
  const { data: session } = useSession();
  const [balances, setBalances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!session || !session.user || !session.user.id) return;

    const fetchBalances = async () => {
      try {
        const doctorId = session.user.id;
        const patientsRef = collection(db, 'doctors', doctorId, 'patients');
        const patientsSnapshot = await getDocs(patientsRef);

        const balancesData = [];

        for (const patientDoc of patientsSnapshot.docs) {
          const patientId = patientDoc.id;
          const patientData = patientDoc.data();
          const patientName = decryptData(patientData.name);

          let totalAmount = 0;
          let amountPaid = 0;
          const outstandingVisits = []; // To store visits with remaining balance

          const visitsRef = collection(db, 'doctors', doctorId, 'patients', patientId, 'visits');
          const visitsSnapshot = await getDocs(visitsRef);

          visitsSnapshot.forEach((visitDoc) => {
            const visitData = visitDoc.data();

            const visitTotal = parseFloat(visitData.totalAmount || '0');
            const visitPaid = parseFloat(visitData.amountPaid || '0');
            const balance = visitTotal - visitPaid;

            totalAmount += visitTotal;
            amountPaid += visitPaid;

            if (balance > 0) {
              // Decrypt visit fields as necessary
              outstandingVisits.push({
                visitId: visitDoc.id,
                visitDate: decryptData(visitData.visitDate),
                visitTime: decryptData(visitData.visitTime),
                visitReason: decryptData(visitData.visitReason),
                symptoms: decryptData(visitData.symptoms),
                treatmentStatus: decryptData(visitData.treatmentStatus),
                nextVisitDate: decryptData(visitData.nextVisitDate),
                nextVisitTime: decryptData(visitData.nextVisitTime),
                totalAmount: visitData.totalAmount,
                amountPaid: visitData.amountPaid,
                notes: decryptData(visitData.notes),
                balance: balance.toFixed(2),
              });
            }
          });

          const balanceRemaining = totalAmount - amountPaid;

          if (balanceRemaining > 0) {
            balancesData.push({
              patientId,
              patientName,
              balance: balanceRemaining.toFixed(2),
              outstandingVisits, // Include outstanding visits
            });
          }
        }

        setBalances(balancesData);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchBalances();
  }, [session]);

  if (!session) return null;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredBalances = balances.filter((balance) =>
    balance.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <FaRupeeSign className="text-3xl text-yellow-500 mr-2" /> {/* Rupee Icon */}
        <h2 className="text-2xl font-bold">Patients with Outstanding Balance</h2>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <BsSearch className="absolute left-4 top-3 text-gray-400" />
      </div>

      {filteredBalances.length === 0 ? (
        <p>No patients with outstanding balance.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBalances.map((balance) => (
            <motion.div
              key={balance.patientId}
              className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-semibold mb-2">{balance.patientName}</h3>
              <p className="flex items-center">
                <FaRupeeSign className="text-lg text-yellow-500 mr-1" /> {/* Rupee Icon */}
                <strong>Outstanding Balance:</strong> ₹{balance.balance}
              </p>
              <div className="mt-4">
                <h4 className="text-lg font-medium mb-2">Outstanding Visits:</h4>
                {balance.outstandingVisits.map((visit) => (
                  <div key={visit.visitId} className="mb-2 p-3 bg-white rounded shadow-sm">
                    {/* <p>
                      <strong>Visit ID:</strong> {visit.visitId}
                    </p> */}
                    <p>
                      <strong>Date:</strong> {visit.visitDate} at {visit.visitTime}
                    </p>
                    <p>
                      <strong>Reason:</strong> {visit.visitReason}
                    </p>
                    <p>
                      <strong>Symptoms:</strong> {visit.symptoms}
                    </p>
                    <p>
                      <strong>Treatment Status:</strong> {visit.treatmentStatus}
                    </p>
                    {visit.nextVisitDate && visit.nextVisitTime && (
                      <p>
                        <strong>Next Visit:</strong> {visit.nextVisitDate} at {visit.nextVisitTime}
                      </p>
                    )}
                    <p>
                      <strong>Remaining Balance:</strong> ₹{visit.balance}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientBalance;

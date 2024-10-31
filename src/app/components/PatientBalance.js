
'use client';

import { useState, useEffect } from 'react';
import { db } from '../../db';
import { collection, getDocs } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { decryptData } from '../../lib/encryption';
import { FiDollarSign } from 'react-icons/fi';
import { BsSearch } from 'react-icons/bs';
import { motion } from 'framer-motion';

const PatientBalance = () => {
  const { data: session } = useSession();
  const [balances, setBalances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!session || !session.user || !session.user.id) return;

    const fetchBalances = async () => {
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

        const visitsRef = collection(db, 'doctors', doctorId, 'patients', patientId, 'visits');
        const visitsSnapshot = await getDocs(visitsRef);

        visitsSnapshot.forEach((visitDoc) => {
          const visitData = visitDoc.data();
          totalAmount += parseFloat(visitData.totalAmount || '0');
          amountPaid += parseFloat(visitData.amountPaid || '0');
        });

        const balance = totalAmount - amountPaid;

        if (balance > 0) {
          balancesData.push({
            patientId,
            patientName,
            balance: balance.toFixed(2),
          });
        }
      }

      setBalances(balancesData);
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
        <FiDollarSign className="text-3xl text-yellow-500 mr-2" />
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
              <p>
                <strong>Outstanding Balance:</strong> ₹{balance.balance}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientBalance;

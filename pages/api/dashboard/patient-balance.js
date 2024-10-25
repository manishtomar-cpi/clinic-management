// src/pages/api/dashboard/patient-balance.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

import { db } from '../../../src/dbAdmin';

import { decryptData } from '../../../src/lib/encryption';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const doctorId = session.user.id;

  try {
    const patientsWithBalance = [];

    const patientsRef = db.collection('doctors').doc(doctorId).collection('patients');
    const patientsSnapshot = await patientsRef.get();

    for (const patientDoc of patientsSnapshot.docs) {
      const patientId = patientDoc.id;
      const patientData = patientDoc.data();
      const patientName = decryptData(patientData.name || '');

      let totalBalance = 0;

      const visitsRef = patientsRef.doc(patientId).collection('visits');
      const visitsSnapshot = await visitsRef.get();

      for (const visitDoc of visitsSnapshot.docs) {
        const visitData = visitDoc.data();
        const totalAmount = parseFloat(decryptData(visitData.totalAmount) || '0');
        const amountPaid = parseFloat(decryptData(visitData.amountPaid) || '0');

        const balance = totalAmount - amountPaid;
        if (balance > 0) {
          totalBalance += balance;
        }
      }

      if (totalBalance > 0) {
        patientsWithBalance.push({
          id: patientId,
          name: patientName,
          balance: totalBalance,
        });
      }
    }

    res.status(200).json({ patientsWithBalance });
  } catch (error) {
    console.error('Error fetching patients with balance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

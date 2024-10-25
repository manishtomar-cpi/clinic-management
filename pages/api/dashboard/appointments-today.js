// src/pages/api/dashboard/appointments-today.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';


import { db } from '../../../src/dbAdmin';

import { encryptData, decryptData } from '../../../src/lib/encryption';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const doctorId = session.user.id;

  if (req.method === 'GET') {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const appointments = [];

      const patientsRef = db.collection('doctors').doc(doctorId).collection('patients');
      const patientsSnapshot = await patientsRef.get();

      for (const patientDoc of patientsSnapshot.docs) {
        const patientId = patientDoc.id;
        const patientData = patientDoc.data();
        const patientName = decryptData(patientData.name || '');

        const visitsRef = patientsRef.doc(patientId).collection('visits');
        const visitsSnapshot = await visitsRef.get();

        for (const visitDoc of visitsSnapshot.docs) {
          const visitData = visitDoc.data();
          const nextVisitDateStr = decryptData(visitData.nextVisitDate || '');
          const status = decryptData(visitData.status || 'Scheduled');

          if (nextVisitDateStr) {
            const nextVisitDate = new Date(nextVisitDateStr);

            if (nextVisitDate >= todayStart && nextVisitDate <= todayEnd) {
              appointments.push({
                id: visitDoc.id,
                patientId,
                patientName,
                time: nextVisitDate.toISOString(),
                status,
              });
            } else if (nextVisitDate < todayStart && status === 'Scheduled') {
              // Automatically mark as missed
              await visitsRef.doc(visitDoc.id).update({
                status: encryptData('Missed'),
              });
            }
          }
        }
      }

      res.status(200).json({ appointments });
    } catch (error) {
      console.error('Error fetching appointments today:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'PUT') {
    const { patientId, visitId, status } = req.body;

    if (!patientId || !visitId || !status) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      const visitRef = db
        .collection('doctors')
        .doc(doctorId)
        .collection('patients')
        .doc(patientId)
        .collection('visits')
        .doc(visitId);

      await visitRef.update({
        status: encryptData(status),
      });

      res.status(200).json({ message: 'Appointment status updated' });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}

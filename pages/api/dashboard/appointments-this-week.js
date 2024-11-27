
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
    const startOfWeek = getStartOfWeek(new Date());
    const endOfWeek = getEndOfWeek(new Date());

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

        if (nextVisitDateStr) {
          const nextVisitDate = new Date(nextVisitDateStr);

          if (nextVisitDate >= startOfWeek && nextVisitDate <= endOfWeek) {
            appointments.push({
              id: visitDoc.id,
              patientId,
              patientName,
              time: nextVisitDate.toISOString(),
            });
          }
        }
      }
    }

    res.status(200).json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments this week:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

function getStartOfWeek(date) {
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  const startOfWeek = new Date(date);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

function getEndOfWeek(date) {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

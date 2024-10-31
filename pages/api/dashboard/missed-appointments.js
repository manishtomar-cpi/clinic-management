
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
    const missedAppointments = [];

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

        if (nextVisitDateStr && status === 'Missed') {
          const nextVisitDate = new Date(nextVisitDateStr);
          missedAppointments.push({
            id: visitDoc.id,
            patientId,
            patientName,
            date: nextVisitDate.toISOString(),
          });
        }
      }
    }

    res.status(200).json({ missedAppointments });
  } catch (error) {
    console.error('Error fetching missed appointments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

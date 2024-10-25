// src/pages/api/dashboard/ongoing-patients.js

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

  console.log('Session:', session);
  console.log('Session User:', session.user);

  const doctorId = session.user.id || session.user.email; // Use email if id is not available

  console.log('Doctor ID:', doctorId);

  if (!doctorId) {
    res.status(400).json({ error: 'Doctor ID is missing' });
    return;
  }

  try {
    const patientsRef = db.collection('doctors').doc(doctorId).collection('patients');
    const querySnapshot = await patientsRef
      .where('treatmentStatus', '==', encryptData('Ongoing'))
      .get();

    const patients = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: decryptData(data.name || ''),
        treatmentStatus: decryptData(data.treatmentStatus || ''),
        // Add other necessary fields
      };
    });

    res.status(200).json({ patients });
  } catch (error) {
    console.error('Error fetching ongoing patients:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

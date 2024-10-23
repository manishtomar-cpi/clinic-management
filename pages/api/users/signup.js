import { db } from '../../../src/db';
import { collection, addDoc } from 'firebase/firestore';
import { encryptData } from '../../../src/lib/encryption';
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, doctorName, clinicName, password } = req.body;

    try {
      // Encrypt sensitive fields before storing them
      const encryptedDoctorName = encryptData(doctorName);
      const encryptedClinicName = encryptData(clinicName);
      const encryptedPassword = encryptData(password);

      // Save the encrypted data to Firestore
      const docRef = await addDoc(collection(db, 'users'), {
        username, // Store username as plain text for searchability
        doctorName: encryptedDoctorName,
        clinicName: encryptedClinicName,
        password: encryptedPassword,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ message: 'User created successfully', id: docRef.id });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

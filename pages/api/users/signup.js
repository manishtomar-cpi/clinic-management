// pages/api/users/signup.js

import { db } from '../../../src/db'; // Ensure this points to your Firebase config
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { encryptData } from '../../../src/lib/encryption';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, doctorName, clinicName, email, password, clinicLocation } = req.body;

    try {
      // Input validation
      if (
        !username ||
        !doctorName ||
        !clinicName ||
        !email ||
        !password ||
        !clinicLocation ||
        typeof username !== 'string' ||
        typeof doctorName !== 'string' ||
        typeof clinicName !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof clinicLocation !== 'string'
      ) {
        return res.status(400).json({ message: 'Invalid input data' });
      }

      // Validate username format
      const usernamePattern = /^[a-zA-Z0-9._]{6,}$/;
      if (!usernamePattern.test(username)) {
        return res.status(400).json({
          message:
            'Username must be at least 6 characters and can include letters, digits, underscores, and periods.',
        });
      }

      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.status(400).json({
          message: 'Please enter a valid email address.',
        });
      }

      // Check if username already exists
      const usersRef = collection(db, 'users');
      const qUsername = query(usersRef, where('username', '==', username));

      const querySnapshotUsername = await getDocs(qUsername);

      if (!querySnapshotUsername.empty) {
        // Username already exists
        return res.status(409).json({ message: 'Username is already taken' });
      }

      // Removed email uniqueness check to allow multiple users with the same email
      // const qEmail = query(usersRef, where('email', '==', email));
      // const querySnapshotEmail = await getDocs(qEmail);
      //
      // if (!querySnapshotEmail.empty) {
      //   // Email already exists
      //   return res.status(409).json({ message: 'Email is already registered' });
      // }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      // Encrypt sensitive fields before storing them
      const encryptedDoctorName = encryptData(doctorName);
      const encryptedClinicName = encryptData(clinicName);
      const encryptedClinicLocation = encryptData(clinicLocation);

      // Save the encrypted data to Firestore
      const docRef = await addDoc(usersRef, {
        username, // Store username as plain text for searchability
        doctorName: encryptedDoctorName,
        clinicName: encryptedClinicName,
        clinicLocation: encryptedClinicLocation,
        email, // Store email as plain text for communication
        password: hashedPassword, // Store hashed password
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ message: 'User created successfully', id: docRef.id });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: 'Method not allowed' });
  }
}

// pages/api/users/update-profile.js

import { db } from '../../../src/db';
import { getServerSession } from 'next-auth/next';
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { encryptData } from '../../../src/lib/encryption';
import bcrypt from 'bcryptjs';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Retrieve session to identify the authenticated user
    const session = await getServerSession(req, res, authOptions);

    console.log('Session in API Route:', session);

    if (!session) {
      // If not authenticated, return 401 Unauthorized
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = session.user.id;

    // Check if userId is undefined
    if (!userId) {
      console.error('User ID is undefined in session');
      return res.status(500).json({ message: 'User ID not found in session' });
    }

    const {
      username,
      doctorName,
      clinicName,
      email,
      password,
      clinicLocation,
    } = req.body;

    try {
      // Validate that at least one field is provided
      if (
        !username &&
        !doctorName &&
        !clinicName &&
        !email &&
        !password &&
        !clinicLocation
      ) {
        return res.status(400).json({ message: 'No data provided to update' });
      }

      // Prepare an object to hold the updates
      const updates = {};

      // If username is being updated
      if (username) {
        // Validate username format
        const usernamePattern = /^[a-zA-Z0-9._]{6,}$/;
        if (!usernamePattern.test(username)) {
          return res.status(400).json({
            message:
              'Username must be at least 6 characters and can include letters, digits, underscores, and periods.',
          });
        }

        // Check if the username already exists (excluding current user)
        const usersRef = collection(db, 'users');
        const qUsername = query(usersRef, where('username', '==', username));
        const querySnapshotUsername = await getDocs(qUsername);

        let usernameTaken = false;
        querySnapshotUsername.forEach((doc) => {
          if (doc.id !== userId) {
            usernameTaken = true;
          }
        });

        if (usernameTaken) {
          return res.status(409).json({ message: 'Username is already taken' });
        }

        updates.username = username;
      }

      // If email is being updated
      if (email) {
        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          return res.status(400).json({
            message: 'Please enter a valid email address.',
          });
        }

        // Assuming email verification is handled on the frontend
        updates.email = email;
      }

      // If password is being updated
      if (password) {
        // Validate password format
        const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordPattern.test(password)) {
          return res.status(400).json({
            message:
              'Password must be at least 8 characters, include one uppercase letter, and one special character.',
          });
        }

        // Hash the new password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.password = hashedPassword;
      }

      // Update other fields if provided
      if (doctorName) {
        updates.doctorName = encryptData(doctorName);
      }

      if (clinicName) {
        updates.clinicName = encryptData(clinicName);
      }

      if (clinicLocation) {
        updates.clinicLocation = encryptData(clinicLocation);
      }

      // Ensure there is at least one field to update
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      // Update the user's document in Firestore
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, updates);

      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile' });
    }
  } else {
    // If the request method is not POST
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: 'Method not allowed' });
  }
}

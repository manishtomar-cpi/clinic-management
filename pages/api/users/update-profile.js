// src/pages/api/users/update-profile.js

import { db } from '../../../src/db';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, username, password } = req.body;
    console.log("Request Body:", req.body);


    // Validate input
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!username || typeof username !== 'string' || username.length < 6) {
      return res.status(400).json({ message: 'Invalid username.' });
    }

    try {
      // Check if the new username is already taken
      const usersRef = collection(db, 'users');
      const usernameQuery = query(usersRef, where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        const existingUser = usernameSnapshot.docs[0];
        if (existingUser.id !== userId) {
          return res.status(409).json({ message: 'Username is already taken.' });
        }
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const updateData = { username };

      // Hash the new password if provided
      if (password && password.length >= 8) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      // Update the user document in Firestore
      await updateDoc(userRef, updateData);

      res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Error updating profile.' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: 'Method not allowed' });
  }
}

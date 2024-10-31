// pages/api/users/verify-username.js

import { db } from '../../../src/db';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { username } = req.query;

    try {
      // Input validation: Ensure username is provided and is a string
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: 'Invalid username parameter' });
      }

      // Query Firestore to check if a user with the given username exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Username does not exist
        return res.status(404).json({ message: 'Username not found' });
      }

      // Assuming usernames are unique, fetch the first matching document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Check if the email field exists
      if (!userData.email) {
        return res.status(500).json({ message: 'User email not found' });
      }

      // Return the associated email
      return res.status(200).json({ email: userData.email });
    } catch (error) {
      console.error('Error verifying username:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    // Method Not Allowed
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

// pages/api/users/check-username.js

import { db } from '../../../src/db';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { username } = req.query;

    try {
      // Input validation: Ensure username is provided
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: 'Invalid username parameter' });
      }

      // Query Firestore to check if a user with the same username already exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Username is available
        res.status(200).json({ available: true });
      } else {
        // Username is already taken
        res.status(200).json({ available: false });
      }
    } catch (error) {
      console.error('Error checking username:', error);
      res.status(500).json({ message: 'Error checking username' });
    }
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ message: 'Method not allowed' });
  }
}

import { db } from '../../../src/db';

import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { username } = req.query;

    try {
      // Query Firestore to check if a user with the same username already exists
      const q = query(collection(db, 'users'), where('username', '==', username));
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
      res.status(500).json({ message: 'Error checking username', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

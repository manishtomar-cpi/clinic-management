// src/pages/api/login.js
import { db } from '../../src/db';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { decryptData } from '../../app/lib/encryption';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    try {
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const userData = querySnapshot.docs[0].data();
      const decryptedPassword = decryptData(userData.password);

      if (password === decryptedPassword) {
        res.status(200).json({ message: 'Login successful', user: userData });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

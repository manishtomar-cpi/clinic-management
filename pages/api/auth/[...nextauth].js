// src/pages/api/auth/[...nextauth].js

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '../../../src/db'; 
import {
  collection,
  query,
  where,
  getDocs,
  doc,
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { decryptData } from '../../../src/lib/encryption'; 

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { username, password } = credentials;

        try {
          // Query Firestore for the user by username
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', username));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error('Invalid credentials');
          }

          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();

          // Retrieve the stored hashed password
          const hashedPassword = userData.password;

          // Use bcrypt to compare the provided password with the stored hashed password
          const isPasswordValid = await bcrypt.compare(password, hashedPassword);

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          // Initialize variables to store decrypted data
          let decryptedName = '';
          let decryptedEmail = '';
          let decryptedDoctorName = '';
          let decryptedClinicName = '';
          let decryptedClinicLocation = '';
          let doctorId = '';

          // Decrypt user's own data
          decryptedName = decryptData(userData.name || '');
          decryptedEmail = decryptData(userData.email || '');

          if (userData.role === 'doctor') {
            // If user is a doctor, decrypt their clinic details
            decryptedDoctorName = decryptData(userData.doctorName || '');
            decryptedClinicName = decryptData(userData.clinicName || '');
            decryptedClinicLocation = decryptData(userData.clinicLocation || '');
          } else if (userData.role === 'patient') {
            // If user is a patient, fetch and decrypt their doctor's name
            doctorId = userData.doctorId || '';
            if (doctorId) {
              const doctorDocRef = doc(db, 'users', doctorId);
              const doctorDocSnapshot = await getDocs(
                query(collection(db, 'users'), where('__name__', '==', doctorId))
              );

              if (!doctorDocSnapshot.empty) {
                const doctorDoc = doctorDocSnapshot.docs[0];
                const doctorData = doctorDoc.data();
                decryptedDoctorName = decryptData(doctorData.doctorName || '');
              }
            }
          }

          // Return the user object with decrypted fields
          return {
            id: userDoc.id,
            name: decryptedName,
            email: decryptedEmail,
            username: userData.username,
            role: userData.role,
            doctorName: decryptedDoctorName, // For patients and doctors
            clinicName: decryptedClinicName, // Only for doctors
            clinicLocation: decryptedClinicLocation, // Only for doctors
            doctorId: doctorId, // Only for patients
          };
        } catch (error) {
          console.error('Login Error:', error);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  pages: {
    signIn: '/patient-login', // Adjust as needed
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
        token.role = user.role;
        token.doctorName = user.doctorName || '';
        token.clinicName = user.clinicName || '';
        token.clinicLocation = user.clinicLocation || '';
        token.doctorId = user.doctorId || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.doctorName = token.doctorName;
        session.user.clinicName = token.clinicName;
        session.user.clinicLocation = token.clinicLocation;
        session.user.doctorId = token.doctorId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, 
};

export default NextAuth(authOptions);

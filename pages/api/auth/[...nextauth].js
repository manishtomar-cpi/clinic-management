// pages/api/auth/[...nextauth].js

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '../../../src/db';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

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

          // Return the user object with encrypted data
          return {
            id: userDoc.id,
            username: userData.username,
            doctorName: userData.doctorName, // Encrypted
            clinicName: userData.clinicName, // Encrypted
          };
        } catch (error) {
          console.error('Login Error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // Optional: Set session max age
  },
  callbacks: {
    async jwt({ token, user }) {
      // If a user object exists, this is the initial sign-in; set token properties
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.doctorName = user.doctorName;
        token.clinicName = user.clinicName;
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure custom properties are directly assigned to session.user
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.doctorName = token.doctorName;
        session.user.clinicName = token.clinicName;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

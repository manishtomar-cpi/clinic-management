import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '../../../src/db';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { decryptData } from '../../../src/lib/encryption';

export default NextAuth({
  providers: [
    CredentialsProvider({
      // The name to display on the sign-in form (e.g., 'Sign in with credentials')
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { username, password } = credentials;

        try {
          // Query Firestore for the user by username
          const q = query(collection(db, 'users'), where('username', '==', username));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error('Invalid credentials');
          }

          const userData = querySnapshot.docs[0].data();
          const decryptedPassword = decryptData(userData.password);

          // Compare the provided password with the decrypted password from Firestore
          if (password === decryptedPassword) {
            // If successful, return the user object
            return {
              id: querySnapshot.docs[0].id,
              username: userData.username,
              doctorName: userData.doctorName,
              clinicName: userData.clinicName,
            };
          } else {
            throw new Error('Invalid credentials');
          }
        } catch (error) {
          console.error('Login Error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login', // Redirect to the login page if not authenticated
  },
  session: {
    strategy: 'jwt', // Use JSON Web Tokens for session management
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
      // Add custom properties from the token to the session object
      if (token) {
        session.user = {
          id: token.id,
          username: token.username,
          doctorName: token.doctorName,
          clinicName: token.clinicName,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Make sure to set this in your .env.local
});

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

          // If user is a patient, fetch the associated doctor's name and doctorId
          let doctorName = '';
          let doctorId = '';

          if (userData.role === 'patient') {
            doctorId = userData.doctorId;
            if (doctorId) {
              const doctorDocRef = doc(db, 'users', doctorId);
              const doctorDoc = await getDocs(query(collection(db, 'users'), where('id', '==', doctorId)));

              if (!doctorDoc.empty) {
                const doctorData = doctorDoc.docs[0].data();
                doctorName = decryptData(doctorData.doctorName);
              }
            }
          }

          // Return the user object with role, doctorName, doctorId
          return {
            id: userDoc.id,
            name: decryptData(userData.name),
            email: decryptData(userData.email),
            username: userData.username,
            role: userData.role,
            doctorName: doctorName, // For patients
            doctorId: doctorId, // For patients
          };
        } catch (error) {
          console.error('Login Error:', error);
          return null;
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
        token.doctorName = user.doctorName;
        token.doctorId = user.doctorId;
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
        session.user.doctorId = token.doctorId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, 
};

export default NextAuth(authOptions);

// src/lib/auth.js

import crypto from 'crypto';
import CredentialsProvider from 'next-auth/providers/credentials';

const hashPassword = (password) => {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { username, password } = credentials;
        const envUsername = process.env.NEXT_PUBLIC_USERNAME;
        const envHashedPassword = process.env.NEXT_PUBLIC_PASSWORD;

        console.log('Credentials provided:', username, password);
        console.log('Environment username:', envUsername);
        console.log('Environment hashed password:', envHashedPassword);

        if (username === envUsername) {
          const hashedInputPassword = hashPassword(password);
          console.log('Hashed input password:', hashedInputPassword);

          if (hashedInputPassword === envHashedPassword) {
            console.log('Authorization successful');
            return { id: 1, name: 'Doctor' };
          }
        }

        console.log('Authorization failed');
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;

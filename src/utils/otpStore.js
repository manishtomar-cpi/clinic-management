// src/utils/otpStore.js

import { db } from '../db';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

/**
 * Sets an OTP for a given email.
 * @param {string} email - The user's email.
 * @param {string} otp - The OTP to store.
 */
export const setOtp = async (email, otp) => {
  const otpRef = doc(db, 'otps', email);
  await setDoc(otpRef, {
    otp,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Verifies the OTP for a given email.
 * @param {string} email - The user's email.
 * @param {string} otp - The OTP to verify.
 * @returns {boolean} - Returns true if OTP is valid, false otherwise.
 */
export const verifyOtp = async (email, otp) => {
  const otpRef = doc(db, 'otps', email);
  const otpSnap = await getDoc(otpRef);

  if (!otpSnap.exists()) return false;

  const data = otpSnap.data();
  const isValid =
    data.otp === otp &&
    Date.now() - new Date(data.createdAt).getTime() < 10 * 60 * 1000; // 10 minutes

  if (isValid) {
    await deleteDoc(otpRef); // OTP can be used only once
    return true;
  }

  return false;
};

/**
 * Fetches the email associated with a username.
 * @param {string} username - The user's username.
 * @returns {string|null} - Returns the email if found, otherwise null.
 */
export const getEmailByUsername = async (username) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.email) {
      return userData.email;
    }

    return null;
  } catch (error) {
    console.error('Error fetching email by username:', error);
    return null;
  }
};

// pages/api/users/update-profile.js

import { db } from '../../../src/db';
import { getServerSession } from 'next-auth/next';
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { encryptData, decryptData } from '../../../src/lib/encryption';
import bcrypt from 'bcryptjs';
import { authOptions } from '../auth/[...nextauth]';
import { sendEmail } from '../../../src/lib/aws-ses';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Retrieve session to identify the authenticated user
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    // If not authenticated, return 401 Unauthorized
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;

  // Check if userId is undefined
  if (!userId) {
    console.error('User ID is undefined in session');
    return res.status(500).json({ message: 'User ID not found in session' });
  }

  const {
    username,
    doctorName,
    clinicName,
    email,
    password,
    clinicLocation,
  } = req.body;

  try {
    // Validate that at least one field is provided
    if (
      !username &&
      !doctorName &&
      !clinicName &&
      !email &&
      !password &&
      !clinicLocation
    ) {
      return res.status(400).json({ message: 'No data provided to update' });
    }

    // Fetch current user data for comparison
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDocSnap.data();

    // Decrypt encrypted fields
    const decryptedDoctorName = decryptData(userData.doctorName);
    const decryptedClinicName = decryptData(userData.clinicName);
    const decryptedClinicLocation = decryptData(userData.clinicLocation);

    // Prepare an object to hold the updates
    const updates = {};
    const changedFields = []; // To track which fields were changed

    // If username is being updated
    if (username && username !== userData.username) {
      // Validate username format
      const usernamePattern = /^[a-zA-Z0-9._]{6,}$/;
      if (!usernamePattern.test(username)) {
        return res.status(400).json({
          message:
            'Username must be at least 6 characters and can include letters, digits, underscores, and periods.',
        });
      }

      // Check if the username already exists (excluding current user)
      const usersRef = collection(db, 'users');
      const qUsername = query(usersRef, where('username', '==', username));
      const querySnapshotUsername = await getDocs(qUsername);

      let usernameTaken = false;
      querySnapshotUsername.forEach((docSnap) => {
        if (docSnap.id !== userId) {
          usernameTaken = true;
        }
      });

      if (usernameTaken) {
        return res.status(409).json({ message: 'Username is already taken' });
      }

      updates.username = username;
      changedFields.push('Username');
    }

    // If email is being updated
    if (email && email !== userData.email) {
      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.status(400).json({
          message: 'Please enter a valid email address.',
        });
      }

      // Assuming email verification is handled on the frontend
      updates.email = email;
      changedFields.push('Email');
    }

    // If password is being updated
    let passwordChanged = false;
    if (password) {
      // Validate password format
      const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
      if (!passwordPattern.test(password)) {
        return res.status(400).json({
          message:
            'Password must be at least 8 characters, include one uppercase letter, and one special character.',
        });
      }

      // Hash the new password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
      passwordChanged = true;
      changedFields.push('Password');
    }

    // Update other fields if provided and changed
    if (doctorName && doctorName !== decryptedDoctorName) {
      updates.doctorName = encryptData(doctorName);
      changedFields.push('Doctor Name');
    }

    if (clinicName && clinicName !== decryptedClinicName) {
      updates.clinicName = encryptData(clinicName);
      changedFields.push('Clinic Name');
    }

    if (clinicLocation && clinicLocation !== decryptedClinicLocation) {
      updates.clinicLocation = encryptData(clinicLocation);
      changedFields.push('Clinic Location');
    }

    // Ensure there is at least one field to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update or no changes detected',
      });
    }

    // Update the user's document in Firestore
    await updateDoc(userDocRef, updates);

    let emailSent = false; // Flag to track email sending status

    // If password was changed, send an email notification
    if (passwordChanged) {
      const emailSubject = '🔒 Your ClinicEase Account Password Was Updated';
      const emailTimestamp = new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
      });
      const emailLocation = decryptedClinicLocation || 'N/A';

      // Construct the list of changed fields excluding password for privacy
      const fieldsChanged =
        changedFields.filter((field) => field !== 'Password').join(', ') ||
        'N/A';

      // Email content
      const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background-color: #f7fafc; padding: 20px; text-align: center;">
            <h2 style="color: #2D3748;">Password Update Notification</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hi ${decryptedDoctorName || 'Doctor'},</p>
            <p>Your password for the <strong>ClinicEase</strong> account associated with <strong>${userData.email}</strong> was successfully updated.</p>
            <h3 style="color: #2D3748;">Details of the Update:</h3>
            <ul>
              <li><strong>Fields Changed:</strong> ${fieldsChanged}</li>
              <li><strong>Timestamp (UTC):</strong> ${emailTimestamp}</li>
              <li><strong>Clinic Location:</strong> ${emailLocation}</li>
            </ul>
            <p style="color: #e53e3e;"><strong>If you did not initiate this change, please contact our support team immediately at <a href="mailto:support@clinicease.com" style="color: #3182ce;">support@clinicease.com</a>.</strong></p>
            <p>Thank you,<br/><strong>ClinicEase Team</strong></p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #a0aec0;">&copy; ${new Date().getFullYear()} ClinicEase. All rights reserved.</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(userData.email, emailSubject, emailBody);
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send password update email:', emailError);
        emailSent = false;
      }
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      emailSent, // Indicate whether the email was sent successfully
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

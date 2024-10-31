// pages/api/auth/verify-otp-resetpassword.js

import { verifyOtp, getEmailByUsername } from '../../../src/utils/otpStore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, otp } = req.body;

  // Validate request body
  if (!username || !otp) {
    return res.status(400).json({ message: 'Username and OTP are required' });
  }

  try {
    // Fetch email associated with the username
    const email = await getEmailByUsername(username);
    if (!email) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify OTP
    const isOtpValid = await verifyOtp(email, otp);
    if (!isOtpValid) {
      return res.status(400).json({ verified: false, message: 'Invalid or expired OTP' });
    }

    return res.status(200).json({ verified: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error in OTP verification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

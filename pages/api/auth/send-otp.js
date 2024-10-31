// pages/api/auth/send-otp.js

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { setOtp } from '../../../src/utils/otpStore';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Initialize AWS SES Client
const sesClient = new SESClient({
  region: process.env.MY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

// Initialize Rate Limiter: max 5 requests per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  points: 5, // Number of points
  duration: 15 * 60, // Per 15 minutes
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Determine IP address
  const ip =
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    req.connection.remoteAddress;

  try {
    // Consume 1 point per request
    await rateLimiter.consume(ip);
  } catch (rejRes) {
    // Rate limit exceeded
    return res
      .status(429)
      .json({ message: 'Too many requests, please try again later.' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP
  try {
    await setOtp(email, otp);
  } catch (err) {
    console.error('Error setting OTP:', err);
    return res.status(500).json({ message: 'Failed to set OTP' });
  }

  // Prepare Email Parameters
  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Text: { Data: `Your OTP for Clinic Management signup is: ${otp}` },
      },
      Subject: { Data: 'Your OTP for Clinic Management Signup' },
    },
    Source: process.env.SES_FROM_EMAIL,
  };

  try {
    // Create and send the email
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('SES Error:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
}

// pages/api/auth/request-email-verification.js

import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,      // Your AWS Access Key ID
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
  region: process.env.MY_AWS_REGION,                 // Your AWS Region (e.g., 'us-east-1')
});

// Initialize SES
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, name, reason } = req.body;

    // Basic validations
    if (!email || !name || !reason) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Construct the HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>New Email Verification Request</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
            }
            .header img {
              width: 50px;
              margin-right: 15px;
            }
            .title {
              color: #333333;
            }
            .content {
              color: #555555;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #888888;
            }
            .icon {
              color: #1E90FF;
              margin-right: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <!-- You can replace the src with your company's logo -->
              <img src="https://your-company-logo-url.com/logo.png" alt="Company Logo" />
              <h2 class="title">New Email Verification Request</h2>
            </div>
            <div class="content">
              <p><span class="icon">👤</span><strong>Name:</strong> ${name}</p>
              <p><span class="icon">📧</span><strong>Email:</strong> ${email}</p>
              <p><span class="icon">📝</span><strong>Reason:</strong> ${reason}</p>
              <p style="margin-top: 20px;">
                Please take the necessary steps to verify this email address through the AWS SES platform.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email parameters for SES
    const params = {
      Destination: {
        ToAddresses: [process.env.SES_SUPPORT_EMAIL], // Support team email address
      },
      Message: {
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `New Email Verification Request:

Name: ${name}
Email: ${email}
Reason: ${reason}

Please take the necessary steps to verify this email address.`,
            Charset: 'UTF-8',
          },
        },
        Subject: {
          Data: 'New Email Verification Request',
          Charset: 'UTF-8',
        },
      },
      Source: process.env.SES_FROM_EMAIL, // Verified SES email address (sender)
    };

    try {
      // Send the email using SES
      await ses.sendEmail(params).promise();
      return res.status(200).json({ message: 'Email sent successfully.' });
    } catch (error) {
      console.error('SES Error:', error);
      return res.status(500).json({ message: 'Failed to send email.' });
    }
  } else {
    // Method Not Allowed
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

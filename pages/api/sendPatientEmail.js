// pages/api/sendPatientEmail.js

import AWS from 'aws-sdk';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const {
      toEmail,
      doctorName,
      clinicName,
      clinicAddress,
      username,
      password,
      patientName,
    } = req.body;

    // Input validation
    if (
      !toEmail ||
      !doctorName ||
      !clinicName ||
      !clinicAddress ||
      !username ||
      !password ||
      !patientName
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.MY_AWS_ACCESS_KEY_IDAWS_SECRET_ACCESS_KEY,
      region: process.env.MY_AWS_REGION,
    });

    const ses = new AWS.SES({ apiVersion: '2010-12-01' });

    const loginLink = 'https://clinic-ease.netlify.app/patient-login';

    // Construct the email parameters
    const params = {
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f0f8ff;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #ffffff;
      margin: 20px auto;
      padding: 20px;
      max-width: 600px;
      border-radius: 10px;
      border: 1px solid #dddddd;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #1e90ff;
      color: #ffffff;
      padding: 15px;
      text-align: center;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }
    .header img {
      width: 50px;
      height: 50px;
      vertical-align: middle;
    }
    .header h1 {
      display: inline;
      margin-left: 10px;
      font-size: 24px;
      vertical-align: middle;
    }
    .content {
      padding: 20px;
      color: #333333;
    }
    .content p {
      line-height: 1.6;
    }
    .button {
      background-color: #32cd32;
      color: #ffffff;
      padding: 12px 25px;
      text-decoration: none;
      display: inline-block;
      margin-top: 20px;
      border-radius: 5px;
      font-weight: bold;
    }
    .features {
      list-style-type: none;
      padding: 0;
    }
    .features li {
      padding-left: 1.5em;
      position: relative;
      margin-bottom: 10px;
    }
    .features li::before {
      content: '🩺';
      position: absolute;
      left: 0;
      top: 0;
      color: #1e90ff;
    }
    .footer {
      background-color: #f8f8f8;
      color: #777777;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- You can replace the src with your ClinicEase logo URL -->
      <img src="https://cdn-icons-png.flaticon.com/512/2965/2965567.png" alt="ClinicEase Logo">
      <h1>ClinicEase</h1>
    </div>
    <div class="content">
      <p>Dear ${patientName},</p>
      <p>Welcome to <strong>${clinicName}</strong>! You have been successfully registered as a patient by Dr. ${doctorName}.</p>
      <p><strong>Clinic Address:</strong> ${clinicAddress}</p>
      <p>Your login credentials are as follows:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>You can log in to your account using the button below. For security reasons, please change your password after your first login.</p>
      <p>
        <a href="${loginLink}" class="button">Login to Your Account</a>
      </p>
      <p>Once logged in, you can:</p>
      <ul class="features">
        <li>📈 Track your treatment progress</li>
        <li>📄 View your medical reports</li>
        <li>💬 Communicate with the clinic for emergencies</li>
      </ul>
      <p>If you have any questions or need assistance, feel free to reach out to us.</p>
      <p>We look forward to providing you with excellent care.</p>
      <p>Best regards,<br/>The ${clinicName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ClinicEase. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
            `,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `
Welcome to ${clinicName}

Dear ${patientName},

You have been registered as a patient at ${clinicName} by Dr. ${doctorName}.

Clinic Address: ${clinicAddress}

Your login credentials are:
Username: ${username}
Password: ${password}

You can log in through the following link and change your password anytime from your dashboard:
${loginLink}

Once logged in, you can:
- Track your treatment progress
- View your medical reports
- Communicate with the clinic for emergencies

If you have any questions or need assistance, feel free to reach out to us.

We look forward to providing you with excellent care.

Best regards,
The ${clinicName} Team
            `,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `Welcome to ${clinicName} - Your New Account Details`,
        },
      },
      Source: process.env.SES_FROM_EMAIL,
    };

    try {
      const data = await ses.sendEmail(params).promise();
      console.log('Email sent successfully', data);
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Error sending email', error: error.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

// pages/api/sendVisitEmail.js

import AWS from 'aws-sdk';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const {
      toEmail,
      doctorName,
      clinicName,
      clinicAddress,
      patientName,
      visitData,
      visitNumber,
      // Removed patientDetails
    } = req.body;

    // Debugging: Log the incoming request body
    console.log('Received POST data:', req.body);

    // Input validation
    if (
      !toEmail ||
      !doctorName ||
      !clinicName ||
      !clinicAddress ||
      !patientName ||
      !visitData ||
      !visitNumber
      // Removed patientDetails validation
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
      region: process.env.MY_AWS_REGION,
    });

    const ses = new AWS.SES({ apiVersion: '2010-12-01' });

    // Generate Email Content from EJS Template
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'visitDetailsEmailTemplate.ejs'
    );

    try {
      // Read the EJS template
      const template = await fs.readFile(templatePath, 'utf-8');

      // Prepare data for the template
      const data = {
        clinicName,
        doctorName,
        clinicAddress,
        patientName,
        visitNumber,
        visitData: {
          ...visitData,
          visitDate: formatDateForDisplay(visitData.visitDate),
          nextVisitDate: visitData.nextVisitDate
            ? formatDateForDisplay(visitData.nextVisitDate)
            : '',
        },
        // Removed patientDetails
        loginLink: 'https://clinic-ease.netlify.app/patient-login',
      };

      // Render the HTML content
      const htmlContent = ejs.render(template, data);

      // Construct the email parameters
      const mailOptions = {
        from: process.env.SES_FROM_EMAIL,
        to: toEmail,
        subject: `Your Visit Details - ${clinicName}`,
        html: htmlContent,
        text: generatePlainTextEmail(data),
      };

      // Create a Nodemailer transporter using SES
      const transporter = nodemailer.createTransport({
        SES: ses,
      });

      // Send the email using Nodemailer
      await transporter.sendMail(mailOptions);

      console.log('Email sent successfully');
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        message: 'Error sending email',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal Server Error',
      });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

// Helper function to format dates (no changes needed)
const formatDateForDisplay = (dateStr) => {
  return dateStr;
};

// Helper function to generate plain text email
const generatePlainTextEmail = (data) => {
  const {
    patientName,
    clinicName,
    doctorName,
    clinicAddress,
    visitNumber,
    visitData,
    loginLink,
  } = data;

  let medicinesText = '';
  if (visitData.medicines && visitData.medicines.length > 0) {
    medicinesText += 'Medicines Prescribed:\n';
    visitData.medicines.forEach((med, index) => {
      const timings = [];
      if (med.timings.morning) timings.push('Morning');
      if (med.timings.afternoon) timings.push('Afternoon');
      if (med.timings.night) timings.push('Night');
      medicinesText += `- ${med.name} (${timings.join(', ')})\n`;
    });
  } else {
    medicinesText += 'No medicines prescribed.\n';
  }

  const nextVisit =
    visitData.nextVisitDate && visitData.nextVisitTime
      ? `Next Visit: ${visitData.nextVisitDate} at ${visitData.nextVisitTime}\n`
      : 'No next visit scheduled.\n';

  return `
Visit Details from ${clinicName}

Dear ${patientName},

Thank you for visiting ${clinicName}. Below are the details of your recent visit.

Doctor: Dr. ${doctorName}
Clinic: ${clinicName}
Clinic Address: ${clinicAddress}
Visit Number: ${visitNumber}
Date: ${visitData.visitDate}
Time: ${visitData.visitTime}
Reason for Visit: ${visitData.visitReason}
Symptoms Observed: ${visitData.symptoms}

${medicinesText}

Financial Details:
Total Amount: ₹${visitData.totalAmount}
Amount Paid: ₹${visitData.amountPaid}
Remaining Balance: ₹${(
    parseFloat(visitData.totalAmount) - parseFloat(visitData.amountPaid)
  ).toFixed(2)}

Additional Notes:
${visitData.notes}

${nextVisit}

Stay positive and keep up the good work! Remember, consistent care and a positive mindset are key to your well-being. We're here to support you every step of the way.

You can also log in to your account to track your treatment progress: ${loginLink}

Best regards,
${clinicName} Team
`.trim();
};

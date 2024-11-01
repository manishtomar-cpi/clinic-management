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
    } = req.body;

    // Input validation
    if (
      !toEmail ||
      !doctorName ||
      !clinicName ||
      !clinicAddress ||
      !patientName ||
      !visitData ||
      !visitNumber
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
        text: `
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

${visitData.medicines && visitData.medicines.length > 0 ? 'Medicines Prescribed:' : 'No medicines prescribed.'}
${visitData.medicines && visitData.medicines.length > 0 ? visitData.medicines.map(med => `- ${med.name}: ${med.dosage}, ${med.frequency}`).join('\n') : ''}

Financial Details:
Total Amount: ₹${visitData.totalAmount}
Amount Paid: ₹${visitData.amountPaid}
Remaining Balance: ₹${(parseFloat(visitData.totalAmount) - parseFloat(visitData.amountPaid)).toFixed(2)}

Additional Notes:
${visitData.notes}

${visitData.nextVisitDate && visitData.nextVisitTime ? `Next Visit: ${visitData.nextVisitDate} at ${visitData.nextVisitTime}` : 'No next visit scheduled.'}

You can also log in to your account to track your treatment progress: ${data.loginLink}

Best regards,
${clinicName} Team
        `,
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
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
      });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

// Helper function to format dates from 'dd-mm-yyyy' to 'dd-mm-yyyy' for display (no change)
const formatDateForDisplay = (dateStr) => {
  return dateStr;
};

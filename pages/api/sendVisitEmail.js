
import AWS from 'aws-sdk';
import pdf from 'html-pdf';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

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

    // Generate PDF from EJS template
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'visitDetailsTemplate.ejs'
    );

    try {
      // Read the EJS template
      const template = await readFile(templatePath, 'utf-8');

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
      };

      // Render the HTML content
      const htmlContent = ejs.render(template, data);

      // Generate PDF
      const pdfOptions = {
        format: 'A4',
        orientation: 'portrait',
        border: '10mm',
      };

      const pdfBuffer = await new Promise((resolve, reject) => {
        pdf.create(htmlContent, pdfOptions).toBuffer((err, buffer) => {
          if (err) return reject(err);
          else resolve(buffer);
        });
      });

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
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #dddddd;
    }
    .header {
      background-color: #1e90ff;
      color: #ffffff;
      padding: 15px;
      text-align: center;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }
    .content {
      padding: 20px;
      color: #333333;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ClinicEase</h1>
    </div>
    <div class="content">
      <p>Dear ${patientName},</p>
      <p>Thank you for visiting <strong>${clinicName}</strong>. Please find attached the details of your visit.</p>
      <p>You can also log in to your account to track your treatment progress.</p>
      <p>
        <a href="${loginLink}" class="button">Login to Your Account</a>
      </p>
      <p>If you have any questions or need further assistance, feel free to reach out to us.</p>
      <p>Best regards,<br/>${clinicName} Team</p>
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
Visit Details from ${clinicName}

Dear ${patientName},

Thank you for visiting ${clinicName}. Attached is the detailed report of your visit.

You can also log in to your account to track your treatment progress.

Login to Your Account: ${loginLink}

Best regards,
${clinicName} Team
              `,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: `Your Visit Details - ${clinicName}`,
          },
        },
        Source: process.env.SES_FROM_EMAIL,
      };

      // Since AWS SES's sendRawEmail requires a properly formatted raw email with attachments,
      // we'll construct a MIME message.

      // Import the `nodemailer` library to help construct the raw email
      const nodemailer = require('nodemailer');

      // Create a Nodemailer transporter using SES
      const transporter = nodemailer.createTransport({
        SES: ses,
      });

      // Prepare the email options
      const mailOptions = {
        from: process.env.SES_FROM_EMAIL,
        to: toEmail,
        subject: `Your Visit Details - ${clinicName}`,
        html: params.Message.Body.Html.Data,
        text: params.Message.Body.Text.Data,
        attachments: [
          {
            filename: 'VisitDetails.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      // Send the email using Nodemailer
      await transporter.sendMail(mailOptions);

      console.log('Email sent successfully');
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res
        .status(500)
        .json({ message: 'Error sending email', error: error.message });
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

// pages/api/sendVisitEmail.js

import AWS from 'aws-sdk';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';

// Conditional imports based on environment
let chromium;
let puppeteer;
if (process.env.NODE_ENV === 'production') {
  // Production: Use chrome-aws-lambda and puppeteer-core
  chromium = require('chrome-aws-lambda');
  puppeteer = require('puppeteer-core');
} else {
  // Development: Use full puppeteer
  puppeteer = require('puppeteer');
}

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
      };

      // Render the HTML content
      const htmlContent = ejs.render(template, data);

      // Launch Puppeteer
      let browser;
      if (process.env.NODE_ENV === 'production') {
        // Production: Use chrome-aws-lambda's executable path and args
        browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath,
          headless: chromium.headless,
        });
      } else {
        // Development: Launch normally
        browser = await puppeteer.launch({
          headless: true,
        });
      }

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });
      await browser.close();

      const loginLink = 'https://clinic-ease.netlify.app/patient-login';

      // Construct the email parameters
      const mailOptions = {
        from: process.env.SES_FROM_EMAIL,
        to: toEmail,
        subject: `Your Visit Details - ${clinicName}`,
        html: `
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
        text: `
Visit Details from ${clinicName}

Dear ${patientName},

Thank you for visiting ${clinicName}. Attached is the detailed report of your visit.

You can also log in to your account to track your treatment progress.

Login to Your Account: ${loginLink}

Best regards,
${clinicName} Team
        `,
        attachments: [
          {
            filename: 'VisitDetails.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
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

// Helper function to format dates
const formatDateForDisplay = (dateStr) => {
  return dateStr;
};

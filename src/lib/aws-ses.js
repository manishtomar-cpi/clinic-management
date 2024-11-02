// src/lib/aws-ses.js

import AWS from 'aws-sdk';

// Configure AWS SES
const ses = new AWS.SES({
  region: process.env.MY_AWS_REGION, // e.g., 'eu-north-1'
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
});

/**
 * Sends an email using AWS SES.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Subject of the email.
 * @param {string} htmlBody - HTML content of the email.
 */
export const sendEmail = async (to, subject, htmlBody) => {
  const params = {
    Source: process.env.SES_FROM_EMAIL, // Verified sender email
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log(`Email sent to ${to} with subject "${subject}"`);
    console.log('AWS SES Response:', result);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error; // Throw the actual error to be caught in the API route
  }
};

// Load environment variables from .env file
require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client with credentials from environment variables
const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

// Set refresh token from environment
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

async function sendEmail() {
  try {
    // Get access token (automatically refreshes when expired)
    const accessToken = await oauth2Client.getAccessToken();

    // Create transporter with OAuth2 configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    // Define mail options
    const mailOptions = {
      from: `Your Name <${process.env.GMAIL_USER}>`,
      to: 'richard.genet@gmail.com',
      subject: 'Test Email with OAuth2',
      text: 'This is a test email sent using Nodemailer with OAuth2 authentication.',
      html: '<p>This is a test email sent using Nodemailer with OAuth2 authentication.</p>'
    };

    // Send mail
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Test function
async function runTest() {
  console.log('Starting email test...');
  console.log(`Using email account: ${process.env.GMAIL_USER}`);
  
  try {
    console.log('Attempting to send email...');
    const result = await sendEmail();
    console.log('Email test completed successfully');
    console.log('Mail details:', {
      messageId: result.messageId,
      response: result.response
    });
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();
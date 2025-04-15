// Load the configuration
const config = require('./config');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client with credentials from config file
const oauth2Client = new OAuth2(
  config.gmail.clientId,
  config.gmail.clientSecret,
  'https://developers.google.com/oauthplayground'
);

// Set refresh token from config
oauth2Client.setCredentials({
  refresh_token: config.gmail.refreshToken
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
        user: config.gmail.user,
        clientId: config.gmail.clientId,
        clientSecret: config.gmail.clientSecret,
        refreshToken: config.gmail.refreshToken,
        accessToken: accessToken.token
      }
    });

    // Define mail options
    const mailOptions = {
      from: `Your Name <${config.gmail.user}>`,
      to: 'recipient@example.com',
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
  console.log(`Using email account: ${config.gmail.user}`);
  
  try {
    console.log('Attempting to send email...');
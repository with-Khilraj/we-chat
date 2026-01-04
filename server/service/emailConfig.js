const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

// Validate email credentials
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  throw new Error('Email credentials are missing. Please check your .env file');
}

// Create transporter with enhanced configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Error verifying email transporter:', error);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Please check:');
      console.error('1. Your email credentials are correct');
      console.error('2. "Less secure app access" is enabled in your Google account');
      console.error('3. If using 2FA, you need to use an App Password');
    }
    process.exit(1); // Exit if email configuration fails
  } else {
    console.log('Email transporter is ready to send emails');
  }
});

// Email sending function with improved error handling
const sendVerificationOTP = async (email, otp) => {
  try {
    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }

    const mailOptions = {
      from: `"we-chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to our chat app!!</h2>
          <p>Your email verification OTP is:</p>
          <h1 style="font-size: 30px; letter-spacing: 5px; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
            ${otp}
          </h1>
          <p>The OTP will expire in 2 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error while sending verification email:', error);
    throw error;
  }
};


const sendResetPasswordEmail = async (email, resetLink) => {
  try {
    if (!email || !resetLink) {
      throw new Error('Email and reset link are required');
    }

    const mailOptions = {
      from: `"we-chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #4CAF50; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 2 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error while sending password reset email:', error);
    throw error;
  };
};

module.exports = { sendVerificationOTP, sendResetPasswordEmail };
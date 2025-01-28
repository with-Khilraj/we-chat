const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',   // for now i am using gmail, we can use other services like hotmail, outlook etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendVerificationOTP = async (email, otp) => {
  // const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h2>Welcome to our chat app!! </h2>
      <p> Your email verification OTP is:</p>
      <h1 style = " fontsize: 30px; letter-spacing: 5px; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 5px; >${otp}</h1>
      <p> The OTP will expire in 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
    `
  }

  return transporter.sendMail(mailOptions);
}

module.exports = {sendVerificationOTP};
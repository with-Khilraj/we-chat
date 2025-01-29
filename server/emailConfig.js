const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',   // for now i am using gmail, we can use other services like hotmail, outlook etc.
  host: 'smtp.gmail.com',
  port: 587, 
  secure: false,   // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'qwerfdsq1@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'rafsxzxgqekogtbv'
  },

  tls: {
    rejectUnauthorized: false  // don't fail on invalid certs
  }
});


const sendVerificationOTP = async (email, otp) => {
  try {
    console.log('Attempting to send email to:', email);

    const mailOptions = {
      from: `"we-chat" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
      <div style = "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;" >
        <h2>Welcome to our chat app!! </h2>
        <p> Your email verification OTP is:</p>
        <h1 style = "font-size: 30px; letter-spacing: 5px; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">${otp} </h1>
        <p> The OTP will expire in 24 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
      `
    }
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error while sending verification email:", error);
    throw error;
  }
};

// verify tansporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log("Transporter verification error: ", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

module.exports = sendVerificationOTP;
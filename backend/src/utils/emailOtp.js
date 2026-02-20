const nodemailer = require('nodemailer');
const crypto = require('crypto');
const EmailOtp = require('../models/EmailOtp');

// Configure your email transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : '(not set)');

function generateOTP() {
  return ('' + Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

// Replace in-memory store with DB
async function sendEmailOTP(email) {
  const otp = generateOTP();
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
  try {
    await EmailOtp.create({ email, otp, expires });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your CityZen OTP',
      text: `Your OTP is: ${otp}`,
    });
    return true;
  } catch (err) {
    console.error('OTP email send error:', err);
    throw err;
  }
}

async function verifyEmailOTP(email, otp) {
  const record = await EmailOtp.findOne({ where: { email, otp } });
  if (!record || record.expires < new Date()) return false;
  await record.destroy(); // Remove OTP after use
  return true;
}

module.exports = { sendEmailOTP, verifyEmailOTP };

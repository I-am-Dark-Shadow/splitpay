import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import bcrypt from 'bcryptjs';

// @desc    Register new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({ name, email, password });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
export const getUserProfile = async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  };
  res.status(200).json(user);
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'Email not found' });
  }

  // Generate 4 Digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Save OTP to user DB (Temporary) - In production use Redis or dedicated field with expiry
  user.resetPasswordOtp = otp;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes
  await user.save();

  // HTML Template
  const message = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SplitPay OTP</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6fb; font-family: Arial, Helvetica, sans-serif;">

  <div style="max-width:420px; margin:0 auto; padding:16px;">
    
    <!-- Card -->
    <div style="
      background:#ffffff;
      border-radius:14px;
      padding:24px 20px;
      box-shadow:0 8px 24px rgba(0,0,0,0.08);
      text-align:center;
    ">
      
      <!-- Logo / Brand -->
      <h1 style="
        margin:0 0 8px;
        font-size:26px;
        font-weight:800;
        color:#0b1f4b;
        letter-spacing:0.5px;
      ">
        SplitPay
      </h1>

      <p style="
        margin:0 0 20px;
        font-size:14px;
        color:#6b7280;
      ">
        Secure Expense Sharing
      </p>

      <!-- Title -->
      <h2 style="
        margin:0 0 12px;
        font-size:20px;
        font-weight:700;
        color:#111827;
      ">
        Password Reset OTP
      </h2>

      <p style="
        margin:0 0 20px;
        font-size:15px;
        line-height:1.6;
        color:#374151;
      ">
        Use the OTP below to reset your password.
        This code is valid for <strong>10 minutes</strong>.
      </p>

      <!-- OTP Box -->
      <div style="
        margin:20px auto;
        padding:14px 0;
        width:100%;
        border-radius:10px;
        background:#0b1f4b;
        color:#ffffff;
        font-size:34px;
        font-weight:800;
        letter-spacing:10px;
      ">
        ${otp}
      </div>

      <p style="
        margin:20px 0 0;
        font-size:13px;
        color:#6b7280;
        line-height:1.6;
      ">
        If you didn’t request a password reset,<br/>
        you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="
      text-align:center;
      margin-top:16px;
      font-size:12px;
      color:#9ca3af;
      line-height:1.6;
    ">
      © ${new Date().getFullYear()} SplitPay<br/>
      Contact: <a href="mailto:splitpay.official@gmail.com" style="color:#0b1f4b; text-decoration:none;">
        splitpay.official@gmail.com
      </a>
    </div>

  </div>

</body>
</html>
`;


  try {
    await sendEmail({
      email: user.email,
      subject: 'SplitPay Password Reset OTP',
      html: message
    });
    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error("Email Sending Error:", error);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ message: 'Email could not be sent' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  user.resetPasswordOtp = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ message: 'Password updated successfully' });
};
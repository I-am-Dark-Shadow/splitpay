import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: true,      // 🔐 HTTPS required (Vercel + Mobile OK)
    sameSite: 'none',  // 🔥 CRITICAL for WebView / cross-site
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;

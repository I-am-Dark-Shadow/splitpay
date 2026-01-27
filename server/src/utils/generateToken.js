import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: true,        // 🔥 Vercel (HTTPS)
    sameSite: 'none',    // 🔥 cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export default generateToken;

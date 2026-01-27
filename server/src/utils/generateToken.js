import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Check if we are in production (Vercel)
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    // লোকালে secure: false হতে হবে, লাইভে true
    secure: true, 
    // লোকালে sameSite: 'lax' ভালো কাজ করে, লাইভে 'none'
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export default generateToken;
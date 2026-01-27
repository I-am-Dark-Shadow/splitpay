import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    // 🔹 Token না থাকলে → simply unauthorized (NO CRASH)
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // 🔹 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 IMPORTANT: decoded.id (NOT userId)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('AUTH MIDDLEWARE ERROR 👉', error);
    return res.status(401).json({ message: 'Not authorized' });
  }
};

export { protect };

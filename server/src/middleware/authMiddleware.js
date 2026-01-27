import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // কুকি থেকে টোকেন নেওয়া
  token = req.cookies.jwt;

  if (token) {
    try {
      // টোকেন ভেরিফাই করা
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ ফিক্স: decoded.userId এর পরিবর্তে decoded.id ব্যবহার করতে হবে
      req.user = await User.findById(decoded.id).select('-password');

      // যদি ইউজার ডাটাবেসে না পাওয়া যায়
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };
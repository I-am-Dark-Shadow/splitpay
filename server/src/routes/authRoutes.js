import express from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getUserProfile,
  forgotPassword, // ✅ নতুন ইমপোর্ট
  resetPassword   // ✅ নতুন ইমপোর্ট
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

// ✅ নতুন পাসওয়ার্ড রিসেট রাউটস
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
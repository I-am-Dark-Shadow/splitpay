import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import groupRoutes from './src/routes/groupRoutes.js';
import expenseRoutes from './src/routes/expenseRoutes.js';

dotenv.config();
connectDB();

const app = express();

// ✅ Universal CORS Configuration (Web + Mobile Fix)
app.use(cors({
  origin: (origin, callback) => {
    // ১. মোবাইল অ্যাপ বা পোস্টম্যান থেকে আসলে 'origin' থাকে না, তাই Allow করুন
    if (!origin) {
      return callback(null, true);
    }
    // ২. ওয়েব থেকে আসলে যেই ডোমেইন থেকেই আসুক, Allow করুন (Reflect Origin)
    return callback(null, true);
  },
  credentials: true, // কুকি পাস করার জন্য জরুরি
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
  res.send('SplitPay API is running...');
});

// Global Error Handler (যাতে সার্ভার ক্রাশ না করে এরর মেসেজ দেয়)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
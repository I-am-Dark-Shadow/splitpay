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

/* =======================
   🔥 FINAL CORS CONFIG
   Web + Mobile + APK Safe
======================= */
app.use(cors({
  origin: true,        // 🔥 Reflects origin (vercel, https://localhost, etc.)
  credentials: true,  // 🔥 Allow cookies
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

// ❌ Not found handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 🔥 Global error handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR 👉', err);
  res.status(500).json({
    message: 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

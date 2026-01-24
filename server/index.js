import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db.js';

// Routes
import authRoutes from './src/routes/authRoutes.js';
import groupRoutes from './src/routes/groupRoutes.js';

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Config (Allow credentials for Cookies)
app.use(cors({
  origin: process.env.CLIENT_URL, // Vercel Environment Variable থেকে আসবে
  credentials: true, // কুকি এলাউ করার জন্য এটি মাস্ট
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

app.get('/', (req, res) => {
  res.send('SplitPay API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
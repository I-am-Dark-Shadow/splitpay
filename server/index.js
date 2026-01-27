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

app.use(cors({
  origin: function (origin, callback) {
    // ১. যদি কোনো origin না থাকে (যেমন Mobile App বা Postman), তাহলে Allow করুন
    if (!origin) {
      return callback(null, true);
    }

    // ২. আপনার অনুমোদিত ডোমেইনগুলোর লিস্ট
    const allowedOrigins = [
      process.env.CLIENT_URL,      
      'http://localhost:5173',   
    ];

    
    if (allowedOrigins.indexOf(origin) !== -1 || true) { 
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, 
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
  res.send('SplitPay API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

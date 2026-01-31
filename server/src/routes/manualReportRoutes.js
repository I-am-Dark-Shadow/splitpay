import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { saveReport, getReports } from '../controllers/manualReportController.js';

const router = express.Router();

router.route('/')
  .post(protect, saveReport)
  .get(protect, getReports);

export default router;
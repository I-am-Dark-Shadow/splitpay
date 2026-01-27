import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { deleteExpense, updateExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.route('/:id')
  .delete(protect, deleteExpense) // DELETE Request
  .put(protect, updateExpense);   // UPDATE Request

export default router;
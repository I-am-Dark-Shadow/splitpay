import express from 'express';
import { createGroup, getUserGroups, addExpense, getGroupDetails, getRecentActivity } from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/activity', protect, getRecentActivity);
router.post('/', protect, createGroup);
router.get('/', protect, getUserGroups);
router.get('/:id', protect, getGroupDetails);
router.post('/:id/expenses', protect, addExpense);

export default router;
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  createGroup, 
  getUserGroups, 
  getGroupDetails, 
  addExpense,
  addMemberToGroup,
  // 👇 নতুন কন্ট্রোলারগুলো ইমপোর্ট করুন
  deleteGroup,
  removeMember 
} from '../controllers/groupController.js';

const router = express.Router();

router.route('/')
  .post(protect, createGroup)
  .get(protect, getUserGroups);

router.route('/:id')
  .get(protect, getGroupDetails)
  .delete(protect, deleteGroup); // ✅ DELETE GROUP ROUTE (Admin Only)

router.route('/:id/expenses')
  .post(protect, addExpense);

router.route('/:id/members')
  .put(protect, addMemberToGroup);

// ✅ REMOVE MEMBER ROUTE (Admin Only)
router.route('/:id/remove-member')
  .put(protect, removeMember);

export default router;
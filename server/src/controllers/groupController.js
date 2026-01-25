import Group from '../models/Group.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create a new group
// @route   POST /api/groups
export const createGroup = async (req, res) => {
  const { name, members } = req.body; // members = array of emails

  // 1. Find User IDs for emails
  const memberUsers = await User.find({ email: { $in: members } });
  const memberIds = memberUsers.map(u => u._id);
  
  // Add creator to members if not already there
  if (!memberIds.includes(req.user._id)) {
    memberIds.push(req.user._id);
  }

  const group = await Group.create({
    name,
    creator: req.user._id,
    members: memberIds
  });

  // Send Invitations
  memberUsers.forEach(user => {
    if (user.email !== req.user.email) {
      sendEmail(user.email, `Added to group: ${name}`, `<p>You have been added to the group <b>${name}</b> on SplitPay.</p>`);
    }
  });

  res.status(201).json(group);
};

// @desc    Get user's groups
// @route   GET /api/groups
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email') // Member details anchi
      .populate({
        path: 'expenses', // Expenses o anchi calculation er jonno
        select: 'amount paidBy shares description', // Shudhu dorkari field
        populate: { path: 'paidBy', select: '_id name' } // Payer details
      })
      .sort({ updatedAt: -1 });
      
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups' });
  }
};

// @desc    Add Expense
// @route   POST /api/groups/:id/expenses
export const addExpense = async (req, res) => {
  const { description, amount, splitMethod, shares } = req.body;
  const groupId = req.params.id;

  const expense = await Expense.create({
    description,
    amount,
    group: groupId,
    paidBy: req.user._id,
    splitMethod,
    shares // Expects array: [{ user: userId, amount: 500 }]
  });

  // Link expense to group
  const group = await Group.findById(groupId);
  group.expenses.push(expense._id);
  await group.save();

  res.status(201).json(expense);
};

// @desc    Get Group Details
// @route   GET /api/groups/:id
export const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email') // Member details
      .populate({
        path: 'expenses',
        options: { sort: { createdAt: -1 } }, // Newest first
        populate: { 
          path: 'paidBy', 
          select: '_id name email' // Ensure ID and Name exist
        } 
      });

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get recent activity (expenses across all user groups)
// @route   GET /api/groups/activity
export const getRecentActivity = async (req, res) => {
  try {
    // 1. Find groups where user is a member
    const groups = await Group.find({ members: req.user._id });
    const groupIds = groups.map(g => g._id);

    // 2. Find expenses for these groups, sort by newest
    const expenses = await Expense.find({ group: { $in: groupIds } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('paidBy', 'name')
      .populate('group', 'name');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add member to existing group
// @route   PUT /api/groups/:id/members
export const addMemberToGroup = async (req, res) => {
  try {
    const { email } = req.body;
    const groupId = req.params.id;

    // 1. Find User by Email
    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // 2. Find Group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // 3. Check if user already exists in group
    if (group.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User already in the group' });
    }

    // 4. Add User and Save
    group.members.push(userToAdd._id);
    await group.save();

    // 5. Return updated group with populated members
    const updatedGroup = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate({
        path: 'expenses',
        populate: { path: 'paidBy', select: 'name' }
      });

    res.json(updatedGroup);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
import Group from '../models/Group.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc    Create a new group
// @route   POST /api/groups
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body; // members = array of emails

    // 1. Find User IDs for emails
    const memberUsers = await User.find({ email: { $in: members } });
    const memberIds = memberUsers.map(u => u._id);
    
    // Add creator to members if not already there
    if (!memberIds.includes(req.user._id)) {
      memberIds.push(req.user._id);
    }

    // 2. Create Group (Set Creator as Admin)
    const group = await Group.create({
      name,
      creator: req.user._id,
      admin: req.user._id, // ✅ Set Admin
      members: memberIds
    });

    // Send Invitations
    memberUsers.forEach(user => {
      if (user.email !== req.user.email) {
        sendEmail({
          email: user.email, 
          subject: `Added to group: ${name}`, 
          html: `<p>You have been added to the group <b>${name}</b> on SplitPay.</p>`
        });
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email')
      .populate({
        path: 'expenses',
        select: 'amount paidBy shares description splitMethod',
        populate: { path: 'paidBy', select: '_id name' }
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
  try {
    const { description, amount, splitMethod, shares } = req.body;
    const groupId = req.params.id;

    // Check if group has members (Upgrade 4 logic)
    const groupCheck = await Group.findById(groupId);
    if(groupCheck.members.length <= 1 && splitMethod === 'equal') {
       // Logic handles itself: if 1 member, they pay 100%. 
       // Later when member adds, recalculation logic below handles it.
    }

    const expense = await Expense.create({
      description,
      amount,
      group: groupId,
      paidBy: req.user._id,
      splitMethod,
      shares 
    });

    // Link expense to group
    groupCheck.expenses.push(expense._id);
    await groupCheck.save();

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense' });
  }
};

// @desc    Get Group Details
// @route   GET /api/groups/:id
export const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate({
        path: 'expenses',
        options: { sort: { createdAt: -1 } },
        populate: { 
          path: 'paidBy', 
          select: '_id name email' 
        } 
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get recent activity
// @route   GET /api/groups/activity
export const getRecentActivity = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id });
    const groupIds = groups.map(g => g._id);

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

// @desc    Add member to group & Recalculate Expenses
// @route   PUT /api/groups/:id/members
export const addMemberToGroup = async (req, res) => {
  try {
    const { email } = req.body;
    const groupId = req.params.id;

    // 1. Find User
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found with this email' });

    // 2. Find Group
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // 3. Check duplicate
    if (group.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User already in the group' });
    }

    // 4. Add User
    group.members.push(userToAdd._id);
    await group.save();

    // 🔥 5. RECALCULATE 'EQUAL' SPLIT EXPENSES (Upgrade 4 Fix)
    // যখন নতুন মেম্বার অ্যাড হবে, পুরনো সব 'equal' খরচ সবার মধ্যে আবার ভাগ হবে।
    const equalExpenses = await Expense.find({ group: groupId, splitMethod: 'equal' });
    
    for (const exp of equalExpenses) {
      const newSplitAmount = exp.amount / group.members.length;
      
      const newShares = group.members.map(memberId => ({
        user: memberId,
        amount: newSplitAmount
      }));

      exp.shares = newShares;
      await exp.save();
    }

    // 6. Return updated group
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

// @desc    Delete Group (Admin Only)
// @route   DELETE /api/groups/:id
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check if requester is Admin
    // (Ensure you added 'admin' field in Group Model schema)
    if (group.admin && group.admin.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized. Only Admin can delete.' });
    }

    // Delete all expenses of this group
    await Expense.deleteMany({ group: req.params.id });
    
    // Delete the group
    await group.deleteOne();

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Remove Member (Admin Only)
// @route   PUT /api/groups/:id/remove-member
export const removeMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const groupId = req.params.id;
    const group = await Group.findById(groupId);

    // Check Admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized. Only Admin can remove members.' });
    }

    // Remove Member from array
    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();

    // 🔥 Delete Expenses paid by this user in this group
    await Expense.deleteMany({ group: groupId, paidBy: memberId });

    // (Optional: You can trigger Recalculation logic here again if needed)

    res.json({ message: 'Member removed and their expenses deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
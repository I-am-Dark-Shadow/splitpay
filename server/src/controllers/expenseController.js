import Expense from '../models/Expense.js';
import Group from '../models/Group.js';

// @desc    Delete Expense
// @route   DELETE /api/expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user is the one who created the expense
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this expense' });
    }

    // Remove expense ID from Group
    await Group.findByIdAndUpdate(expense.group, {
      $pull: { expenses: expense._id }
    });

    // Delete the expense
    await expense.deleteOne();

    res.json({ message: 'Expense removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update Expense
// @route   PUT /api/expenses/:id
export const updateExpense = async (req, res) => {
  try {
    const { description, amount } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check ownership
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    expense.description = description || expense.description;
    expense.amount = amount || expense.amount;

    await expense.save();

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who paid
  splitMethod: { type: String, enum: ['equal', 'custom'], default: 'equal' },
  
  // Who owes what
  shares: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true }
  }]
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
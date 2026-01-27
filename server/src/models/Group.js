import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // ✅ এই ফিল্ডটি নতুন যোগ করা হলো
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true // গ্রুপ তৈরির সময় এটি সেট হবে
  },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
  currency: { type: String, default: 'INR' }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
export default Group;
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Forgot Password Fields
  resetPasswordOtp: String,
  resetPasswordExpire: Date
}, { timestamps: true });

// ✅ Updated: 'next' প্যারামিটার রিমুভ করা হয়েছে
userSchema.pre('save', async function () {
  // যদি পাসওয়ার্ড মডিফাই না হয়, তাহলে কিছুই করার দরকার নেই, শুধু return করুন
  if (!this.isModified('password')) {
    return;
  }
  
  // পাসওয়ার্ড হ্যাশ করা
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
import mongoose from 'mongoose';

const manualReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  data: { type: Object, required: true }, // Stores settlements, members, total
}, { timestamps: true });

export default mongoose.model('ManualReport', manualReportSchema);
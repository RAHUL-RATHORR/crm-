import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  device: { type: String },
  status: { type: String, default: 'success' }, // success, failed
  loginTime: { type: Date, default: Date.now }
}, { timestamps: true });

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;

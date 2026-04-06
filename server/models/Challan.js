import mongoose from 'mongoose';

const challanSchema = new mongoose.Schema({
  challanNo: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  jobCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' }, 
  jobNumber: { type: String },
  jobName: { type: String },
  partyName: { type: String, required: true },
  description: { type: String, required: true },
  qty: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  note: { type: String },
  paymentStatus: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Challan = mongoose.model('Challan', challanSchema);
export default Challan;

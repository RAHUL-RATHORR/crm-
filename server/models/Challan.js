import mongoose from 'mongoose';

const challanSchema = new mongoose.Schema({
  challanNo: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  jobCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCard' }, 
  jobNumber: { type: String },
  jobName: { type: String },
  partyName: { type: String, required: true },
  description: { type: String }, // Optional for backward compatibility
  qty: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  items: [{
    description: { type: String, required: true },
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 }
  }],
  total: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 18 },
  freight: { type: Number, default: 0 },
  gstType: { type: String, default: 'CGST/SGST' },
  reverseCharge: { type: String, default: 'No' },
  note: { type: String },
  paymentStatus: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Challan = mongoose.model('Challan', challanSchema);
export default Challan;

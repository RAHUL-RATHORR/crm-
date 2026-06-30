import mongoose from 'mongoose';

const estimateSchema = new mongoose.Schema({
  quoteNumber: { type: String, required: true, unique: true },
  quoteDate: { type: Date, default: Date.now },
  partyName: { type: String, required: true },
  address: { type: String, default: '' },
  gstNo: { type: String, default: '' },
  jobName: { type: String, default: '' },
  pageSize: { type: String, default: '' },
  jobQty: { type: String, default: '0' },
  printingType: { type: String, default: '' },
  paper: { type: String, default: '' },
  totalAmount: { type: Number, default: 0 },
  salesPerson: { type: String, default: 'Admin' },
  paymentTerms: { type: String, default: '7 Days' },
  notes: { type: String, default: '' },
}, { timestamps: true });

const Estimate = mongoose.model('Estimate', estimateSchema);
export default Estimate;

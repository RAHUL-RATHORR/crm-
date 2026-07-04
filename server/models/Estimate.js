import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  hsn: { type: String, default: '' },
  qty: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  per: { type: String, default: 'PCS' },
  total: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
});

const estimateSchema = new mongoose.Schema({
  quoteNumber: { type: String, required: true, unique: true },
  quoteDate: { type: Date, default: Date.now },
  orderNo: { type: String, default: '' },
  orderDate: { type: Date },
  jobCard: { type: String, default: '' },
  partyName: { type: String, required: true },
  partyAddress: { type: String, default: '' },
  partyContact: { type: String, default: '' },
  partyEmail: { type: String, default: '' },
  partyGst: { type: String, default: '' },
  address: { type: String, default: '' },
  gstNo: { type: String, default: '' },
  items: [itemSchema],
  subTotal: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  reverseCharge: { type: String, default: 'No' },
  gstPercent: { type: Number, default: 18 },
  gstType: { type: String, default: 'CGST/SGST' },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentType: { type: String, default: '' },
  jobName: { type: String, default: '' },
  pageSize: { type: String, default: '' },
  jobQty: { type: String, default: '0' },
  printingType: { type: String, default: '' },
  paper: { type: String, default: '' },
  salesPerson: { type: String, default: 'Admin' },
  paymentTerms: { type: String, default: '7 Days' },
  notes: { type: String, default: '' },
}, { timestamps: true });

const Estimate = mongoose.model('Estimate', estimateSchema);
export default Estimate;

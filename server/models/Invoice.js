import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn: { type: String, default: '' },
  qty: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  jobCard: { type: String }, // Can be JobNumber or reference
  orderNo: { type: String, default: '' },
  orderDate: { type: Date },
  partyName: { type: String, required: true },
  partyAddress: { type: String, default: '' },
  partyContact: { type: String, default: '' },
  partyEmail: { type: String, default: '' },
  partyGst: { type: String, default: '' },
  items: [itemSchema],
  subTotal: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  reverseCharge: { type: String, default: 'No' },
  gstPercent: { type: Number, default: 0 },
  gstType: { type: String, default: 'CGST/SGST' },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;

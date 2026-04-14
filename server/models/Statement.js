import mongoose from 'mongoose';

const statementSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  partyName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true }, // e.g., Cash, UPI, Bank
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Statement = mongoose.model('Statement', statementSchema);
export default Statement;

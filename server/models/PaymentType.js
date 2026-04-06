import mongoose from 'mongoose';

const paymentTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const PaymentType = mongoose.model('PaymentType', paymentTypeSchema);
export default PaymentType;

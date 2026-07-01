import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hsn: { type: String, default: '' },
  rate: { type: Number, default: 0 },
  per: { type: String, default: 'PCS' },
  gstPercent: { type: Number, default: 18 },
  note: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);
export default Item;

import mongoose from 'mongoose';

const paperStockSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  gsm: { 
    type: Number, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  unit: { 
    type: String, 
    default: 'Sheets' 
  },
  description: { 
    type: String,
    trim: true
  },
  lowStockThreshold: {
    type: Number,
    default: 100
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const PaperStock = mongoose.model('PaperStock', paperStockSchema);
export default PaperStock;

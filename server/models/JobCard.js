import mongoose from 'mongoose';

const jobCardSchema = new mongoose.Schema({
  partyName: { type: String, required: true },
  companyName: { type: String }, // redundant alias for backward compatibility
  jobName: { type: String, required: true },
  jobNumber: { type: String, required: true, unique: true },
  jobQty: { type: Number, default: 0 },
  jobDate: { type: Date, default: Date.now },
  paperType: { type: String }, // Company Paper / Paper Party
  
  // Printing Details
  controlPrint: { type: String },
  paper: { type: String },
  printingUC: { type: String },
  printingType: { type: String }, // Color selection
  printingPrice: { type: Number, default: 0 },
  bindingNo: { type: String },
  bindingNote: { type: String },
  filePath: { type: String },
  plateNo: { type: String },
  platePrice: { type: Number, default: 0 },
  
  // Job Summary
  plateFrom: { type: String },
  paperFrom: { type: String },
  paperSize: { type: String },
  cuttingSize: { type: String },
  paperGSM: { type: String },
  printSheet: { type: String }, // Single / Double
  folding: { type: String },
  jobColor: [Number], // [1, 2, 3, 4]
  jobCounter: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  notes: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const JobCard = mongoose.model('JobCard', jobCardSchema);
export default JobCard;

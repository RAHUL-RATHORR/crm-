import mongoose from 'mongoose';

const deletedItemSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  collectionName: { type: String, required: true }, // e.g. 'JobCard', 'Invoice', 'Challan', 'PaperStock'
  itemName: { type: String, required: true }, // For displaying in the UI (e.g. Job Card No, Invoice No)
  itemType: { type: String, required: true }, // Human readable type (e.g. 'Job Card', 'Invoice')
  documentData: { type: Object, required: true }, // The complete original document
}, { timestamps: true });

const DeletedItem = mongoose.model('DeletedItem', deletedItemSchema);
export default DeletedItem;

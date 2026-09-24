import express from 'express';
import DeletedItem from '../models/DeletedItem.js';
import mongoose from 'mongoose';
import { getCoverUsages, getInnerUsages, applyCoverDelta, applyInnerDelta } from '../utils/paperStockDeduction.js';

const router = express.Router();

// Get all deleted items
router.get('/', async (req, res) => {
  try {
    const items = await DeletedItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore a deleted item
router.post('/restore/:id', async (req, res) => {
  try {
    const deletedItem = await DeletedItem.findById(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Deleted item not found' });
    }

    const { collectionName, documentData } = deletedItem;

    // Dynamically get the model based on the original collection name
    let OriginalModel;
    try {
      OriginalModel = mongoose.model(collectionName);
    } catch (err) {
      // If the model is not registered, we can't restore it dynamically
      return res.status(500).json({ error: `Cannot restore: Model ${collectionName} is not registered.` });
    }

    // Insert the document back into the original collection
    // Note: Mongoose might strip _id, but create() typically allows inserting with explicit _id if it doesn't conflict
    await OriginalModel.create(documentData);

    // Remove from DeletedItem collection
    await DeletedItem.findByIdAndDelete(req.params.id);

    // If it was a Job Card, deduct stock again
    if (collectionName === 'JobCard') {
      try {
        const coverUsages = getCoverUsages(documentData);
        const innerUsages = getInnerUsages(documentData);

        for (const usage of coverUsages) {
          await applyCoverDelta(usage.paper, usage.paperGSM, usage.qty, {
            paperSource: usage.paperSource,
            partyName: documentData.partyName || documentData.companyName || '',
            jobNumber: documentData.jobNumber || '',
            jobCardId: documentData._id,
            note: 'Deducted from job card restore',
          });
        }
        for (const usage of innerUsages) {
          await applyInnerDelta(usage.paper, usage.paperGSM, usage.qty, {
            paperSource: usage.paperSource,
            partyName: documentData.partyName || documentData.companyName || '',
            jobNumber: documentData.jobNumber || '',
            jobCardId: documentData._id,
            note: 'Deducted from job card restore',
          });
        }
      } catch (stockErr) {
        console.error('⚠️ Failed to re-deduct stock for restored Job Card:', stockErr.message);
      }
    }

    res.json({ message: 'Item restored successfully' });
  } catch (err) {
    // If it fails (e.g., duplicate key), we can catch it
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
const router = express.Router();
import PaperStock from '../models/PaperStock.js';

// GET /api/paper-stock - Get all stock items
router.get('/', async (req, res) => {
  try {
    const stock = await PaperStock.find().sort({ name: 1, gsm: 1 });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/paper-stock - Add new stock item
router.post('/', async (req, res) => {
  try {
    const { name, coverName, innerName, gsm, quantity, coverGSM, coverQuantity, coverPaperSize, innerGSM, innerQuantity, innerPaperSize, unit, description, lowStockThreshold, paperSource } = req.body;
    
    const resolvedCoverName = (coverName || '').trim();
    const resolvedInnerName = (innerName || '').trim();
    const resolvedName = name?.trim()
      || [resolvedCoverName, resolvedInnerName].filter((value, index, arr) => value && arr.indexOf(value) === index).join(' / ')
      || 'Unnamed Paper';

    // Check if item with same name and paperSource already exists
    const existing = await PaperStock.findOne({ name: resolvedName, paperSource: paperSource || 'Company paper' });
    if (existing) {
      return res.status(400).json({ error: "Paper with this name and Source already exists. Please update the existing entry." });
    }

    const newItem = new PaperStock({
      name: resolvedName,
      coverName: resolvedCoverName || resolvedName,
      innerName: resolvedInnerName || resolvedName,
      gsm,
      quantity,
      coverGSM,
      coverQuantity,
      coverPaperSize,
      innerGSM,
      innerQuantity,
      innerPaperSize,
      unit,
      description,
      lowStockThreshold,
      paperSource: paperSource || 'Company paper'
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/paper-stock/:id - Update stock item
router.put('/:id', async (req, res) => {
  try {
    const { name, coverName, innerName, gsm, quantity, coverGSM, coverQuantity, coverPaperSize, innerGSM, innerQuantity, innerPaperSize, unit, description, lowStockThreshold, paperSource } = req.body;
    const resolvedCoverName = (coverName || '').trim();
    const resolvedInnerName = (innerName || '').trim();
    const resolvedName = name?.trim()
      || [resolvedCoverName, resolvedInnerName].filter((value, index, arr) => value && arr.indexOf(value) === index).join(' / ')
      || 'Unnamed Paper';

    const updated = await PaperStock.findByIdAndUpdate(
      req.params.id,
      {
        name: resolvedName,
        coverName: resolvedCoverName || resolvedName,
        innerName: resolvedInnerName || resolvedName,
        gsm, quantity, coverGSM, coverQuantity, coverPaperSize, innerGSM, innerQuantity, innerPaperSize, unit, description, lowStockThreshold, paperSource, updatedAt: Date.now()
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Item not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/paper-stock/:id - Delete stock item
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await PaperStock.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

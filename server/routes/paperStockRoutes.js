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
    const { name, gsm, quantity, unit, description, lowStockThreshold } = req.body;
    
    // Check if item with same name and gsm already exists
    const existing = await PaperStock.findOne({ name, gsm });
    if (existing) {
      return res.status(400).json({ error: "Paper with this name and GSM already exists. Please update the existing entry." });
    }

    const newItem = new PaperStock({
      name,
      gsm,
      quantity,
      unit,
      description,
      lowStockThreshold
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
    const { name, gsm, quantity, unit, description, lowStockThreshold } = req.body;
    const updated = await PaperStock.findByIdAndUpdate(
      req.params.id,
      { name, gsm, quantity, unit, description, lowStockThreshold, updatedAt: Date.now() },
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

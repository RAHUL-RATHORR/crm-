import express from 'express';
import Item from '../models/Item.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, hsn, rate, per, gstPercent, note, isActive } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const item = await Item.create({
      name: name.trim(),
      hsn: (hsn || '').trim(),
      rate: Number(rate) || 0,
      per: String(per ?? '').trim() || 'PCS',
      gstPercent: Number(gstPercent) || 18,
      note: (note || '').trim(),
      isActive: isActive !== false,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, hsn, rate, per, gstPercent, note, isActive } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        hsn: (hsn || '').trim(),
        rate: Number(rate) || 0,
        per: String(per ?? '').trim() || 'PCS',
        gstPercent: Number(gstPercent) || 18,
        note: (note || '').trim(),
        isActive: isActive !== false,
      },
      { new: true },
    );

    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

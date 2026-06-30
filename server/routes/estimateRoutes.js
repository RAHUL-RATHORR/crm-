import express from 'express';
import Estimate from '../models/Estimate.js';

const router = express.Router();

async function generateQuoteNumber() {
  const lastEstimate = await Estimate.findOne().sort({ createdAt: -1 }).select('quoteNumber');
  let nextNum = 1;

  if (lastEstimate?.quoteNumber) {
    const lastNum = parseInt(lastEstimate.quoteNumber.replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `ESTHR-${String(nextNum).padStart(4, '0')}`;
}

router.get('/', async (req, res) => {
  try {
    const estimates = await Estimate.find().sort({ createdAt: -1 });
    res.json(estimates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };

    if (!payload.quoteNumber) {
      payload.quoteNumber = await generateQuoteNumber();
    }

    const existing = await Estimate.findOne({ quoteNumber: payload.quoteNumber });
    if (existing) {
      return res.status(400).json({ error: 'Quote Number already exists' });
    }

    const estimate = await Estimate.create(payload);
    res.status(201).json(estimate);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Quote Number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Estimate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Estimate not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/price', async (req, res) => {
  try {
    const { totalAmount } = req.body;
    const updated = await Estimate.findByIdAndUpdate(
      req.params.id,
      { totalAmount: Number(totalAmount) || 0 },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Estimate not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Estimate.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Estimate not found' });
    res.json({ message: 'Estimate deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

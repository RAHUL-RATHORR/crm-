import express from 'express';
const router = express.Router();
import PaymentType from '../models/PaymentType.js';

// POST /api/payment-type - Create a new Payment Type
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const newPayment = new PaymentType({ name });
    await newPayment.save();
    res.status(201).json(newPayment);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Payment Type already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment-type - Fetch all Payment Types
router.get('/', async (req, res) => {
  try {
    const payments = await PaymentType.find().sort({ name: 1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payment-type/:id - Update a Payment Type
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const payment = await PaymentType.findByIdAndUpdate(
      req.params.id,
      { name, updatedAt: Date.now() },
      { new: true }
    );
    if (!payment) return res.status(404).json({ error: "Payment Type not found" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/payment-type/:id - Delete a Payment Type
router.delete('/:id', async (req, res) => {
  try {
    const result = await PaymentType.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Payment Type not found" });
    res.json({ message: "Payment Type deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

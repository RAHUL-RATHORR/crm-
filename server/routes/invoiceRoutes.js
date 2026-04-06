import express from 'express';
const router = express.Router();
import Invoice from '../models/Invoice.js';

// POST /api/invoice - Create or Update Invoice
router.post('/', async (req, res) => {
  try {
    const { invoiceNumber } = req.body;
    
    let invoice;
    if (invoiceNumber) {
       invoice = await Invoice.findOneAndUpdate(
        { invoiceNumber },
        { ...req.body },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      invoice = new Invoice(req.body);
      await invoice.save();
    }

    res.status(200).json(invoice);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Invoice Number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invoice - Fetch all Invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/invoice/:id - Delete an Invoice
router.delete('/:id', async (req, res) => {
  try {
    const result = await Invoice.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

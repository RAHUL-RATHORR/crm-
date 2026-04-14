import express from 'express';
const router = express.Router();
import Statement from '../models/Statement.js';
import Invoice from '../models/Invoice.js';

// GET /api/statements - Fetch all payment records
router.get('/', async (req, res) => {
  try {
    const statements = await Statement.find().sort({ date: -1 });
    res.json(statements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/statements - Add a new payment entry
router.post('/', async (req, res) => {
  try {
    const { invoiceNumber, partyName, date, amount, paymentMethod, notes } = req.body;

    if (!invoiceNumber || !amount || !paymentMethod) {
      return res.status(400).json({ error: "Invoice Number, Amount, and Method are required" });
    }

    // 1. Create the statement entry
    const newStatement = new Statement({
      invoiceNumber,
      partyName,
      date: date || new Date(),
      amount: Number(amount),
      paymentMethod,
      notes
    });
    await newStatement.save();

    // 2. Update the linked Invoice's paidAmount
    const invoice = await Invoice.findOne({ invoiceNumber });
    if (invoice) {
      invoice.paidAmount = (invoice.paidAmount || 0) + Number(amount);
      await invoice.save();
      console.log(`✅ Invoice ${invoiceNumber} updated. New Paid Amount: ${invoice.paidAmount}`);
    }

    res.status(201).json(newStatement);
  } catch (err) {
    console.error("❌ Statement Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/statements/:id
router.delete('/:id', async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id);
    if (!statement) return res.status(404).json({ error: "Statement not found" });

    // Deduct from Invoice before deleting
    const invoice = await Invoice.findOne({ invoiceNumber: statement.invoiceNumber });
    if (invoice) {
      invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - statement.amount);
      await invoice.save();
    }

    await Statement.findByIdAndDelete(req.params.id);
    res.json({ message: "Statement deleted and invoice updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

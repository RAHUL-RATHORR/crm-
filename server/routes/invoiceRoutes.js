import express from 'express';
const router = express.Router();
import Invoice from '../models/Invoice.js';
import DeletedItem from '../models/DeletedItem.js';

// POST /api/invoice - Create or Update Invoice
router.post('/', async (req, res) => {
  try {
    const { invoiceNumber, paymentType, vehicleNo, state, stateCode, freight } = req.body;
    const payload = {
      ...req.body,
      paymentType: paymentType != null ? String(paymentType) : '',
      vehicleNo: vehicleNo != null ? String(vehicleNo) : '',
      state: state != null ? String(state) : 'Rajasthan',
      stateCode: stateCode != null ? String(stateCode) : '08',
      freight: Number(freight) || 0,
    };

    let invoice;
    if (invoiceNumber) {
       invoice = await Invoice.findOneAndUpdate(
        { invoiceNumber },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      invoice = new Invoice(payload);
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

// UPDATE /api/invoice/:id - Update Invoice Status / Fields
router.put('/:id', async (req, res) => {
  try {
    const updated = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Invoice not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/invoice/:id - Delete an Invoice
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Invoice.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Invoice not found" });
    await DeletedItem.create({
      originalId: doc._id,
      collectionName: 'Invoice',
      itemName: doc.invoiceNumber || 'Unknown Invoice',
      itemType: 'Invoice',
      documentData: doc.toObject()
    });
    const result = await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

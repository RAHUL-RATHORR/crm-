import express from 'express';
const router = express.Router();
import PaperStock from '../models/PaperStock.js';
import PaperStockTransaction from '../models/PaperStockTransaction.js';
import { logPaperStockTransaction } from '../utils/paperStockTransactions.js';
import { backfillPaperStockTransactionsIfEmpty } from '../utils/backfillPaperStockTransactions.js';
import { buildStockAddHistoryFallback, ensureStockAddTransactions } from '../utils/paperStockHistory.js';

// GET /api/paper-stock/transactions - Stock add/deduct history
router.get('/transactions', async (req, res) => {
  try {
    await backfillPaperStockTransactionsIfEmpty();
    const transactions = await PaperStockTransaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paper-stock/:id/transactions - Add history for one stock item
router.get('/:id/transactions', async (req, res) => {
  try {
    await backfillPaperStockTransactionsIfEmpty();

    const stock = await PaperStock.findById(req.params.id);
    if (!stock) return res.status(404).json({ error: 'Item not found' });

    await ensureStockAddTransactions(stock);

    let transactions = await PaperStockTransaction.find({
      paperStockId: stock._id,
      transactionType: 'add',
      note: { $not: /Restored from job card/i },
    }).sort({ createdAt: -1 });

    transactions = transactions.map((tx) => {
      const doc = tx.toObject();
      const note = String(doc.note || '').toLowerCase();
      const isStockAdd = note.includes('stock added') || note.includes('opening stock');
      if (!doc.challanNo && isStockAdd && stock.challanNo) {
        doc.challanNo = stock.challanNo;
      }
      if (!doc.invoiceNo && isStockAdd && stock.invoiceNo) {
        doc.invoiceNo = stock.invoiceNo;
      }
      return doc;
    });

    if (transactions.length === 0) {
      transactions = buildStockAddHistoryFallback(stock);
    }

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const { name, coverPartyName, coverName, innerPartyName, innerName, gsm, quantity, coverGSM, coverQuantity, coverPaperSize, innerGSM, innerQuantity, innerPaperSize, unit, description, lowStockThreshold, paperSource, challanNo, invoiceNo, entryDate } = req.body;
    
    const resolvedCoverName = (coverName || '').trim();
    const resolvedInnerName = (innerName || '').trim();
    const resolvedName = name?.trim()
      || [resolvedCoverName, resolvedInnerName].filter((value, index, arr) => value && arr.indexOf(value) === index).join(' / ')
      || 'Unnamed Paper';

    const newItem = new PaperStock({
      name: resolvedName,
      coverPartyName: (coverPartyName || '').trim(),
      coverName: resolvedCoverName || resolvedName,
      innerPartyName: (innerPartyName || '').trim(),
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
      paperSource: paperSource || 'Company paper',
      challanNo: (challanNo || '').trim(),
      invoiceNo: (invoiceNo || '').trim(),
      entryDate: entryDate ? new Date(entryDate) : undefined
    });

    await newItem.save();

    const entryTimestamp = entryDate ? new Date(entryDate) : undefined;

    if (Number(coverQuantity) > 0) {
      await logPaperStockTransaction({
        paperStockId: newItem._id,
        stockName: resolvedName,
        paperName: resolvedCoverName || resolvedName,
        paperType: 'cover',
        transactionType: 'add',
        quantity: Number(coverQuantity),
        partyName: (coverPartyName || '').trim(),
        paperSource: paperSource || 'Company paper',
        balanceAfter: Number(coverQuantity),
        note: 'Initial cover stock added',
        createdAt: entryTimestamp,
        challanNo: (challanNo || '').trim(),
        invoiceNo: (invoiceNo || '').trim(),
      });
    }

    if (Number(innerQuantity) > 0) {
      await logPaperStockTransaction({
        paperStockId: newItem._id,
        stockName: resolvedName,
        paperName: resolvedInnerName || resolvedName,
        paperType: 'inner',
        transactionType: 'add',
        quantity: Number(innerQuantity),
        partyName: (innerPartyName || '').trim(),
        paperSource: paperSource || 'Company paper',
        balanceAfter: Number(innerQuantity),
        note: 'Initial inner stock added',
        createdAt: entryTimestamp,
        challanNo: (challanNo || '').trim(),
        invoiceNo: (invoiceNo || '').trim(),
      });
    }

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/paper-stock/:id - Update stock item
router.put('/:id', async (req, res) => {
  try {
    const { name, coverPartyName, coverName, innerPartyName, innerName, gsm, quantity, coverGSM, coverQuantity, coverPaperSize, innerGSM, innerQuantity, innerPaperSize, unit, description, lowStockThreshold, paperSource, challanNo, invoiceNo, entryDate } = req.body;
    const resolvedCoverName = (coverName || '').trim();
    const resolvedInnerName = (innerName || '').trim();
    const resolvedName = name?.trim()
      || [resolvedCoverName, resolvedInnerName].filter((value, index, arr) => value && arr.indexOf(value) === index).join(' / ')
      || 'Unnamed Paper';

    const existing = await PaperStock.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Item not found" });

    const txnChallanNo = (challanNo || '').trim();
    const txnInvoiceNo = (invoiceNo || '').trim();

    const updated = await PaperStock.findByIdAndUpdate(
      req.params.id,
      {
        name: resolvedName,
        coverPartyName: (coverPartyName || '').trim(),
        coverName: resolvedCoverName || resolvedName,
        innerPartyName: (innerPartyName || '').trim(),
        innerName: resolvedInnerName || resolvedName,
        gsm, quantity, coverGSM, coverQuantity, coverPaperSize, innerGSM, innerQuantity, innerPaperSize, unit, description, lowStockThreshold, paperSource,
        challanNo: txnChallanNo || existing.challanNo || '',
        invoiceNo: txnInvoiceNo || existing.invoiceNo || '',
        entryDate: entryDate ? new Date(entryDate) : undefined,
        updatedAt: Date.now()
      },
      { new: true }
    );

    const coverAdded = Number(coverQuantity) - Number(existing.coverQuantity || 0);
    const innerAdded = Number(innerQuantity) - Number(existing.innerQuantity || 0);
    const entryTimestamp = entryDate ? new Date(entryDate) : undefined;

    if (coverAdded > 0) {
      await logPaperStockTransaction({
        paperStockId: updated._id,
        stockName: resolvedName,
        paperName: resolvedCoverName || resolvedName,
        paperType: 'cover',
        transactionType: 'add',
        quantity: coverAdded,
        partyName: (coverPartyName || '').trim(),
        paperSource: paperSource || existing.paperSource || 'Company paper',
        balanceAfter: Number(updated.coverQuantity || 0),
        note: 'Cover stock added',
        createdAt: entryTimestamp,
        challanNo: txnChallanNo,
        invoiceNo: txnInvoiceNo,
      });
    }

    if (innerAdded > 0) {
      await logPaperStockTransaction({
        paperStockId: updated._id,
        stockName: resolvedName,
        paperName: resolvedInnerName || resolvedName,
        paperType: 'inner',
        transactionType: 'add',
        quantity: innerAdded,
        partyName: (innerPartyName || '').trim(),
        paperSource: paperSource || existing.paperSource || 'Company paper',
        balanceAfter: Number(updated.innerQuantity || 0),
        note: 'Inner stock added',
        createdAt: entryTimestamp,
        challanNo: txnChallanNo,
        invoiceNo: txnInvoiceNo,
      });
    }

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

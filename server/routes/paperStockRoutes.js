import express from 'express';
const router = express.Router();
import PaperStock from '../models/PaperStock.js';
import PaperStockTransaction from '../models/PaperStockTransaction.js';
import DeletedItem from '../models/DeletedItem.js';
import { logPaperStockTransaction } from '../utils/paperStockTransactions.js';
import { syncTotalQuantity } from '../utils/paperStockDeduction.js';

// GET /api/paper-stock/transactions - Stock add/deduct history
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await PaperStockTransaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/paper-stock/transactions - Clear all transaction history
router.delete('/transactions', async (req, res) => {
  try {
    const result = await PaperStockTransaction.deleteMany({});
    res.json({ message: 'All transaction history cleared', deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/paper-stock/transactions/:transactionId - Delete one history entry
router.delete('/transactions/:transactionId', async (req, res) => {
  try {
    const txn = await PaperStockTransaction.findById(req.params.transactionId);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const stock = txn.paperStockId ? await PaperStock.findById(txn.paperStockId) : null;
    const qty = Number(txn.quantity) || 0;

    if (stock && qty > 0) {
      if (txn.transactionType === 'add') {
        if (txn.paperType === 'cover') {
          stock.coverQuantity = Math.max(0, (Number(stock.coverQuantity) || 0) - qty);
        } else {
          stock.innerQuantity = Math.max(0, (Number(stock.innerQuantity) || 0) - qty);
        }
      } else if (txn.transactionType === 'deduct') {
        if (txn.paperType === 'cover') {
          stock.coverQuantity = (Number(stock.coverQuantity) || 0) + qty;
        } else {
          stock.innerQuantity = (Number(stock.innerQuantity) || 0) + qty;
        }
      }
      syncTotalQuantity(stock);
      stock.updatedAt = Date.now();
      await stock.save();
    }

    await txn.deleteOne();
    res.json({ message: 'Transaction deleted', stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paper-stock/deletions - Recently deleted paper stock items
router.get('/deletions', async (req, res) => {
  try {
    const deletions = await PaperStockTransaction.find({ transactionType: 'deleted_item' })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(deletions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paper-stock/:id/transactions - Add history for one stock item
router.get('/:id/transactions', async (req, res) => {
  try {
    const stock = await PaperStock.findById(req.params.id);
    if (!stock) return res.status(404).json({ error: 'Item not found' });

    let transactions = await PaperStockTransaction.find({
      paperStockId: stock._id,
      transactionType: 'add',
      note: { $not: /Restored from job card/i },
    }).sort({ createdAt: -1 });

    res.json(transactions.map((tx) => tx.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paper-stock - Get all stock items
router.get('/', async (req, res) => {
  try {
    const stock = await PaperStock.find().sort({ updatedAt: -1, createdAt: -1 });
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

    const now = new Date();
    const entryDay = entryDate ? new Date(entryDate) : now;

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
        createdAt: now,
        entryDate: entryDay,
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
        createdAt: now,
        entryDate: entryDay,
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
        ...(txnChallanNo ? { challanNo: txnChallanNo } : {}),
        ...(txnInvoiceNo ? { invoiceNo: txnInvoiceNo } : {}),
        entryDate: entryDate ? new Date(entryDate) : undefined,
        updatedAt: Date.now()
      },
      { new: true }
    );

    const coverAdded = Number(coverQuantity) - Number(existing.coverQuantity || 0);
    const innerAdded = Number(innerQuantity) - Number(existing.innerQuantity || 0);
    const now = new Date();
    const entryDay = entryDate ? new Date(entryDate) : now;

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
        createdAt: now,
        entryDate: entryDay,
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
        createdAt: now,
        entryDate: entryDay,
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
    const doc = await PaperStock.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Paper stock not found' });
    }
    await DeletedItem.create({
      originalId: doc._id,
      collectionName: 'PaperStock',
      itemName: `${doc.paperBrand || ''} ${doc.paperSize || ''} ${doc.paperGsm || ''}`.trim() || 'Unknown Stock',
      itemType: 'Paper Stock',
      documentData: doc.toObject()
    });
    const deleted = await PaperStock.findByIdAndDelete(req.params.id);

    // Log deletion so it appears in Recent Deletions
    await PaperStockTransaction.create({
      paperStockId: deleted._id,
      stockName: deleted.name,
      paperName: deleted.name,
      paperType: 'cover',
      transactionType: 'deleted_item',
      quantity: Number(deleted.coverQuantity || 0) + Number(deleted.innerQuantity || 0),
      partyName: deleted.coverPartyName || deleted.innerPartyName || '',
      note: `Item deleted – Cover: ${deleted.coverQuantity || 0}, Inner: ${deleted.innerQuantity || 0}`,
      balanceAfter: 0,
      createdAt: new Date(),
    });

    await PaperStockTransaction.deleteMany({ paperStockId: deleted._id, transactionType: { $ne: 'deleted_item' } });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;

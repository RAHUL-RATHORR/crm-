import express from 'express';
const router = express.Router();
import PaperStock from '../models/PaperStock.js';
import PaperStockTransaction from '../models/PaperStockTransaction.js';
import DeletedItem from '../models/DeletedItem.js';
import { logPaperStockTransaction } from '../utils/paperStockTransactions.js';
import { syncTotalQuantity } from '../utils/paperStockDeduction.js';
import { ensureStockAddTransactions, buildStockAddHistoryFallback } from '../utils/paperStockHistory.js';

// GET /api/paper-stock/transactions - Stock add/deduct history
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await PaperStockTransaction.find({
      transactionType: { $in: ['add', 'deduct'] },
    }).sort({ createdAt: -1 }).maxTimeMS(8000);
    res.json(transactions);
  } catch (err) {
    console.error('transactions GET error:', err.message);
    res.status(500).json({ error: 'Database timeout or error' });
  }
});

// Route removed to prevent accidental data wipe
// DELETE /api/paper-stock/transactions

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

    if (stock) {
      const remainingTxns = await PaperStockTransaction.find({
        $or: [
          { paperStockId: stock._id },
          { stockName: stock.name, paperSource: stock.paperSource || 'Company paper', paperStockId: { $exists: false } }
        ],
        paperType: txn.paperType,
        transactionType: { $in: ['add', 'deduct'] }
      }).sort({ createdAt: -1 });

      if (remainingTxns.length > 0) {
        remainingTxns[0].balanceAfter = txn.paperType === 'cover' ? stock.coverQuantity : stock.innerQuantity;
        await remainingTxns[0].save();
      }
    }

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

    // If add/opening records are missing but current stock exists,
    // create opening "add" history so UI modal doesn't show empty.
    try {
      await ensureStockAddTransactions(stock);
    } catch (backfillErr) {
      console.error('ensureStockAddTransactions failed:', backfillErr.message);
    }

    let transactions = await PaperStockTransaction.find({
      paperStockId: stock._id,
      transactionType: 'add',
      note: { $not: /Restored from job card/i },
    }).sort({ createdAt: -1 });

    if (!transactions.length) {
      return res.json(buildStockAddHistoryFallback(stock));
    }

    res.json(transactions.map((tx) => tx.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paper-stock/:id/ledger - Full transaction ledger for one stock item
router.get('/:id/ledger', async (req, res) => {
  try {
    const stock = await PaperStock.findById(req.params.id);
    if (!stock) return res.status(404).json({ error: 'Item not found' });

    // Try to ensure backfill exists so opening balance is visible
    try {
      await ensureStockAddTransactions(stock);
    } catch (backfillErr) {
      console.error('ensureStockAddTransactions failed:', backfillErr.message);
    }

    const transactions = await PaperStockTransaction.find({
      paperStockId: stock._id,
    }).sort({ createdAt: -1 });

    if (!transactions.length) {
      return res.json(buildStockAddHistoryFallback(stock));
    }

    res.json(transactions.map((tx) => tx.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/paper-stock - Get all stock items (always synchronized with the latest ledger balanceAfter)
router.get('/', async (req, res) => {
  try {
    const stockList = await PaperStock.find().sort({ updatedAt: -1, createdAt: -1 }).maxTimeMS(8000);

    // Ensure all items have opening transactions BEFORE we sync balances,
    // otherwise legacy imported stock without transactions will be wiped out to 0!
    for (const stock of stockList) {
      try {
        await ensureStockAddTransactions(stock);
      } catch (err) {
        console.error('ensureStockAddTransactions failed for', stock._id, err.message);
      }
    }

    const stockIds = stockList.map(s => s._id);
    const stockNames = stockList.map(s => s.name);

    const recentTxns = await PaperStockTransaction.find({
      $or: [
        { paperStockId: { $in: stockIds } },
        { stockName: { $in: stockNames } }
      ],
      transactionType: { $in: ['add', 'deduct'] }
    }).sort({ createdAt: -1 });

    const syncedList = await Promise.all(stockList.map(async (stock) => {
      const stockTxns = recentTxns.filter(t => {
        if (t.paperStockId) {
          return String(t.paperStockId) === String(stock._id);
        }
        return t.stockName === stock.name && t.paperSource === (stock.paperSource || 'Company paper');
      });

      // Sort OLD to NEW for sequential calculation
      stockTxns.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      let currentCover = 0;
      let currentInner = 0;

      for (const txn of stockTxns) {
        const qty = Number(txn.quantity) || 0;
        if (txn.paperType === 'cover') {
          if (txn.transactionType === 'add') currentCover += qty;
          else if (txn.transactionType === 'deduct') currentCover = Math.max(0, currentCover - qty);
        } else if (txn.paperType === 'inner') {
          if (txn.transactionType === 'add') currentInner += qty;
          else if (txn.transactionType === 'deduct') currentInner = Math.max(0, currentInner - qty);
        }
      }

      let changed = false;
      if (Number(stock.coverQuantity) !== currentCover) {
        stock.coverQuantity = currentCover;
        changed = true;
      }
      if (Number(stock.innerQuantity) !== currentInner) {
        stock.innerQuantity = currentInner;
        changed = true;
      }
      
      const nextTotal = currentCover + currentInner;
      if (Number(stock.quantity) !== nextTotal) {
        stock.quantity = nextTotal;
        changed = true;
      }

      if (changed) {
        await stock.save().catch(e => console.error('Auto-sync save failed:', e.message));
      }

      return stock;
    }));

    res.json(syncedList);
  } catch (err) {
    console.error('paper-stock GET error:', err.message);
    res.status(500).json({ error: 'Database timeout or error' });
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

    if (coverAdded !== 0) {
      await logPaperStockTransaction({
        paperStockId: updated._id,
        stockName: resolvedName,
        paperName: resolvedCoverName || resolvedName,
        paperType: 'cover',
        transactionType: coverAdded > 0 ? 'add' : 'deduct',
        quantity: Math.abs(coverAdded),
        partyName: (coverPartyName || '').trim(),
        paperSource: paperSource || existing.paperSource || 'Company paper',
        balanceAfter: Number(updated.coverQuantity || 0),
        note: coverAdded > 0 ? 'Cover stock added (manual edit)' : 'Cover stock deducted (manual edit)',
        createdAt: now,
        entryDate: entryDay,
        challanNo: txnChallanNo,
        invoiceNo: txnInvoiceNo,
      });
    }

    if (innerAdded !== 0) {
      await logPaperStockTransaction({
        paperStockId: updated._id,
        stockName: resolvedName,
        paperName: resolvedInnerName || resolvedName,
        paperType: 'inner',
        transactionType: innerAdded > 0 ? 'add' : 'deduct',
        quantity: Math.abs(innerAdded),
        partyName: (innerPartyName || '').trim(),
        paperSource: paperSource || existing.paperSource || 'Company paper',
        balanceAfter: Number(updated.innerQuantity || 0),
        note: innerAdded > 0 ? 'Inner stock added (manual edit)' : 'Inner stock deducted (manual edit)',
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
      itemName: `${doc.paperBrand || ''} ${doc.paperSize || ''} ${doc.paperGsm || ''}`.trim() || doc.name || 'Unknown Stock',
      itemType: 'Paper Stock',
      documentData: doc.toObject()
    });
    const deleted = await PaperStock.findByIdAndDelete(req.params.id);

    // Remove this stock's history using exact ID to prevent wiping other items with same name
    await PaperStockTransaction.deleteMany({
      paperStockId: deleted._id
    });

    // Keep a short audit entry for Settings → Recently Deleted
    await PaperStockTransaction.create({
      paperStockId: deleted._id,
      stockName: deleted.name,
      paperName: deleted.name,
      paperType: 'cover',
      transactionType: 'deleted_item',
      quantity: Number(deleted.coverQuantity || 0) + Number(deleted.innerQuantity || 0),
      partyName: deleted.coverPartyName || deleted.innerPartyName || '',
      paperSource: deleted.paperSource || 'Company paper',
      note: `Item deleted – Cover: ${deleted.coverQuantity || 0}, Inner: ${deleted.innerQuantity || 0}`,
      balanceAfter: 0,
      createdAt: new Date(),
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PATCH /api/paper-stock/:id/set-quantity — set stock quantity directly and log transaction
router.patch('/:id/set-quantity', async (req, res) => {
  try {
    const { coverQuantity, innerQuantity } = req.body;
    const doc = await PaperStock.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const now = new Date();
    if (coverQuantity !== undefined) {
      const newCover = Number(coverQuantity);
      const diff = newCover - (Number(doc.coverQuantity) || 0);
      doc.coverQuantity = newCover;
      if (diff !== 0) {
        await logPaperStockTransaction({
          paperStockId: doc._id,
          stockName: doc.name,
          paperName: doc.coverName || doc.name,
          paperType: 'cover',
          transactionType: diff > 0 ? 'add' : 'deduct',
          quantity: Math.abs(diff),
          paperSource: doc.paperSource || 'Company paper',
          balanceAfter: newCover,
          note: diff > 0 ? 'Stock adjusted (direct set)' : 'Stock reduced (direct set)',
          createdAt: now,
        });
      }
    }

    if (innerQuantity !== undefined) {
      const newInner = Number(innerQuantity);
      const diff = newInner - (Number(doc.innerQuantity) || 0);
      doc.innerQuantity = newInner;
      if (diff !== 0) {
        await logPaperStockTransaction({
          paperStockId: doc._id,
          stockName: doc.name,
          paperName: doc.innerName || doc.name,
          paperType: 'inner',
          transactionType: diff > 0 ? 'add' : 'deduct',
          quantity: Math.abs(diff),
          paperSource: doc.paperSource || 'Company paper',
          balanceAfter: newInner,
          note: diff > 0 ? 'Stock adjusted (direct set)' : 'Stock reduced (direct set)',
          createdAt: now,
        });
      }
    }

    syncTotalQuantity(doc);
    doc.updatedAt = Date.now();
    await doc.save();
    return res.json({ coverQuantity: doc.coverQuantity, innerQuantity: doc.innerQuantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

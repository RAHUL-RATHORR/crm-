import PaperStock from '../models/PaperStock.js';
import JobCard from '../models/JobCard.js';
import PaperStockTransaction from '../models/PaperStockTransaction.js';
import { logPaperStockTransaction } from './paperStockTransactions.js';

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseGsm = (value) => {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : NaN;
};

export const parseQty = (value) => {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
};

export const syncTotalQuantity = (stockItem) => {
  stockItem.quantity = Math.max(
    0,
    (Number(stockItem.coverQuantity) || 0) + (Number(stockItem.innerQuantity) || 0)
  );
};

export const getCoverUsage = (job) => {
  const usages = getCoverUsages(job);
  return usages[0] || null;
};

export const getInnerUsage = (job) => {
  const usages = getInnerUsages(job);
  return usages[0] || null;
};

export const getCoverUsages = (job) => {
  if (!job) return [];

  const paperSource = job.paperSource || 'Company paper';
  const fallbackQty = parseQty(job.jobQty);

  if (Array.isArray(job.coverPaperLines) && job.coverPaperLines.length) {
    return job.coverPaperLines
      .filter((line) => {
        const paper = String(line?.paper || '').trim();
        return paper && paper !== 'Custom';
      })
      .map((line) => ({
        paper: String(line.paper).trim(),
        paperGSM: String(line.paperGSM || ''),
        qty: Number(line.count) > 0 ? Number(line.count) : fallbackQty,
        paperSource,
        stockId: line.stockId,
      }))
      .filter((usage) => usage.qty > 0);
  }

  if (!job.paper || String(job.paper).trim() === 'Custom') return [];
  const qty = Number(job.coverPaperCount) > 0 ? Number(job.coverPaperCount) : fallbackQty;
  if (qty <= 0) return [];
  return [{
    paper: job.paper,
    paperGSM: String(job.paperGSM),
    qty,
    paperSource,
  }];
};

export const getInnerUsages = (job) => {
  if (!job) return [];

  const paperSource = job.paperSource || 'Company paper';
  const fallbackQty = parseQty(job.jobQty);

  if (Array.isArray(job.innerPaperLines) && job.innerPaperLines.length) {
    return job.innerPaperLines
      .filter((line) => {
        const paper = String(line?.paper || '').trim();
        return paper && paper !== 'Custom';
      })
      .map((line) => ({
        paper: String(line.paper).trim(),
        paperGSM: String(line.paperGSM || ''),
        qty: Number(line.count) > 0 ? Number(line.count) : fallbackQty,
        paperSource,
        stockId: line.stockId,
      }))
      .filter((usage) => usage.qty > 0);
  }

  if (!job.innerPaper || String(job.innerPaper).trim() === 'Custom') return [];
  const qty = Number(job.innerPaperCount) > 0 ? Number(job.innerPaperCount) : fallbackQty;
  if (qty <= 0) return [];
  return [{
    paper: job.innerPaper,
    paperGSM: String(job.innerPaperGSM),
    qty,
    paperSource,
  }];
};

export const findCoverStock = async (paper, paperSource = 'Company paper', paperGSM, stockId) => {
  if (stockId) {
    const exactStock = await PaperStock.findById(stockId);
    if (exactStock) return exactStock;
  }
  if (!paper || paper === 'Custom') return null;
  const escaped = escapeRegex(paper.trim());
  const nameFilter = {
    $or: [
      { coverName: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      { name: { $regex: new RegExp(`^${escaped}\\s*/`, 'i') } },
    ],
    paperSource,
  };

  const candidates = await PaperStock.find(nameFilter);
  if (!candidates.length) {
    console.warn(`🔍 findCoverStock MISS: paper="${paper}", source="${paperSource}"`);
    return null;
  }
  if (candidates.length === 1) return candidates[0];

  const gsm = parseGsm(paperGSM);
  if (Number.isFinite(gsm)) {
    const exact = candidates.find((s) => parseGsm(s.coverGSM) === gsm || parseGsm(s.gsm) === gsm);
    if (exact) return exact;
  }
  return candidates[0];
};

export const findInnerStock = async (paper, paperSource = 'Company paper', paperGSM, stockId) => {
  if (stockId) {
    const exactStock = await PaperStock.findById(stockId);
    if (exactStock) return exactStock;
  }
  if (!paper || paper === 'Custom') return null;
  const escaped = escapeRegex(paper.trim());
  const nameFilter = {
    $or: [
      { innerName: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
      { name: { $regex: new RegExp(`/\\s*${escaped}$`, 'i') } },
    ],
    paperSource,
  };

  const candidates = await PaperStock.find(nameFilter);
  if (!candidates.length) {
    console.warn(`🔍 findInnerStock MISS: paper="${paper}", source="${paperSource}"`);
    return null;
  }
  if (candidates.length === 1) return candidates[0];

  const gsm = parseGsm(paperGSM);
  if (Number.isFinite(gsm)) {
    const exact = candidates.find((s) => parseGsm(s.innerGSM) === gsm || parseGsm(s.gsm) === gsm);
    if (exact) return exact;
  }
  return candidates[0];
};

const gsmMatchesCover = (stockItem, paperGSM) => {
  const gsm = parseGsm(paperGSM);
  const coverGsm = parseGsm(stockItem.coverGSM);
  const legacyGsm = parseGsm(stockItem.gsm);
  if (!Number.isFinite(gsm)) return true;
  if (Number.isFinite(coverGsm) && coverGsm === gsm) return true;
  if (Number.isFinite(legacyGsm) && legacyGsm === gsm) return true;
  if (!Number.isFinite(coverGsm) && !Number.isFinite(legacyGsm)) return true;
  return false;
};

const gsmMatchesInner = (stockItem, paperGSM) => {
  const gsm = parseGsm(paperGSM);
  const innerGsm = parseGsm(stockItem.innerGSM);
  const legacyGsm = parseGsm(stockItem.gsm);
  if (!Number.isFinite(gsm)) return true;
  if (Number.isFinite(innerGsm) && innerGsm === gsm) return true;
  if (Number.isFinite(legacyGsm) && legacyGsm === gsm) return true;
  if (!Number.isFinite(innerGsm) && !Number.isFinite(legacyGsm)) return true;
  return false;
};

export const jobHadStockDeduction = async (jobCardId) => {
  if (!jobCardId) return false;
  return !!(await PaperStockTransaction.findOne({ jobCardId, transactionType: 'deduct' }));
};

export const applyCoverDelta = async (paper, paperGSM, delta, meta = {}) => {
  if (!paper || !delta) return;
  const paperSource = meta.paperSource || 'Company paper';
  const stockItem = await findCoverStock(paper, paperSource, paperGSM, meta.stockId);
  if (!stockItem) {
    console.warn(`⚠️ Cover stock not found: paper="${paper}", source=${paperSource}`);
    return;
  }
  if (!gsmMatchesCover(stockItem, paperGSM)) {
    console.warn(`⚠️ Cover stock GSM mismatch: job=${paperGSM}, stock cover=${stockItem.coverGSM}, legacy=${stockItem.gsm}, paper=${paper}, source=${paperSource}`);
    return;
  }

  const coverGsm = parseGsm(stockItem.coverGSM);
  let balanceAfter = 0;

  if (Number.isFinite(coverGsm)) {
    stockItem.coverQuantity = Math.max(0, (stockItem.coverQuantity || 0) - delta);
    balanceAfter = stockItem.coverQuantity;
  } else {
    stockItem.quantity = Math.max(0, (stockItem.quantity || 0) - delta);
    balanceAfter = stockItem.quantity;
  }

  syncTotalQuantity(stockItem);
  await stockItem.save();
  console.log(`📦 Cover stock adjusted: ${paper} (${paperGSM}) delta ${delta}, remaining cover=${stockItem.coverQuantity}, total=${stockItem.quantity}`);

  await logPaperStockTransaction({
    paperStockId: stockItem._id,
    stockName: stockItem.name,
    paperName: paper,
    paperType: 'cover',
    transactionType: delta > 0 ? 'deduct' : 'add',
    quantity: Math.abs(delta),
    partyName: meta.partyName || '',
    jobNumber: meta.jobNumber || '',
    jobCardId: meta.jobCardId,
    paperSource: stockItem.paperSource || 'Company paper',
    balanceAfter,
    note: meta.note || (delta > 0 ? 'Deducted for job card' : 'Restored from job card update'),
  });
};

export const applyInnerDelta = async (paper, paperGSM, delta, meta = {}) => {
  if (!paper || !delta) return;
  const paperSource = meta.paperSource || 'Company paper';
  const stockItem = await findInnerStock(paper, paperSource, paperGSM, meta.stockId);
  if (!stockItem) {
    console.warn(`⚠️ Inner stock not found: paper="${paper}", source=${paperSource}`);
    return;
  }
  if (!gsmMatchesInner(stockItem, paperGSM)) {
    console.warn(`⚠️ Inner stock GSM mismatch: job=${paperGSM}, stock inner=${stockItem.innerGSM}, legacy=${stockItem.gsm}, paper=${paper}, source=${paperSource}`);
    return;
  }

  stockItem.innerQuantity = Math.max(0, (stockItem.innerQuantity || 0) - delta);
  syncTotalQuantity(stockItem);
  await stockItem.save();
  console.log(`📦 Inner stock adjusted: ${paper} (${paperGSM}) delta ${delta}, remaining inner=${stockItem.innerQuantity}, total=${stockItem.quantity}`);

  await logPaperStockTransaction({
    paperStockId: stockItem._id,
    stockName: stockItem.name,
    paperName: paper,
    paperType: 'inner',
    transactionType: delta > 0 ? 'deduct' : 'add',
    quantity: Math.abs(delta),
    partyName: meta.partyName || '',
    jobNumber: meta.jobNumber || '',
    jobCardId: meta.jobCardId,
    paperSource: stockItem.paperSource || 'Company paper',
    balanceAfter: stockItem.innerQuantity,
    note: meta.note || (delta > 0 ? 'Deducted for job card' : 'Restored from job card update'),
  });
};

export const validateStockForJobChange = async (previousJob, newBody) => {
  const shouldRestore = previousJob?._id && await jobHadStockDeduction(previousJob._id);
  
  const oldCoverUsages = shouldRestore ? getCoverUsages(previousJob) : [];
  const oldInnerUsages = shouldRestore ? getInnerUsages(previousJob) : [];
  const newCoverUsages = getCoverUsages(newBody);
  const newInnerUsages = getInnerUsages(newBody);

  const getUsageKey = (u) => u.stockId ? String(u.stockId) : `${String(u.paper).trim()}|${String(u.paperGSM).trim()}|${u.paperSource}`;

  const calculateNet = (oldU, newU) => {
    const map = {};
    for (const u of oldU) {
      const key = getUsageKey(u);
      if (!map[key]) map[key] = { ...u, qty: 0 };
      map[key].qty -= u.qty;
    }
    for (const u of newU) {
      const key = getUsageKey(u);
      if (!map[key]) map[key] = { ...u, qty: 0 };
      map[key].qty += u.qty;
    }
    return Object.values(map).filter(u => u.qty > 0); // Only care about positive net usage (deduction)
  };

  const netCover = calculateNet(oldCoverUsages, newCoverUsages);
  const netInner = calculateNet(oldInnerUsages, newInnerUsages);

  for (const usage of netCover) {
    const paperSource = usage.paperSource || 'Company paper';
    const stockItem = await findCoverStock(usage.paper, paperSource, usage.paperGSM, usage.stockId);
    if (!stockItem || !gsmMatchesCover(stockItem, usage.paperGSM)) {
      return `Insufficient Stock: Cover paper '${usage.paper}' (${usage.paperGSM || 'N/A'} GSM) not found in stock. Required: ${usage.qty} Sheets. Please add stock first.`;
    }
    const avail = Number(stockItem.coverQuantity) || 0;
    if (avail < usage.qty) {
      return `Insufficient Stock: Not enough Cover paper '${usage.paper}' (${usage.paperGSM || 'N/A'} GSM). Required: ${usage.qty}, Available: ${avail}. Please add stock first.`;
    }
  }

  for (const usage of netInner) {
    const paperSource = usage.paperSource || 'Company paper';
    const stockItem = await findInnerStock(usage.paper, paperSource, usage.paperGSM, usage.stockId);
    if (!stockItem || !gsmMatchesInner(stockItem, usage.paperGSM)) {
      return `Insufficient Stock: Inner paper '${usage.paper}' (${usage.paperGSM || 'N/A'} GSM) not found in stock. Required: ${usage.qty} Sheets. Please add stock first.`;
    }
    const avail = Number(stockItem.innerQuantity) || 0;
    if (avail < usage.qty) {
      return `Insufficient Stock: Not enough Inner paper '${usage.paper}' (${usage.paperGSM || 'N/A'} GSM). Required: ${usage.qty}, Available: ${avail}. Please add stock first.`;
    }
  }

  return null; // Validation passed
};

export const syncStockFromJobChange = async (previousJob, newBody) => {
  const shouldRestore = previousJob?._id && await jobHadStockDeduction(previousJob._id);
  
  const oldCoverUsages = shouldRestore ? getCoverUsages(previousJob) : [];
  const oldInnerUsages = shouldRestore ? getInnerUsages(previousJob) : [];
  const newCoverUsages = getCoverUsages(newBody);
  const newInnerUsages = getInnerUsages(newBody);

  const getUsageKey = (u) => u.stockId ? String(u.stockId) : `${String(u.paper).trim()}|${String(u.paperGSM).trim()}|${u.paperSource}`;

  const calculateNet = (oldU, newU) => {
    const map = {};
    for (const u of oldU) {
      const key = getUsageKey(u);
      if (!map[key]) map[key] = { ...u, qty: 0 };
      map[key].qty -= u.qty;
    }
    for (const u of newU) {
      const key = getUsageKey(u);
      if (!map[key]) map[key] = { ...u, qty: 0 };
      map[key].qty += u.qty;
    }
    return Object.values(map).filter(u => u.qty !== 0);
  };

  const netCover = calculateNet(oldCoverUsages, newCoverUsages);
  const netInner = calculateNet(oldInnerUsages, newInnerUsages);

  console.log('📦 syncStock: oldCover=', JSON.stringify(oldCoverUsages));
  console.log('📦 syncStock: newCover=', JSON.stringify(newCoverUsages));
  console.log('📦 syncStock: netCover=', JSON.stringify(netCover));
  console.log('📦 syncStock: netInner=', JSON.stringify(netInner));

  for (const usage of netCover) {
    await applyCoverDelta(usage.paper, usage.paperGSM, usage.qty, {
      paperSource: usage.paperSource,
      partyName: newBody.partyName || newBody.companyName || '',
      jobNumber: newBody.jobNumber || '',
      jobCardId: newBody._id,
      stockId: usage.stockId,
      note: usage.qty > 0 ? 'Deducted for job card update' : 'Restored from job card update',
    });
  }

  for (const usage of netInner) {
    await applyInnerDelta(usage.paper, usage.paperGSM, usage.qty, {
      paperSource: usage.paperSource,
      partyName: newBody.partyName || newBody.companyName || '',
      jobNumber: newBody.jobNumber || '',
      jobCardId: newBody._id,
      stockId: usage.stockId,
      note: usage.qty > 0 ? 'Deducted for job card update' : 'Restored from job card update',
    });
  }
};

const normalize = (value) => String(value || '').trim().toLowerCase();

const matchesPaperName = (stock, paperName, paperType) => {
  const target = normalize(paperName);
  if (!target) return false;
  const names = paperType === 'cover'
    ? [stock.coverName, stock.name]
    : [stock.innerName, stock.name];
  return names.some((name) => normalize(name) === target);
};

const isStockAddNote = (note = '') => {
  const text = String(note).toLowerCase();
  return text.includes('stock added') || text.includes('opening stock');
};

export const syncStockFromLedger = async () => {
  const stocks = await PaperStock.find();
  let updated = 0;

  for (const stock of stocks) {
    const txns = await PaperStockTransaction.find({
      $or: [
        { paperStockId: stock._id },
        { stockName: stock.name, paperSource: stock.paperSource || 'Company paper', paperStockId: { $exists: false } },
      ],
      transactionType: { $in: ['add', 'deduct'] },
    }).sort({ createdAt: 1 }); // Sort OLD to NEW for sequential calculation

    let currentCover = 0;
    let currentInner = 0;

    for (const txn of txns) {
      const qty = Number(txn.quantity) || 0;
      if (txn.paperType === 'cover') {
        if (txn.transactionType === 'add') currentCover += qty;
        else if (txn.transactionType === 'deduct') currentCover = Math.max(0, currentCover - qty);
        
        if (txn.balanceAfter !== currentCover) {
          txn.balanceAfter = currentCover;
          await txn.save();
        }
      } else if (txn.paperType === 'inner') {
        if (txn.transactionType === 'add') currentInner += qty;
        else if (txn.transactionType === 'deduct') currentInner = Math.max(0, currentInner - qty);
        
        if (txn.balanceAfter !== currentInner) {
          txn.balanceAfter = currentInner;
          await txn.save();
        }
      }
    }

    let changed = false;

    if (stock.coverQuantity !== currentCover) {
      stock.coverQuantity = currentCover;
      changed = true;
    }

    if (stock.innerQuantity !== currentInner) {
      stock.innerQuantity = currentInner;
      changed = true;
    }

    const nextTotal = currentCover + currentInner;
    if (stock.quantity !== nextTotal) {
      stock.quantity = nextTotal;
      changed = true;
    }

    if (changed) {
      stock.updatedAt = Date.now();
      await stock.save();
      updated += 1;
      console.log(`📦 Synced ${stock.name} (${stock.paperSource || 'Company paper'}): cover ${stock.coverQuantity}, inner ${stock.innerQuantity}`);
    }
  }

  return updated;
};

// Backward-compatible alias
export const reconcilePaperStockFromJobs = syncStockFromLedger;

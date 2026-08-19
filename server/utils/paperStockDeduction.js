import PaperStock from '../models/PaperStock.js';
import JobCard from '../models/JobCard.js';
import PaperStockTransaction from '../models/PaperStockTransaction.js';
import { logPaperStockTransaction } from './paperStockTransactions.js';

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseGsm = (value) => {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : NaN;
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
  const fallbackQty = Number(job.jobQty) || 0;

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
  const fallbackQty = Number(job.jobQty) || 0;

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

export const findCoverStock = async (paper, paperSource = 'Company paper', paperGSM) => {
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

export const findInnerStock = async (paper, paperSource = 'Company paper', paperGSM) => {
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
  const stockItem = await findCoverStock(paper, paperSource, paperGSM);
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
  const stockItem = await findInnerStock(paper, paperSource, paperGSM);
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

export const syncStockFromJobChange = async (previousJob, newBody) => {
  const oldCoverUsages = getCoverUsages(previousJob);
  const newCoverUsages = getCoverUsages(newBody);
  const oldInnerUsages = getInnerUsages(previousJob);
  const newInnerUsages = getInnerUsages(newBody);
  console.log(`📦 syncStock: newCoverUsages=${JSON.stringify(newCoverUsages)}, newInnerUsages=${JSON.stringify(newInnerUsages)}, oldCoverUsages=${JSON.stringify(oldCoverUsages)}, oldInnerUsages=${JSON.stringify(oldInnerUsages)}`);
  const shouldRestore = previousJob?._id && await jobHadStockDeduction(previousJob._id);

  if (shouldRestore) {
    for (const usage of oldCoverUsages) {
      await applyCoverDelta(usage.paper, usage.paperGSM, -usage.qty, {
        paperSource: usage.paperSource,
        partyName: previousJob?.partyName || previousJob?.companyName || '',
        jobNumber: previousJob?.jobNumber || '',
        jobCardId: previousJob?._id,
        note: 'Restored from job card update',
      });
    }
    for (const usage of oldInnerUsages) {
      await applyInnerDelta(usage.paper, usage.paperGSM, -usage.qty, {
        paperSource: usage.paperSource,
        partyName: previousJob?.partyName || previousJob?.companyName || '',
        jobNumber: previousJob?.jobNumber || '',
        jobCardId: previousJob?._id,
        note: 'Restored from job card update',
      });
    }
  }

  for (const usage of newCoverUsages) {
    await applyCoverDelta(usage.paper, usage.paperGSM, usage.qty, {
      paperSource: usage.paperSource,
      partyName: newBody.partyName || newBody.companyName || '',
      jobNumber: newBody.jobNumber || '',
      jobCardId: newBody._id,
      note: 'Deducted for job card',
    });
  }
  for (const usage of newInnerUsages) {
    await applyInnerDelta(usage.paper, usage.paperGSM, usage.qty, {
      paperSource: usage.paperSource,
      partyName: newBody.partyName || newBody.companyName || '',
      jobNumber: newBody.jobNumber || '',
      jobCardId: newBody._id,
      note: 'Deducted for job card',
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

export const reconcilePaperStockFromJobs = async () => {
  const stocks = await PaperStock.find();
  const jobs = await JobCard.find();
  let updated = 0;

  for (const stock of stocks) {
    const stockSource = stock.paperSource || 'Company paper';
    const txns = await PaperStockTransaction.find({
      paperStockId: stock._id,
      transactionType: 'add',
      note: { $not: /Restored from job card/i },
    });

    let coverAdded = 0;
    let innerAdded = 0;

    for (const txn of txns) {
      if (txn.paperType === 'cover') coverAdded += Number(txn.quantity) || 0;
      if (txn.paperType === 'inner') innerAdded += Number(txn.quantity) || 0;
    }

    if (coverAdded === 0 && innerAdded === 0) {
      coverAdded = Number(stock.coverQuantity) || 0;
      innerAdded = Number(stock.innerQuantity) || 0;
    }

    let coverUsed = 0;
    let innerUsed = 0;

    for (const job of jobs) {
      if ((job.paperSource || 'Company paper') !== stockSource) continue;

      const coverUsages = getCoverUsages(job);
      for (const cover of coverUsages) {
        if (matchesPaperName(stock, cover.paper, 'cover') && gsmMatchesCover(stock, cover.paperGSM)) {
          coverUsed += cover.qty;
        }
      }

      const innerUsages = getInnerUsages(job);
      for (const inner of innerUsages) {
        if (matchesPaperName(stock, inner.paper, 'inner') && gsmMatchesInner(stock, inner.paperGSM)) {
          innerUsed += inner.qty;
        }
      }
    }

    const nextCover = Math.max(0, coverAdded - coverUsed);
    const nextInner = Math.max(0, innerAdded - innerUsed);
    const nextTotal = nextCover + nextInner;

    if (
      nextCover !== (Number(stock.coverQuantity) || 0) ||
      nextInner !== (Number(stock.innerQuantity) || 0) ||
      nextTotal !== (Number(stock.quantity) || 0)
    ) {
      stock.coverQuantity = nextCover;
      stock.innerQuantity = nextInner;
      stock.quantity = nextTotal;
      await stock.save();
      updated += 1;
      console.log(`🔁 Reconciled ${stock.name} (${stockSource}): cover ${nextCover}, inner ${nextInner}`);
    }
  }

  return updated;
};

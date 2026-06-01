import PaperStock from '../models/PaperStock.js';
import PaperStockTransaction from '../models/PaperStockTransaction.js';
import JobCard from '../models/JobCard.js';
import { logPaperStockTransaction } from './paperStockTransactions.js';

const normalize = (value) => String(value || '').trim().toLowerCase();

const getCoverUsage = (job) => {
  if (!job || (job.paperSource || 'Company paper') !== 'Company paper' || !job.paper || !job.paperGSM) {
    return null;
  }
  const qty = Number(job.coverPaperCount) > 0 ? Number(job.coverPaperCount) : Number(job.jobQty) || 0;
  if (qty <= 0) return null;
  return { paper: job.paper, paperGSM: String(job.paperGSM), qty };
};

const getInnerUsage = (job) => {
  if (!job || (job.paperSource || 'Company paper') !== 'Company paper' || !job.innerPaper || !job.innerPaperGSM) {
    return null;
  }
  const qty = Number(job.innerPaperCount) || 0;
  if (qty <= 0) return null;
  return { paper: job.innerPaper, paperGSM: String(job.innerPaperGSM), qty };
};

const matchesPaperName = (stock, paperName, paperType) => {
  const target = normalize(paperName);
  if (!target) return false;

  const names = paperType === 'cover'
    ? [stock.coverName, stock.name]
    : [stock.innerName, stock.name];

  return names.some((name) => normalize(name) === target);
};

const sumCoverDeductions = (jobs, stock) => jobs.reduce((sum, job) => {
  const usage = getCoverUsage(job);
  if (!usage || !matchesPaperName(stock, usage.paper, 'cover')) return sum;
  return sum + usage.qty;
}, 0);

const sumInnerDeductions = (jobs, stock) => jobs.reduce((sum, job) => {
  const usage = getInnerUsage(job);
  if (!usage || !matchesPaperName(stock, usage.paper, 'inner')) return sum;
  return sum + usage.qty;
}, 0);

export const backfillPaperStockTransactionsIfEmpty = async () => {
  const existingCount = await PaperStockTransaction.countDocuments();
  if (existingCount > 0) return false;

  const [stocks, jobs] = await Promise.all([
    PaperStock.find().sort({ createdAt: 1 }),
    JobCard.find().sort({ createdAt: 1 }),
  ]);

  for (const stock of stocks) {
    const paperSource = stock.paperSource || 'Company paper';
    const stockName = stock.name || 'Unnamed Paper';
    const createdAt = stock.createdAt || new Date();
    const coverQty = Number(stock.coverQuantity) || 0;
    const innerQty = Number(stock.innerQuantity) || 0;
    const legacyQty = Number(stock.quantity) || 0;

    if (coverQty > 0 || innerQty > 0) {
      if (coverQty > 0) {
        const totalDeducted = sumCoverDeductions(jobs, stock);
        await logPaperStockTransaction({
          paperStockId: stock._id,
          stockName,
          paperName: stock.coverName || stockName,
          paperType: 'cover',
          transactionType: 'add',
          quantity: coverQty + totalDeducted,
          paperSource,
          balanceAfter: coverQty + totalDeducted,
          note: 'Opening stock (imported)',
          createdAt,
        });
      }

      if (innerQty > 0) {
        const totalDeducted = sumInnerDeductions(jobs, stock);
        await logPaperStockTransaction({
          paperStockId: stock._id,
          stockName,
          paperName: stock.innerName || stockName,
          paperType: 'inner',
          transactionType: 'add',
          quantity: innerQty + totalDeducted,
          paperSource,
          balanceAfter: innerQty + totalDeducted,
          note: 'Opening stock (imported)',
          createdAt,
        });
      }
    } else if (legacyQty > 0) {
      const totalDeducted = sumCoverDeductions(jobs, stock) + sumInnerDeductions(jobs, stock);
      await logPaperStockTransaction({
        paperStockId: stock._id,
        stockName,
        paperName: stockName,
        paperType: 'cover',
        transactionType: 'add',
        quantity: legacyQty + totalDeducted,
        paperSource,
        balanceAfter: legacyQty + totalDeducted,
        note: 'Opening stock (imported)',
        createdAt,
      });
    }
  }

  for (const job of jobs) {
    if ((job.paperSource || 'Company paper') !== 'Company paper') continue;

    const cover = getCoverUsage(job);
    if (cover) {
      await logPaperStockTransaction({
        stockName: cover.paper,
        paperName: cover.paper,
        paperType: 'cover',
        transactionType: 'deduct',
        quantity: cover.qty,
        partyName: job.partyName || job.companyName || '',
        jobNumber: job.jobNumber || '',
        jobCardId: job._id,
        paperSource: 'Company paper',
        balanceAfter: 0,
        note: 'Job card usage (imported)',
        createdAt: job.createdAt || job.updatedAt || new Date(),
      });
    }

    const inner = getInnerUsage(job);
    if (inner) {
      await logPaperStockTransaction({
        stockName: inner.paper,
        paperName: inner.paper,
        paperType: 'inner',
        transactionType: 'deduct',
        quantity: inner.qty,
        partyName: job.partyName || job.companyName || '',
        jobNumber: job.jobNumber || '',
        jobCardId: job._id,
        paperSource: 'Company paper',
        balanceAfter: 0,
        note: 'Job card usage (imported)',
        createdAt: job.createdAt || job.updatedAt || new Date(),
      });
    }
  }

  return true;
};

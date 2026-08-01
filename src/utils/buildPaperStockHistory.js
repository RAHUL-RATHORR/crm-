const normalize = (value) => String(value || '').trim().toLowerCase();

const getCoverUsages = (job) => {
  if (!job) return [];

  if (Array.isArray(job.coverPaperLines) && job.coverPaperLines.length) {
    return job.coverPaperLines
      .filter((line) => line?.paper && line.paperGSM)
      .map((line) => ({
        paper: line.paper,
        qty: Number(line.count) > 0 ? Number(line.count) : Number(job.jobQty) || 0,
      }))
      .filter((usage) => usage.qty > 0);
  }

  if (!job.paper || !job.paperGSM) return [];
  const qty = Number(job.coverPaperCount) > 0 ? Number(job.coverPaperCount) : Number(job.jobQty) || 0;
  if (qty <= 0) return [];
  return [{ paper: job.paper, qty }];
};

const getInnerUsages = (job) => {
  if (!job) return [];

  if (Array.isArray(job.innerPaperLines) && job.innerPaperLines.length) {
    return job.innerPaperLines
      .filter((line) => line?.paper && line.paperGSM)
      .map((line) => ({
        paper: line.paper,
        qty: Number(line.count) > 0 ? Number(line.count) : Number(job.jobQty) || 0,
      }))
      .filter((usage) => usage.qty > 0);
  }

  if (!job.innerPaper || !job.innerPaperGSM) return [];
  const qty = Number(job.innerPaperCount) > 0 ? Number(job.innerPaperCount) : Number(job.jobQty) || 0;
  if (qty <= 0) return [];
  return [{ paper: job.innerPaper, qty }];
};

const matchesPaperSource = (job, stock) =>
  (job.paperSource || 'Company paper') === (stock.paperSource || 'Company paper');

const matchesPaperName = (stock, paperName, paperType) => {
  const target = normalize(paperName);
  if (!target) return false;
  const names = paperType === 'cover'
    ? [stock.coverName, stock.name]
    : [stock.innerName, stock.name];
  return names.some((name) => normalize(name) === target);
};

const sumCoverDeductions = (jobs, stock) => jobs.reduce((sum, job) => {
  if (!matchesPaperSource(job, stock)) return sum;
  return sum + getCoverUsages(job).reduce((lineSum, usage) => (
    matchesPaperName(stock, usage.paper, 'cover') ? lineSum + usage.qty : lineSum
  ), 0);
}, 0);

const sumInnerDeductions = (jobs, stock) => jobs.reduce((sum, job) => {
  if (!matchesPaperSource(job, stock)) return sum;
  return sum + getInnerUsages(job).reduce((lineSum, usage) => (
    matchesPaperName(stock, usage.paper, 'inner') ? lineSum + usage.qty : lineSum
  ), 0);
}, 0);

const makeId = (parts) => parts.filter(Boolean).join('-');

export const buildPaperStockHistory = (stocks = [], jobs = []) => {
  const transactions = [];

  stocks.forEach((stock) => {
    const paperSource = stock.paperSource || 'Company paper';
    const stockName = stock.name || 'Unnamed Paper';
    const createdAt = stock.createdAt || new Date().toISOString();
    const coverQty = Number(stock.coverQuantity) || 0;
    const innerQty = Number(stock.innerQuantity) || 0;
    const legacyQty = Number(stock.quantity) || 0;

    if (coverQty > 0 || innerQty > 0) {
      if (coverQty > 0) {
        const totalDeducted = sumCoverDeductions(jobs, stock);
        transactions.push({
          _id: makeId(['add-cover', stock._id]),
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
        transactions.push({
          _id: makeId(['add-inner', stock._id]),
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
      transactions.push({
        _id: makeId(['add-legacy', stock._id]),
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
  });

  jobs.forEach((job) => {
    const jobPaperSource = job.paperSource || 'Company paper';

    const cover = getCoverUsage(job);
    if (cover) {
      transactions.push({
        _id: makeId(['deduct-cover', job._id]),
        stockName: cover.paper,
        paperName: cover.paper,
        paperType: 'cover',
        transactionType: 'deduct',
        quantity: cover.qty,
        partyName: job.partyName || job.companyName || '',
        jobNumber: job.jobNumber || '',
        paperSource: jobPaperSource,
        balanceAfter: 0,
        note: 'Job card usage (imported)',
        createdAt: job.createdAt || job.updatedAt || new Date().toISOString(),
      });
    }

    const inner = getInnerUsage(job);
    if (inner) {
      transactions.push({
        _id: makeId(['deduct-inner', job._id]),
        stockName: inner.paper,
        paperName: inner.paper,
        paperType: 'inner',
        transactionType: 'deduct',
        quantity: inner.qty,
        partyName: job.partyName || job.companyName || '',
        jobNumber: job.jobNumber || '',
        paperSource: jobPaperSource,
        balanceAfter: 0,
        note: 'Job card usage (imported)',
        createdAt: job.createdAt || job.updatedAt || new Date().toISOString(),
      });
    }
  });

  return transactions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

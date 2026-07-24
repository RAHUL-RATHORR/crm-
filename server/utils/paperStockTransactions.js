import PaperStockTransaction from '../models/PaperStockTransaction.js';

export const logPaperStockTransaction = async ({
  paperStockId,
  stockName,
  paperName,
  paperType,
  transactionType,
  quantity,
  partyName = '',
  jobNumber = '',
  jobCardId,
  paperSource = 'Company paper',
  challanNo = '',
  invoiceNo = '',
  entryDate,
  balanceAfter = 0,
  note = '',
  createdAt,
}) => {
  const qty = Number(quantity) || 0;
  if (!qty) return;

  const now = new Date();
  const entryDay = entryDate ? new Date(entryDate) : null;

  await PaperStockTransaction.create({
    paperStockId,
    stockName,
    paperName,
    paperType,
    transactionType,
    quantity: qty,
    partyName,
    jobNumber,
    jobCardId: jobCardId || undefined,
    paperSource,
    challanNo: (challanNo || '').trim(),
    invoiceNo: (invoiceNo || '').trim(),
    entryDate: entryDay,
    balanceAfter,
    note,
    createdAt: createdAt || now,
  });
};

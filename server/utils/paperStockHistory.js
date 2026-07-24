import PaperStockTransaction from '../models/PaperStockTransaction.js';
import { logPaperStockTransaction } from './paperStockTransactions.js';

export function buildStockAddHistoryFallback(stock) {
  if (!stock) return [];

  const when = stock.entryDate || stock.createdAt || stock.updatedAt || new Date();
  const stockName = stock.name || 'Unnamed Paper';
  const rows = [];

  const pushRow = (paperType, paperName, partyName, quantity) => {
    rows.push({
      _id: `${stock._id}-${paperType}-fallback`,
      paperStockId: stock._id,
      stockName,
      paperName: paperName || stockName,
      paperType,
      transactionType: 'add',
      quantity: Number(quantity) || 0,
      partyName: (partyName || '').trim(),
      paperSource: stock.paperSource || 'Company paper',
      createdAt: when,
      note: 'From stock record',
    });
  };

  const coverQty = Number(stock.coverQuantity) || 0;
  const innerQty = Number(stock.innerQuantity) || 0;
  const legacyQty = Number(stock.quantity) || 0;

  if (coverQty > 0 || stock.coverGSM || stock.coverName) {
    pushRow('cover', stock.coverName || stockName, stock.coverPartyName, coverQty);
  }
  if (innerQty > 0 || stock.innerGSM || stock.innerName) {
    pushRow('inner', stock.innerName || stockName, stock.innerPartyName, innerQty);
  }
  if (rows.length === 0 && legacyQty > 0) {
    pushRow('cover', stockName, stock.coverPartyName || stock.innerPartyName, legacyQty);
  }
  if (rows.length === 0) {
    pushRow(
      stock.innerGSM ? 'inner' : 'cover',
      stock.coverName || stock.innerName || stockName,
      stock.coverPartyName || stock.innerPartyName,
      0,
    );
  }

  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function ensureStockAddTransactions(stock) {
  if (!stock?._id) return;

  const existing = await PaperStockTransaction.countDocuments({
    paperStockId: stock._id,
    transactionType: 'add',
  });
  if (existing > 0) return;

  const when = stock.entryDate || stock.createdAt || new Date();
  const stockName = stock.name || 'Unnamed Paper';
  const coverQty = Number(stock.coverQuantity) || 0;
  const innerQty = Number(stock.innerQuantity) || 0;
  const legacyQty = Number(stock.quantity) || 0;

  if (coverQty > 0) {
    await logPaperStockTransaction({
      paperStockId: stock._id,
      stockName,
      paperName: stock.coverName || stockName,
      paperType: 'cover',
      transactionType: 'add',
      quantity: coverQty,
      partyName: (stock.coverPartyName || '').trim(),
      paperSource: stock.paperSource || 'Company paper',
      balanceAfter: coverQty,
      note: 'Opening stock (imported)',
      createdAt: when,
    });
  }

  if (innerQty > 0) {
    await logPaperStockTransaction({
      paperStockId: stock._id,
      stockName,
      paperName: stock.innerName || stockName,
      paperType: 'inner',
      transactionType: 'add',
      quantity: innerQty,
      partyName: (stock.innerPartyName || '').trim(),
      paperSource: stock.paperSource || 'Company paper',
      balanceAfter: innerQty,
      note: 'Opening stock (imported)',
      createdAt: when,
    });
  }

  if (coverQty === 0 && innerQty === 0 && legacyQty > 0) {
    await logPaperStockTransaction({
      paperStockId: stock._id,
      stockName,
      paperName: stockName,
      paperType: 'cover',
      transactionType: 'add',
      quantity: legacyQty,
      partyName: (stock.coverPartyName || stock.innerPartyName || '').trim(),
      paperSource: stock.paperSource || 'Company paper',
      balanceAfter: legacyQty,
      note: 'Opening stock (imported)',
      createdAt: when,
    });
  }
}

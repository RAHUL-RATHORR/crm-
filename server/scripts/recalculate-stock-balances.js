import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PaperStock from '../models/PaperStock.js';
import PaperStockTransaction from '../models/PaperStockTransaction.js';
import JobCard from '../models/JobCard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const recalculateAll = async () => {
  await connectDB();
  console.log('Starting full recalculation of Paper Stock balances...');

  const stocks = await PaperStock.find({});
  console.log(`Found ${stocks.length} paper stock items.`);

  for (const stock of stocks) {
    // Get all transactions for this stock item
    const txns = await PaperStockTransaction.find({
      $or: [
        { paperStockId: stock._id },
        { stockName: stock.name, paperSource: stock.paperSource || 'Company paper', paperStockId: { $exists: false } }
      ],
      transactionType: { $in: ['add', 'deduct'] }
    }).sort({ createdAt: 1 }); // Sort OLD to NEW

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

    // Update stock item with the true calculated balance
    let changed = false;
    if (stock.coverQuantity !== currentCover) {
      stock.coverQuantity = currentCover;
      changed = true;
    }
    if (stock.innerQuantity !== currentInner) {
      stock.innerQuantity = currentInner;
      changed = true;
    }
    
    const trueTotal = currentCover + currentInner;
    if (stock.quantity !== trueTotal) {
      stock.quantity = trueTotal;
      changed = true;
    }

    if (changed) {
      console.log(`Updated [${stock.name}]: Cover ${stock.coverQuantity}, Inner ${stock.innerQuantity}, Total ${stock.quantity}`);
      await stock.save();
    }
  }

  console.log('Finished recalculation. ALL missing data should now be restored correctly.');
  process.exit(0);
};

recalculateAll();

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import PaperStockTransaction from '../models/PaperStockTransaction.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await PaperStockTransaction.deleteMany({});
  console.log(`Deleted ${result.deletedCount} paper stock transactions.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

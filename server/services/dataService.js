import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base directory for data
const DATA_DIR = path.join(__dirname, '../data');

// Helper to get file path based on entity type
const getFilePath = (entity) => path.join(DATA_DIR, `${entity}.json`);

// Ensure directory exists
const ensureDirectory = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

// Generic function to read data
export const getAll = async (entity) => {
  try {
    await ensureDirectory();
    const data = await fs.readFile(getFilePath(entity), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return []; // Return empty if file doesn't exist
  }
};

// Generic function to create/save data
export const create = async (entity, recordData, uniqueKey = null) => {
  await ensureDirectory();
  const records = await getAll(entity);
  
  // check for unique key if provided (e.g., jobNumber, invoiceNumber)
  if (uniqueKey && recordData[uniqueKey] && records.some(r => r[uniqueKey] === recordData[uniqueKey])) {
    const error = new Error(`${uniqueKey} already exists`);
    error.code = 11000;
    throw error;
  }

  const newRecord = {
    _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    ...recordData,
    createdAt: new Date().toISOString()
  };
  
  records.push(newRecord);
  await fs.writeFile(getFilePath(entity), JSON.stringify(records, null, 2));
  return newRecord;
};

// Generic function to delete data
export const remove = async (entity, id) => {
  await ensureDirectory();
  let records = await getAll(entity);
  const initialLength = records.length;
  records = records.filter(r => (r._id === id || r.id === id || r.id === Number(id)));
  
  if (records.length === initialLength) return null;
  
  await fs.writeFile(getFilePath(entity), JSON.stringify(records, null, 2));
  return { id };
};

// Generic function to update data
export const update = async (entity, id, updatedData) => {
  await ensureDirectory();
  let records = await getAll(entity);
  const index = records.findIndex(r => (r._id === id || r.id === id || r.id === Number(id)));
  
  if (index === -1) return null;
  
  records[index] = { ...records[index], ...updatedData, updatedAt: new Date().toISOString() };
  await fs.writeFile(getFilePath(entity), JSON.stringify(records, null, 2));
  return records[index];
};

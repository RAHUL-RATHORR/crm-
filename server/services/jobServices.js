import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/jobs.json');

// Ensure directory exists
const ensureDirectory = async () => {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Read jobs from file
export const getAllJobs = async () => {
  try {
    await ensureDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return []; // Return empty array if file doesn't exist
  }
};

// Save a new job
export const createJob = async (jobData) => {
  await ensureDirectory();
  const jobs = await getAllJobs();
  
  const newJob = {
    _id: Date.now().toString(), // Generate a simple ID
    ...jobData,
    createdAt: new Date().toISOString()
  };
  
  // Check for duplicate Job Number
  if (jobData.jobNumber && jobs.some(j => j.jobNumber === jobData.jobNumber)) {
    const error = new Error("Job Number already exists");
    error.code = 11000;
    throw error;
  }
  
  jobs.push(newJob);
  await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2));
  return newJob;
};

// Delete a job
export const deleteJob = async (id) => {
  await ensureDirectory();
  let jobs = await getAllJobs();
  const initialLength = jobs.length;
  jobs = jobs.filter(j => j._id !== id);
  
  if (jobs.length === initialLength) return null;
  
  await fs.writeFile(DATA_FILE, JSON.stringify(jobs, null, 2));
  return { id };
};

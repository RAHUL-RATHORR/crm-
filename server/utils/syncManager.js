import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const CACHE_FILE = path.join(DATA_DIR, 'local_cache.json');
const QUEUE_FILE = path.join(DATA_DIR, 'offline_queue.json');

// Ensure data dir and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CACHE_FILE)) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({}));
}
if (!fs.existsSync(QUEUE_FILE)) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify([]));
}

export const readCache = (route) => {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return cache[route] || null;
  } catch (err) {
    return null;
  }
};

export const writeCache = (route, data) => {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    cache[route] = data;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('Failed to write cache:', err);
  }
};

export const enqueueRequest = (req) => {
  try {
    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    const tempItem = {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      headers: {
        'content-type': 'application/json',
        'authorization': req.headers.authorization || ''
      },
      timestamp: new Date().toISOString(),
      // Temp ID to simulate DB response
      _id: 'offline_' + Date.now() + Math.random().toString(36).substring(7)
    };
    
    queue.push(tempItem);
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    
    // Merge temp ID with original body so the frontend has a complete object
    return { ...req.body, _id: tempItem._id, offline: true };
  } catch (err) {
    console.error('Failed to enqueue request:', err);
    return null;
  }
};

export const processQueue = async (mongoose) => {
  if (mongoose.connection.readyState !== 1) return; // Only process if online
  
  try {
    let queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    if (queue.length === 0) return;

    console.log(`📡 Processing offline queue with ${queue.length} items...`);
    
    let newQueue = [];
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      try {
        const PORT = process.env.PORT || 5011;
        // Add special header so middleware bypasses queueing logic
        const headers = { ...item.headers, 'x-offline-sync': 'true' };
        
        // Ensure body doesn't contain our fake offline _id (so Mongo can assign a real one)
        const requestBody = { ...item.body };
        delete requestBody._id;
        delete requestBody.offline;

        const res = await fetch(`http://127.0.0.1:${PORT}${item.url}`, {
          method: item.method,
          headers: headers,
          body: JSON.stringify(requestBody)
        });
        
        if (!res.ok) {
           console.error(`❌ Failed to sync item ${item.url}: ${res.statusText}`);
           // Keep in queue only if it's a 5xx server error, drop if 4xx validation error
           if (res.status >= 500) {
             newQueue.push(item);
           }
        } else {
           console.log(`✅ Synced item ${item.url}`);
        }
      } catch (err) {
        console.error(`❌ Sync network error for ${item.url}:`, err.message);
        newQueue.push(item); // Keep in queue
      }
    }

    fs.writeFileSync(QUEUE_FILE, JSON.stringify(newQueue, null, 2));
  } catch (err) {
    console.error('Failed to process offline queue:', err);
  }
};

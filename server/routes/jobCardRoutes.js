import express from 'express';
const router = express.Router();
import JobCard from '../models/JobCard.js';
import Notification from '../models/Notification.js';
import DeletedItem from '../models/DeletedItem.js';
import { syncStockFromJobChange } from '../utils/paperStockDeduction.js';

const parsePlateSizes = (value) => {
  if (!value) return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const plateSizeQuery = (normalizedSize) => ({
  $or: [
    { plateSize: normalizedSize },
    { plateSize: new RegExp(`(^|,\\s*)${escapeRegex(normalizedSize)}(,\\s*|$)`) },
  ],
});

const computePlateUseCount = async (plateSize, editingId) => {
  if (!plateSize) return undefined;

  const normalizedSize = String(plateSize).trim();
  const existingCount = await JobCard.countDocuments(plateSizeQuery(normalizedSize));

  if (!editingId) return existingCount + 1;

  const editingCard = await JobCard.findById(editingId).select('plateSize');
  const editingSizes = parsePlateSizes(editingCard?.plateSize);
  if (editingSizes.includes(normalizedSize)) return existingCount;

  return existingCount + 1;
};

// POST /api/jobcard - Save or Update Job Card
router.post('/', async (req, res) => {
  try {
    const { partyName } = req.body;
    let { jobNumber } = req.body;

    // Auto-alias if needed
    if (partyName && !req.body.companyName) {
      req.body.companyName = partyName;
    }

    // Check if updating existing job card
    let jobCard;
    let isUpdate = false;
    const { _id } = req.body;
    let previousJob = null;

    if (_id) {
      previousJob = await JobCard.findById(_id);
    }

    // Keep existing paper fields if update would wipe them with empty values
    if (previousJob) {
      const incomingCoverLines = Array.isArray(req.body.coverPaperLines) ? req.body.coverPaperLines : null;
      const incomingInnerLines = Array.isArray(req.body.innerPaperLines) ? req.body.innerPaperLines : null;
      const coverEmpty = !incomingCoverLines?.length
        && !String(req.body.paper || '').trim()
        && !String(req.body.paperGSM || '').trim()
        && !(Number(req.body.coverPaperCount) > 0)
        && !String(req.body.coverPaperDetails || '').trim();
      const innerEmpty = !incomingInnerLines?.length
        && !String(req.body.innerPaper || '').trim()
        && !String(req.body.innerPaperGSM || '').trim()
        && !(Number(req.body.innerPaperCount) > 0)
        && !String(req.body.innerPaperDetails || '').trim();

      if (coverEmpty) {
        req.body.paper = previousJob.paper;
        req.body.paperGSM = previousJob.paperGSM;
        req.body.coverPaperCount = previousJob.coverPaperCount;
        req.body.coverPaperDetails = previousJob.coverPaperDetails;
        req.body.coverPaperLines = previousJob.coverPaperLines;
      }
      if (innerEmpty) {
        req.body.innerPaper = previousJob.innerPaper;
        req.body.innerPaperGSM = previousJob.innerPaperGSM;
        req.body.innerPaperCount = previousJob.innerPaperCount;
        req.body.innerPaperDetails = previousJob.innerPaperDetails;
        req.body.innerPaperLines = previousJob.innerPaperLines;
      }
    }

    if (req.body.plateSize) {
      const sizes = parsePlateSizes(req.body.plateSize);
      if (sizes.length) {
        req.body.plateSize = sizes.join(', ');
        const counts = await Promise.all(sizes.map((size) => computePlateUseCount(size, _id)));
        req.body.plateUseCount = counts.join(', ');
      } else {
        delete req.body.plateSize;
        delete req.body.plateUseCount;
      }
    }

    if (_id) {
      // UPDATE by _id (most reliable)
      jobCard = await JobCard.findByIdAndUpdate(
        _id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (jobCard) isUpdate = true;
    }

    if (!isUpdate && jobNumber) {
      const existingJob = await JobCard.findOne({ jobNumber });
      if (existingJob) {
        // UPDATE by jobNumber (fallback)
        isUpdate = true;
        previousJob = previousJob || existingJob;
        jobCard = await JobCard.findOneAndUpdate(
          { jobNumber },
          { ...req.body, updatedAt: new Date() },
          { new: true }
        );
      } else {
        // NEW job card with provided jobNumber
        jobCard = new JobCard(req.body);
        await jobCard.save();
      }
    } else if (!isUpdate) {
      // AUTO-GENERATE jobNumber
      const lastJob = await JobCard.findOne().sort({ createdAt: -1 }).select('jobNumber');
      let nextNum = 1;
      if (lastJob && lastJob.jobNumber) {
        const lastNum = parseInt(lastJob.jobNumber.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      const generatedJobNumber = `JOBHR-${String(nextNum).padStart(4, '0')}`;
      req.body.jobNumber = generatedJobNumber;
      jobCard = new JobCard(req.body);
      await jobCard.save();
    }


    // --- AUTO STOCK DEDUCTION LOGIC ---
    try {
      const deductBody = {
        ...req.body,
        _id: jobCard?._id || req.body._id,
        jobNumber: jobCard?.jobNumber || req.body.jobNumber,
      };
      console.log(`📋 Stock deduction input: paper="${deductBody.paper}", paperGSM="${deductBody.paperGSM}", coverPaperCount=${deductBody.coverPaperCount}, paperSource="${deductBody.paperSource}", coverPaperLines=${JSON.stringify(deductBody.coverPaperLines)}, innerPaper="${deductBody.innerPaper}", innerPaperGSM="${deductBody.innerPaperGSM}", innerPaperLines=${JSON.stringify(deductBody.innerPaperLines)}`);
      await syncStockFromJobChange(previousJob, deductBody);
    } catch (stockErr) {
      console.error("⚠️ Stock deduction failed:", stockErr.message);
    }
    // ----------------------------------

    // Create Notification
    try {
      const notifMessage = isUpdate
        ? `Job Card updated: #${jobCard.jobNumber} for ${jobCard.partyName}`
        : `New Job Card created: #${jobCard.jobNumber} for ${jobCard.partyName}`;

      const newNotif = new Notification({
        type: isUpdate ? 'JOB_UPDATED' : 'JOB_CREATED',
        message: notifMessage
      });
      await newNotif.save();
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr.message);
    }

    console.log(`☁️ Job Card Saved to MongoDB: ${jobCard.jobNumber}`);
    res.status(201).json(jobCard);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Job Number already exists" });
    }
    console.error(`❌ Save Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobcard/plate-used-count?plateSize=560*670&editingId=optional
router.get('/plate-used-count', async (req, res) => {
  try {
    const { plateSize, editingId } = req.query;
    if (!plateSize) return res.json({ plateUseCount: '' });

    const plateUseCount = await computePlateUseCount(String(plateSize).trim(), editingId);
    res.json({ plateUseCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobcard - Fetch all Job Cards
router.get('/', async (req, res) => {
  try {
    const jobCards = await JobCard.find().sort({ createdAt: -1 });
    res.json(jobCards);
  } catch (err) {
    console.error(`❌ Fetch Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobcard/:id - Fetch single Job Card
router.get('/:id', async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id);
    if (!jobCard) return res.status(404).json({ error: "Job Card not found" });
    res.json(jobCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobcard/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Job Card not found" });

    // Restore stock before deleting
    try {
      const emptyJob = { coverPaperLines: [], innerPaperLines: [], paper: '', innerPaper: '' };
      await syncStockFromJobChange(doc.toObject(), emptyJob);
      console.log(`📦 Stock restored for deleted job card: ${doc.jobNumber}`);
    } catch (stockErr) {
      console.error(`⚠️ Stock restore on delete failed: ${stockErr.message}`);
    }

    await DeletedItem.create({
      originalId: doc._id,
      collectionName: 'JobCard',
      itemName: doc.jobCardNo || doc.jobName || 'Unknown Job Card',
      itemType: 'Job Card',
      documentData: doc.toObject()
    });
    const result = await JobCard.findByIdAndDelete(req.params.id);
    res.json({ message: "Job Card deleted successfully" });
  } catch (err) {
    console.error(`❌ Delete Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobcard/:id/price - Update only the price/totalAmount
router.patch('/:id/price', async (req, res) => {
  try {
    const { totalAmount } = req.body;
    const jobCard = await JobCard.findByIdAndUpdate(
      req.params.id,
      { totalAmount, updatedAt: new Date() },
      { new: true }
    );

    if (!jobCard) return res.status(404).json({ error: "Job Card not found" });

    // Create Notification
    try {
      const newNotif = new Notification({
        type: 'PRICE_UPDATED',
        message: `Price updated for Job #${jobCard.jobNumber}: ₹${totalAmount}`
      });
      await newNotif.save();
    } catch (nErr) {
      console.error("Notif Error:", nErr.message);
    }

    res.json(jobCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/sync-tally-direct', async (req, res) => {
  try {
    const jobCardData = req.body;
    if (!jobCardData || !jobCardData.partyName) {
      return res.status(400).json({ error: "Invalid Job Card data" });
    }

    const result = await syncJobCardToTally(jobCardData);

    res.json({ message: "Successfully synced to Tally Prime", details: result });
  } catch (err) {
    console.error(`❌ Tally Sync Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
const router = express.Router();
import JobCard from '../models/JobCard.js';
import Notification from '../models/Notification.js';
import PaperStock from '../models/PaperStock.js';

const computePlateUseCount = async (plateSize, editingId) => {
  if (!plateSize) return undefined;

  const normalizedSize = String(plateSize).trim();
  const existingCount = await JobCard.countDocuments({ plateSize: normalizedSize });

  if (!editingId) return existingCount + 1;

  const editingCard = await JobCard.findById(editingId).select('plateSize');
  if (String(editingCard?.plateSize || '').trim() === normalizedSize) return existingCount;

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

    if (req.body.plateSize) {
      req.body.plateSize = String(req.body.plateSize).trim();
      req.body.plateUseCount = await computePlateUseCount(req.body.plateSize, _id);
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
      const { paper, paperGSM, coverPaperCount, innerPaper, innerPaperGSM, innerPaperCount, jobQty, paperSource } = req.body;

      // We only deduct if it's "Company paper" (meaning the printer provides it)
      if (paperSource === "Company paper") {
        // 1. Cover Paper Deduction
        if (paper && paperGSM) {
          const deductQty = Number(coverPaperCount) > 0 ? Number(coverPaperCount) : Number(jobQty);
          if (deductQty > 0) {
            const stockItem = await PaperStock.findOne({
              name: { $regex: new RegExp(`^${paper}$`, 'i') },
              paperSource: "Company paper"
            });

            if (stockItem) {
              if (stockItem.coverGSM === Number(paperGSM)) {
                stockItem.coverQuantity = Math.max(0, stockItem.coverQuantity - deductQty);
                await stockItem.save();
                console.log(`📉 Cover Stock Deducted: ${paper} (${paperGSM} GSM) - ${deductQty} sheets used from coverQuantity.`);
              } else if (stockItem.gsm === Number(paperGSM)) {
                stockItem.quantity = Math.max(0, stockItem.quantity - deductQty);
                await stockItem.save();
                console.log(`📉 Cover Stock Deducted: ${paper} (${paperGSM} GSM) - ${deductQty} sheets used from legacy quantity.`);
              }
            }
          }
        }

        // 2. Inner Paper Deduction
        if (innerPaper && innerPaperGSM && Number(innerPaperCount) > 0) {
          const stockItem = await PaperStock.findOne({
            name: { $regex: new RegExp(`^${innerPaper}$`, 'i') },
            paperSource: "Company paper"
          });

          if (stockItem) {
            if (stockItem.innerGSM === Number(innerPaperGSM)) {
              stockItem.innerQuantity = Math.max(0, stockItem.innerQuantity - Number(innerPaperCount));
              await stockItem.save();
              console.log(`📉 Inner Stock Deducted: ${innerPaper} (${innerPaperGSM} GSM) - ${innerPaperCount} sheets used from innerQuantity.`);
            } else if (stockItem.gsm === Number(innerPaperGSM)) {
              stockItem.quantity = Math.max(0, stockItem.quantity - Number(innerPaperCount));
              await stockItem.save();
              console.log(`📉 Inner Stock Deducted: ${innerPaper} (${innerPaperGSM} GSM) - ${innerPaperCount} sheets used from legacy quantity.`);
            }
          }
        }
      }
    } catch (stockErr) {
      console.error("⚠️ Stock deduction failed:", stockErr.message);
      // We don't fail the whole job creation just because stock update failed
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

// GET /api/jobcard/plate-used-count?plateSize=500*670&editingId=optional
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
    const result = await JobCard.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Job Card not found" });
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

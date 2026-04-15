import express from 'express';
const router = express.Router();
import JobCard from '../models/JobCard.js';
import Notification from '../models/Notification.js';
import PaperStock from '../models/PaperStock.js';

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

    if (jobNumber) {
      const existingJob = await JobCard.findOne({ jobNumber });
      if (existingJob) {
        // UPDATE existing job card
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
    } else {
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
      const { paper, paperGSM, jobQty, paperSource } = req.body;

      // We only deduct if it's "Company paper" (meaning the printer provides it)
      if (paperSource === "Company paper" && paper && paperGSM && jobQty > 0) {
        const stockItem = await PaperStock.findOne({
          name: { $regex: new RegExp(`^${paper}$`, 'i') },
          gsm: Number(paperGSM)
        });

        if (stockItem) {
          stockItem.quantity = Math.max(0, stockItem.quantity - Number(jobQty));
          await stockItem.save();
          console.log(`📉 Stock Deducted: ${paper} (${paperGSM} GSM) - ${jobQty} sheets used.`);
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

export default router;

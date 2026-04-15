import express from 'express';
const router = express.Router();
import JobCard from '../models/JobCard.js';
import Notification from '../models/Notification.js';
import PaperStock from '../models/PaperStock.js';

// POST /api/jobcard - Save or Update Job Card
router.post('/', async (req, res) => {
  try {
    const { jobNumber, partyName } = req.body;

    // Auto-alias if needed
    if (partyName && !req.body.companyName) {
      req.body.companyName = partyName;
    }

    // Check if updating
    let jobCard;
    let isUpdate = false;
    if (jobNumber) {
      const existingJob = await JobCard.findOne({ jobNumber });
      if (existingJob) {
        isUpdate = true;
        jobCard = await JobCard.findOneAndUpdate(
          { jobNumber },
          { ...req.body },
          { new: true }
        );
      } else {
        jobCard = new JobCard(req.body);
        await jobCard.save();
      }
    } else {
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

export default router;

import express from 'express';
const router = express.Router();
import JobCard from '../models/JobCard.js';

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
    if (jobNumber) {
       jobCard = await JobCard.findOneAndUpdate(
        { jobNumber },
        { ...req.body },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      jobCard = new JobCard(req.body);
      await jobCard.save();
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

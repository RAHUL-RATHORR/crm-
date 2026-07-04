import express from 'express';
const router = express.Router();
import Challan from '../models/Challan.js';

// POST /api/challan - Create or Update Challan
router.post('/', async (req, res) => {
  try {
    const { challanNo, paymentType, vehicleNo, state, stateCode, freight } = req.body;
    const payload = {
      ...req.body,
      paymentType: paymentType != null ? String(paymentType) : '',
      vehicleNo: vehicleNo != null ? String(vehicleNo) : '',
      state: state != null ? String(state) : 'Rajasthan',
      stateCode: stateCode != null ? String(stateCode) : '08',
      freight: Number(freight) || 0,
    };

    let challan;
    if (challanNo) {
      challan = await Challan.findOneAndUpdate(
        { challanNo },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      challan = new Challan(payload);
      await challan.save();
    }

    res.status(200).json(challan);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Challan Number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/challan - Fetch all Challans
router.get('/', async (req, res) => {
  try {
    const challans = await Challan.find().sort({ createdAt: -1 });
    res.json(challans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE /api/challan/:id - Update Challan Status
router.put('/:id', async (req, res) => {
  try {
    const updated = await Challan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Challan not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/challan/:id - Delete a Challan
router.delete('/:id', async (req, res) => {
  try {
    const result = await Challan.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Challan not found" });
    res.json({ message: "Challan deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

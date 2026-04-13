import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';

// POST /api/auth/signup - Create a new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Simple check
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json({ message: "User created successfully", user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      if (user) {
        // Record failed attempt
        await new LoginHistory({ userId: user._id, email: user.email, status: 'failed', ip: req.ip, userAgent: req.headers['user-agent'] }).save();
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Record successful login
    await new LoginHistory({ userId: user._id, email: user.email, status: 'success', ip: req.ip, userAgent: req.headers['user-agent'] }).save();

    res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/history - Fetch login history
router.get('/history', async (req, res) => {
  try {
    const history = await LoginHistory.find().sort({ loginTime: -1 }).limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

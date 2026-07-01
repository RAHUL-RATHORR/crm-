import express from 'express';
import User from '../models/User.js';
import Role from '../models/Role.js';
import LoginHistory from '../models/LoginHistory.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email: email?.trim().toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const staffRole = await Role.findOne({ name: 'Staff' });
    const user = await User.create({
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      password: password?.trim(),
      roleId: staffRole?._id,
      roleName: staffRole?.name || 'Staff',
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });

    if (!user || user.password !== password || user.isActive === false) {
      if (user) {
        await new LoginHistory({
          userId: user._id,
          email: user.email,
          status: 'failed',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }).save();
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const role = user.roleId ? await Role.findById(user.roleId) : await Role.findOne({ name: user.roleName });

    await new LoginHistory({
      userId: user._id,
      email: user.email,
      status: 'success',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        team: user.team || '',
        roleId: user.roleId,
        roleName: role?.name || user.roleName || 'Staff',
        permissions: role?.permissions || {},
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, old password and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.password !== oldPassword) {
      return res.status(401).json({ error: 'Old password does not match our records' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await LoginHistory.find().sort({ loginTime: -1 }).limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

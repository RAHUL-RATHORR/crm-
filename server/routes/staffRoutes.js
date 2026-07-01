import express from 'express';
import User from '../models/User.js';
import Role from '../models/Role.js';

const router = express.Router();

const sanitizeUser = (user, role) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile || '',
  team: user.team || '',
  roleId: user.roleId,
  roleName: user.roleName || role?.name || 'Staff',
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  permissions: role?.permissions || {},
});

router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const roles = await Role.find();
    const roleMap = Object.fromEntries(roles.map((r) => [String(r._id), r]));

    res.json(users.map((user) => sanitizeUser(user, roleMap[String(user.roleId)])));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Staff member not found' });
    const role = user.roleId ? await Role.findById(user.roleId) : null;
    res.json(sanitizeUser(user, role));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, password, mobile, team, roleId, isActive } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!password?.trim()) return res.status(400).json({ error: 'Password is required' });

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const role = roleId ? await Role.findById(roleId) : await Role.findOne({ name: 'Staff' });
    if (!role) return res.status(400).json({ error: 'Invalid role selected' });

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      mobile: (mobile || '').trim(),
      team: (team || '').trim(),
      roleId: role._id,
      roleName: role.name,
      isActive: isActive !== false,
    });

    res.status(201).json(sanitizeUser(user, role));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, mobile, team, roleId, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    if (name?.trim()) user.name = name.trim();
    if (email?.trim()) {
      const emailLower = email.trim().toLowerCase();
      const duplicate = await User.findOne({ email: emailLower, _id: { $ne: user._id } });
      if (duplicate) return res.status(400).json({ error: 'Email already exists' });
      user.email = emailLower;
    }
    if (password?.trim()) user.password = password.trim();
    if (mobile !== undefined) user.mobile = String(mobile).trim();
    if (team !== undefined) user.team = String(team).trim();
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) return res.status(400).json({ error: 'Invalid role selected' });
      user.roleId = role._id;
      user.roleName = role.name;
    }
    if (isActive !== undefined) user.isActive = !!isActive;

    await user.save();
    const role = user.roleId ? await Role.findById(user.roleId) : null;
    res.json(sanitizeUser(user, role));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Staff member not found' });

    if (user.email === 'admin@gmail.com') {
      return res.status(400).json({ error: 'Default admin account cannot be deleted' });
    }

    user.isActive = false;
    await user.save();
    res.json({ message: 'Staff member deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

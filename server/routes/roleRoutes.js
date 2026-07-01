import express from 'express';
import Role from '../models/Role.js';
import User from '../models/User.js';
import { emptyPermissions } from '../utils/permissionDefaults.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Role name is required' });

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ error: 'Role already exists' });

    const role = await Role.create({
      name: name.trim(),
      description: (description || '').trim(),
      permissions: permissions || emptyPermissions(),
      isSystem: false,
    });
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    if (name?.trim()) role.name = name.trim();
    if (description !== undefined) role.description = String(description).trim();
    if (permissions) role.permissions = permissions;

    await role.save();

    await User.updateMany({ roleId: role._id }, { roleName: role.name });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    if (role.isSystem) return res.status(400).json({ error: 'System roles cannot be deleted' });

    const inUse = await User.countDocuments({ roleId: role._id, isActive: true });
    if (inUse > 0) return res.status(400).json({ error: 'Role is assigned to active staff members' });

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

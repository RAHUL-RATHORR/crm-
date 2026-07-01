import mongoose from 'mongoose';
import { emptyPermissions } from '../utils/permissionDefaults.js';

const actionSchema = {
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  print: { type: Boolean, default: false },
};

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  isSystem: { type: Boolean, default: false },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: emptyPermissions,
  },
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
export default Role;

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  team: { type: String, default: '' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  roleName: { type: String, default: 'Staff' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;

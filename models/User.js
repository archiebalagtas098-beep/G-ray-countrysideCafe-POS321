import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'manager'],
    default: 'staff',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  phone: String,
  firstName: String,
  lastName: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdBy: String,
  notes: String
}, { 
  timestamps: true,
  collection: 'users'
});

export default mongoose.models.User || mongoose.model('User', userSchema);
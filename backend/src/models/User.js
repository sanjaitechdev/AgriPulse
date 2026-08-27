const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'admin'],
      required: [true, 'Role is required'],
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected'],
      default: 'pending',
    },
    profileCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ta', 'te', 'hi', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa', 'or', 'as'],
      default: 'en',
    },
    avatar: { type: String },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpire: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || 'agripulse_live_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate JWT refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'agripulse_live_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Indexes (email unique index is declared inline with `unique: true`)
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ verificationStatus: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    },
    phone: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: 'Mumbai, Maharashtra'
    },
    rating: {
      type: Number,
      default: 0
    },
    rentalsCount: {
      type: Number,
      default: 0
    },
    bio: {
      type: String,
      default: 'Lover of tech, cameras, and community sharing on Rentify.'
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    verificationToken: {
      type: String
    },
    resetPasswordOtp: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
      }
    ],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    idVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    idDocumentUrl: {
      type: String,
      default: ''
    },
    referralCode: {
      type: String,
      default: () => 'RENT_' + Math.random().toString(36).substring(2, 8).toUpperCase()
    },
    walletBalance: {
      type: Number,
      default: 100
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);

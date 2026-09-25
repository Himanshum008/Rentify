import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1
    },
    minRentalAmount: {
      type: Number,
      default: 0
    },
    maxDiscount: {
      type: Number,
      default: 2000
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 90 * 24 * 60 * 60 * 1000) // 90 days
    },
    usageLimit: {
      type: Number,
      default: 1000
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Coupon', couponSchema);

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    paymentId: {
      type: String
    },
    signature: {
      type: String
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    depositAmount: {
      type: Number,
      default: 0
    },
    rentalFee: {
      type: Number,
      required: true
    },
    serviceFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'refunded', 'partially_refunded', 'failed'],
      default: 'created'
    },
    depositRefundStatus: {
      type: String,
      enum: ['held', 'refunded', 'deducted', 'disputed'],
      default: 'held'
    },
    refundDetails: {
      refundId: String,
      amount: Number,
      reason: String,
      refundedAt: Date
    },
    gateway: {
      type: String,
      default: 'razorpay'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Payment', paymentSchema);

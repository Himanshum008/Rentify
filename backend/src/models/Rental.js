import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      required: [true, 'Please select a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please select an end date']
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1
    },
    dailyPrice: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    securityDeposit: {
      type: Number,
      default: 0
    },
    serviceFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'return_requested', 'returned', 'completed', 'cancelled'],
      default: 'confirmed'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'paid'
    },
    paymentMethod: {
      type: String,
      default: 'UPI / Card (Online)'
    },
    transactionId: {
      type: String,
      default: () => 'TXN_' + Math.random().toString(36).substring(2, 11).toUpperCase()
    },
    depositStatus: {
      type: String,
      enum: ['held', 'refunded', 'deducted', 'disputed'],
      default: 'held'
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    deductionAmount: {
      type: Number,
      default: 0
    },
    conditionBeforePhotos: [
      {
        url: String,
        note: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    conditionAfterPhotos: [
      {
        url: String,
        note: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    agreementSigned: {
      type: Boolean,
      default: false
    },
    agreementSignedAt: {
      type: Date
    },
    pickupChecklist: [
      {
        item: String,
        checked: Boolean
      }
    ],
    returnChecklist: [
      {
        item: String,
        checked: Boolean
      }
    ],
    extensionRequests: [
      {
        extraDays: Number,
        newEndDate: Date,
        additionalAmount: Number,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        requestedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    couponApplied: {
      type: String,
      default: ''
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    lateFee: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Rental', rentalSchema);

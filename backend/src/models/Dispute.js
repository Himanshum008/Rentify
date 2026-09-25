import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      required: true,
      index: true
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'Item Damaged',
        'Missing Accessories',
        'Late Return',
        'Item Not as Described',
        'Unreturned Item',
        'Deposit Not Refunded',
        'Other'
      ]
    },
    description: {
      type: String,
      required: true
    },
    claimAmount: {
      type: Number,
      required: true,
      min: 0
    },
    evidencePhotos: [
      {
        url: String,
        note: String
      }
    ],
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'rejected'],
      default: 'open'
    },
    resolution: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolvedAt: Date,
      resolutionType: {
        type: String,
        enum: ['deposit_deducted', 'full_refund_renter', 'split', 'claim_rejected', 'mutual_agreement']
      },
      deductedAmount: {
        type: Number,
        default: 0
      },
      refundedAmount: {
        type: Number,
        default: 0
      },
      notes: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Dispute', disputeSchema);

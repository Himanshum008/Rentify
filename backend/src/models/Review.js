import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true
    },
    conditionRating: {
      type: Number,
      default: 5
    },
    communicationRating: {
      type: Number,
      default: 5
    },
    accuracyRating: {
      type: Number,
      default: 5
    },
    ownerReply: {
      text: String,
      repliedAt: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Review', reviewSchema);
